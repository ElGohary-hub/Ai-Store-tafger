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
 * Robust, high-speed connection resolver for MongoDB Atlas:
 * 1. Resolves SRV shard records via Google / Cloudflare DNS.
 * 2. Connects to replica set with persistent connection pool.
 */
async function resolveAndConnect(): Promise<MongoClient> {
  const baseOptions: MongoClientOptions = {
    tls: true,
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 30000,
    maxPoolSize: 20,
    minPoolSize: 2,
    maxIdleTimeMS: 120000,
    family: 4,
  };

  // If non-SRV URI, connect directly
  if (!SRV_URI.startsWith("mongodb+srv://")) {
    const client = new MongoClient(SRV_URI, baseOptions);
    await client.connect();
    return client;
  }

  // Parse SRV URI
  const match = SRV_URI.match(/mongodb\+srv:\/\/([^:@]+):([^@]+)@([^/?]+)(.*)/);
  if (!match) {
    throw new Error("[MongoDB] Invalid SRV URI format");
  }
  const [, user, pass, host, rest] = match;
  const dbMatch = rest.match(/\/([^?]*)/);
  const dbName = dbMatch ? dbMatch[1] : "aistore";

  let srvRecords: { name: string; port: number }[] = [];
  try {
    const resolver = new dnsPromises.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);
    srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
  } catch (dnsErr) {
    console.warn("[MongoDB] DNS resolution failed, trying fallback...", dnsErr);
  }

  if (srvRecords && srvRecords.length > 0) {
    // 1. Try unified replica set connection
    const hostList = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    const multiUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hostList}/${dbName}?ssl=true&authSource=admin&retryWrites=true&w=majority`;

    try {
      const client = new MongoClient(multiUri, baseOptions);
      await client.connect();
      return client;
    } catch (multiErr) {
      console.warn("[MongoDB] Multi-host connect failed, trying individual nodes...", multiErr);
      // 2. Fallback to trying individual shard nodes
      for (const record of srvRecords) {
        const singleUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${record.name}:${record.port}/${dbName}?authSource=admin&directConnection=true&ssl=true`;
        try {
          const singleClient = new MongoClient(singleUri, baseOptions);
          await singleClient.connect();
          return singleClient;
        } catch {
          // try next node
        }
      }
    }
  }

  // Final fallback
  const fallbackClient = new MongoClient(SRV_URI, baseOptions);
  await fallbackClient.connect();
  return fallbackClient;
}

let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  global._mongoClientPromise = resolveAndConnect();
}
clientPromise = global._mongoClientPromise;

export async function getDb(dbName = "aistore"): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;
