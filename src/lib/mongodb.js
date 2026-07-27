import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'nub_alumni';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export function serializeId(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(serializeId);
  return { ...doc, _id: doc._id?.toString?.() || doc._id };
}

export async function getCollection(name) {
  const { db } = await connectToDatabase();
  return db.collection(name);
}

export async function findProfileByEmail(email) {
  const students = await getCollection('students');
  const alumni = await getCollection('alumni_directory');

  const student = await students.findOne({ email });
  if (student) return { ...serializeId(student), _source: 'student' };

  const alumniDoc = await alumni.findOne({ email });
  if (alumniDoc) return { ...serializeId(alumniDoc), _source: 'alumni_directory' };

  return null;
}

export { ObjectId };
