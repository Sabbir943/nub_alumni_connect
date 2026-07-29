import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { analyzeProfile } from '@/lib/verify';

export async function POST(request) {
  try {
    const { profile, type } = await request.json();
    if (!profile || !type || !['alumni', 'student'].includes(type)) {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }

    const verification = await analyzeProfile(profile, type);

    const collectionName = type === 'alumni' ? 'alumni_directory' : 'students';
    const collection = await getCollection(collectionName);
    await collection.updateOne(
      { email: profile.email },
      { $set: { verification, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: "Profile verified", verification });
  } catch (error) {
    console.error("Error verifying profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type');
    if (!email || !type) {
      return NextResponse.json({ message: "Email and type are required." }, { status: 400 });
    }
    const collectionName = type === 'alumni' ? 'alumni_directory' : 'students';
    const collection = await getCollection(collectionName);
    const profile = await collection.findOne({ email }, { projection: { verification: 1 } });
    if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    return NextResponse.json({ verification: profile.verification || null });
  } catch (error) {
    console.error("Error fetching verification:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
