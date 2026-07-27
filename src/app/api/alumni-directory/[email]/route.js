import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

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

    return NextResponse.json({ message: "Alumni profile updated", profile: result });
  } catch (error) {
    console.error("Error updating alumni profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
