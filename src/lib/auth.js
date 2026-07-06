import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("nub-alumni");

export const auth = betterAuth({
     emailAndPassword: { 
     enabled: true, 
  }, 
  socialProviders: { 
    github: { 
      clientId: process.env.GITHUB_CLIENT_ID , 
      clientSecret: process.env.GITHUB_CLIENT_SECRET , 
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
    // Optional: if you don't provide a client, database transactions won't be enabled.
    client
  }),
});