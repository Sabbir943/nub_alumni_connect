import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

let client;
let clientPromise;

if (!globalThis._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI);
  globalThis._mongoClientPromise = client.connect();
}
clientPromise = globalThis._mongoClientPromise;

const connectedClient = await clientPromise;
const db = connectedClient.db("nub_alumni");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustHost: true,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      role: {
        default: "Student"
      },
    }
  },
  database: mongodbAdapter(db, {
    client: connectedClient
  }),
});