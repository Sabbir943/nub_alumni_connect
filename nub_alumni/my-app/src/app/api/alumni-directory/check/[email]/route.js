import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('alumni_directory');
    const profile = await collection.findOne({ email });
    return NextResponse.json({ exists: !!profile, profile: profile || null });
  } catch (error) {
    console.error("Error checking alumni profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
