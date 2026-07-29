import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { analyzeProfile } from '@/lib/verify';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('alumni_directory');
    const profile = await collection.findOne({ email });
    if (!profile) {
      return NextResponse.json({ message: "Alumni profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching alumni profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { email } = await params;
    const updateData = await request.json();

    delete updateData.email;
    delete updateData._id;
    delete updateData.createdAt;
    updateData.updatedAt = new Date();

    const collection = await getCollection('alumni_directory');
    const result = await collection.findOneAndUpdate(
      { email },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (result) {
      try {
        const verification = await analyzeProfile(result, 'alumni');
        await collection.updateOne(
          { email },
          { $set: { verification } }
        );
      } catch (e) {
        console.error("Verification failed during update:", e.message);
      }
    }

    const updatedProfile = await collection.findOne({ email });
    return NextResponse.json({ message: "Alumni profile updated", profile: updatedProfile });
  } catch (error) {
    console.error("Error updating alumni profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
