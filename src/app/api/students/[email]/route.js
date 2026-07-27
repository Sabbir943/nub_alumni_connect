import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('students');
    const profile = await collection.findOne({ email });

    if (!profile) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { email } = await params;
    const updateData = await request.json();

    const collection = await getCollection('students');
    const existingProfile = await collection.findOne({ email });
    if (!existingProfile) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 });
    }

    if (updateData.studentId && updateData.studentId !== existingProfile.studentId) {
      const studentIdTaken = await collection.findOne({
        studentId: updateData.studentId,
        email: { $ne: email }
      });
      if (studentIdTaken) {
        return NextResponse.json({ message: "Student ID is already in use by another student." }, { status: 409 });
      }
    }

    delete updateData.email;
    delete updateData._id;
    delete updateData.createdAt;
    updateData.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { email },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return NextResponse.json({
      message: "Student profile updated successfully",
      profile: result
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
