import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || "";

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local and in Vercel project settings."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve the connection across HMR reloads
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production (Vercel), create a fresh client per module load.
  // Vercel caches the module between warm invocations, so this
  // effectively reuses the connection on warm starts without
  // relying on the `global` object across isolated containers.
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(dbName = "aistore"): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;
