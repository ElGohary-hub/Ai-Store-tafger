import { MongoClient, Db, MongoClientOptions } from "mongodb";
import dnsPromises from "dns/promises";
import dns from "dns";

// Global DNS configuration for Node environments
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // Ignore in restricted environments
}

const rawUri = process.env.MONGODB_URI || process.env.DATABASE_URL || "";

if (!rawUri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local and in Vercel project settings."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const baseOptions: MongoClientOptions = {
  tls: true,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  maxPoolSize: 20,
  minPoolSize: 1,
  maxIdleTimeMS: 120000,
};

/**
 * Connects to MongoDB with automatic SRV resolution via Google/Cloudflare DNS
 * to prevent Windows DNS "querySrv ECONNREFUSED" issues.
 */
async function resolveAndConnect(): Promise<MongoClient> {
  // 1. If it's already a direct replica-set URI (mongodb://), connect directly
  if (!rawUri.startsWith("mongodb+srv://")) {
    const client = new MongoClient(rawUri, baseOptions);
    return await client.connect();
  }

  // 2. If it's an SRV URI (mongodb+srv://), parse and resolve shards via reliable DNS
  const match = rawUri.match(/mongodb\+srv:\/\/([^:@]+):([^@]+)@([^/?]+)(.*)/);
  if (!match) {
    const fallbackClient = new MongoClient(rawUri, baseOptions);
    return await fallbackClient.connect();
  }

  const [, user, pass, host, rest] = match;
  const dbMatch = rest.match(/\/([^?]*)/);
  const dbName = dbMatch && dbMatch[1] ? dbMatch[1] : "aistore";

  let srvRecords: { name: string; port: number }[] = [];
  try {
    const resolver = new dnsPromises.Resolver();
    resolver.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
  } catch (dnsErr) {
    console.warn("[MongoDB] Manual SRV DNS lookup failed, falling back to driver:", dnsErr);
  }

  if (srvRecords && srvRecords.length > 0) {
    const hostList = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    const multiUri = `mongodb://${encodeURIComponent(decodeURIComponent(user))}:${encodeURIComponent(decodeURIComponent(pass))}@${hostList}/${dbName}?ssl=true&authSource=admin&retryWrites=true&w=majority`;

    try {
      const client = new MongoClient(multiUri, baseOptions);
      return await client.connect();
    } catch (multiErr) {
      console.warn("[MongoDB] Multi-host connect failed, trying fallback:", multiErr);
    }
  }

  // Final fallback directly with raw SRV URI
  const fallbackClient = new MongoClient(rawUri, baseOptions);
  return await fallbackClient.connect();
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = resolveAndConnect().catch((err) => {
      console.error("[MongoDB] Connection Error:", err.message);
      global._mongoClientPromise = undefined; // Allow retry on next request
      throw err;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Production / Serverless
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = resolveAndConnect();
  }
  clientPromise = global._mongoClientPromise;
}

export async function getDb(dbName = "aistore"): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;
