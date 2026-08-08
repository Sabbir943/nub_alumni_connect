import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { analyzeProfile } from '@/lib/verify';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fullName, email, studentId, department, semester, batch,
      phone, profilePictureUrl, githubUrl, linkedinUrl, skills, bio, location
    } = body;

    if (!email || !fullName || !studentId) {
      return NextResponse.json({ message: "Full Name, Email, and Student ID are required." }, { status: 400 });
    }

    const collection = await getCollection('students');

    const existingEmail = await collection.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ message: "Profile already exists. Use PATCH to update." }, { status: 409 });
    }

    const existingId = await collection.findOne({ studentId });
    if (existingId) {
      return NextResponse.json({ message: "Student ID is already registered." }, { status: 409 });
    }

    const now = new Date();
    const newStudent = {
      fullName, email, studentId,
      department: department || "",
      semester: semester || "",
      batch: batch || "",
      phone: phone || "",
      profilePictureUrl: profilePictureUrl || "",
      githubUrl: githubUrl || "",
      linkedinUrl: linkedinUrl || "",
      skills: skills || "",
      bio: bio || "",
      location: location || "",
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(newStudent);

    let verification = null;
    try {
      verification = await analyzeProfile(newStudent, 'student');
      await collection.updateOne(
        { email },
        { $set: { verification } }
      );
    } catch (e) {
      console.error("Verification failed during creation:", e.message);
    }

    const profile = await collection.findOne({ email });

    return NextResponse.json({
      message: "Student profile created successfully",
      profileId: result.insertedId,
      profile
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating student profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
