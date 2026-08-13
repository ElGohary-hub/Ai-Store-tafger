import { MongoClient, Db, MongoClientOptions } from "mongodb";
import dnsPromises from "dns/promises";

const SRV_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "";

if (!SRV_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * For mongodb+srv:// URIs on environments where the system DNS can't resolve
 * SRV records (e.g., Windows with blocked DNS port 53 for SRV):
 *
 * 1. Resolve SRV manually using Google DNS (8.8.8.8)
 * 2. Try each shard node with directConnection=true until one works
 * 3. Prefer nodes that respond (primary or secondary with readPreference=primaryPreferred)
 */
async function resolveAndConnect(): Promise<MongoClient> {
  // If it's not an SRV URI, connect directly
  if (!SRV_URI.startsWith("mongodb+srv://")) {
    const client = new MongoClient(SRV_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      tls: true,
      family: 4,
    });
    await client.connect();
    console.log("[MongoDB] Connected directly ✓");
    return client;
  }

  // Parse the SRV URI
  const match = SRV_URI.match(/mongodb\+srv:\/\/([^:@]+):([^@]+)@([^/?]+)(.*)/);
  if (!match) {
    throw new Error("[MongoDB] Invalid SRV URI format");
  }
  const [, user, pass, host, rest] = match;
  const dbMatch = rest.match(/\/([^?]*)/);
  const dbName = dbMatch ? dbMatch[1] : "aistore";

  // Resolve SRV records using Google DNS
  const resolver = new dnsPromises.Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1"]);

  let srvRecords: { name: string; port: number }[] = [];
  try {
    srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
    console.log(`[MongoDB] Resolved ${srvRecords.length} SRV records via Google DNS`);
  } catch (err) {
    console.warn("[MongoDB] SRV resolution failed:", err);
    throw err;
  }

  // Try each shard with directConnection=true until one succeeds
  const errors: string[] = [];
  for (const record of srvRecords) {
    const nodeUri = `mongodb://${user}:${pass}@${record.name}:${record.port}/${dbName}?authSource=admin&directConnection=true`;
    const nodeOptions: MongoClientOptions = {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 10000,
      tls: true,
      family: 4,
    };

    try {
      const client = new MongoClient(nodeUri, nodeOptions);
      await client.connect();

      // Check if this node can handle reads/writes
      const adminDb = client.db("admin");
      const isMasterResult = await adminDb.command({ isMaster: 1 });

      if (isMasterResult.ismaster) {
        console.log(`[MongoDB] Connected to PRIMARY: ${record.name} ✓`);
        return client;
      } else {
        // It's a secondary - keep it as fallback but continue looking for primary
        console.log(`[MongoDB] Found secondary: ${record.name}, looking for primary...`);
        // Try to reconnect to the actual primary if we know it
        if (isMasterResult.primary) {
          const [primaryHost, primaryPortStr] = isMasterResult.primary.split(":");
          const primaryPort = parseInt(primaryPortStr || "27017");
          const primaryUri = `mongodb://${user}:${pass}@${primaryHost}:${primaryPort}/${dbName}?authSource=admin&directConnection=true`;
          try {
            const primaryClient = new MongoClient(primaryUri, nodeOptions);
            await primaryClient.connect();
            await client.close();
            console.log(`[MongoDB] Connected to identified PRIMARY: ${primaryHost} ✓`);
            return primaryClient;
          } catch (primaryErr) {
            console.warn(`[MongoDB] Primary ${primaryHost} unreachable, using secondary with readPreference`);
            await client.close();
            // Reconnect secondary with readPreference=secondary
            const secondaryUri = `mongodb://${user}:${pass}@${record.name}:${record.port}/${dbName}?authSource=admin&directConnection=true&readPreference=primaryPreferred`;
            const fallbackClient = new MongoClient(secondaryUri, {
              ...nodeOptions,
              serverSelectionTimeoutMS: 30000,
            });
            await fallbackClient.connect();
            console.log(`[MongoDB] Using SECONDARY with primaryPreferred: ${record.name} ✓`);
            return fallbackClient;
          }
        }
        await client.close();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${record.name}: ${msg}`);
      console.warn(`[MongoDB] ${record.name} failed: ${msg.substring(0, 60)}`);
    }
  }

  throw new Error(
    `[MongoDB] Could not connect to any replica set node. Errors:\n${errors.join("\n")}`
  );
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = resolveAndConnect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = resolveAndConnect();
}

export async function getDb(dbName = "aistore"): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;
