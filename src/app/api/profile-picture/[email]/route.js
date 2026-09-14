import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const students = await getCollection('students');
    let profile = await students.findOne({ email });

    if (!profile) {
      const alumni = await getCollection('alumni_directory');
      profile = await alumni.findOne({ email });
    }

    return NextResponse.json({
      profilePictureUrl: profile?.profilePictureUrl || null,
    });
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    return NextResponse.json({ profilePictureUrl: null });
  }
}
