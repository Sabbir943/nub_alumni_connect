import { NextResponse } from 'next/server';
import { getCollection, serializeId, findProfileByEmail } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (mode && email) {
      const collection = await getCollection('mentorships');
      const query = mode === 'alumni'
        ? { alumniEmail: email }
        : { studentEmail: email };
      if (status) query.status = status;

      const mentorships = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return NextResponse.json({ success: true, mentorships: serializeId(mentorships), total: mentorships.length });
    }

    const search = searchParams.get('search') || '';

    const alumni = await getCollection('alumni_directory');
    const filter = { isMentor: true };

    if (search) {
      const regex = { $options: 'i' };
      filter.$or = [
        { fullName: { $regex: search, ...regex } },
        { skills: { $regex: search, ...regex } },
        { expertise: { $regex: search, ...regex } },
        { jobTitle: { $regex: search, ...regex } },
        { organization: { $regex: search, ...regex } },
        { degree: { $regex: search, ...regex } }
      ];
    }

    const mentors = await alumni
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, mentors: serializeId(mentors), total: mentors.length });
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { studentEmail, alumniEmail, expertise, message } = await request.json();

    if (!studentEmail || !alumniEmail) {
      return NextResponse.json({ success: false, message: "studentEmail and alumniEmail are required." }, { status: 400 });
    }

    if (studentEmail === alumniEmail) {
      return NextResponse.json({ success: false, message: "You cannot request mentorship from yourself." }, { status: 400 });
    }

    const collection = await getCollection('mentorships');

    const existingPending = await collection.findOne({
      studentEmail,
      alumniEmail,
      status: { $in: ['pending', 'active'] }
    });
    if (existingPending) {
      return NextResponse.json(
        { success: false, message: "You already have an active or pending mentorship with this alumni." },
        { status: 409 }
      );
    }

    const studentProfile = await findProfileByEmail(studentEmail);
    const alumniProfile = await findProfileByEmail(alumniEmail);

    const now = new Date();
    const mentorship = {
      studentEmail,
      studentName: studentProfile?.fullName || studentEmail.split('@')[0],
      alumniEmail,
      alumniName: alumniProfile?.fullName || alumniEmail.split('@')[0],
      expertise: expertise || '',
      message: message || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(mentorship);

    try {
      const notifications = await getCollection('notifications');
      await notifications.insertOne({
        recipientEmail: alumniEmail,
        type: 'mentorship_request',
        actorEmail: studentEmail,
        actorName: mentorship.studentName,
        message: `${mentorship.studentName} sent you a mentorship request`,
        link: '/dashboard/alumni/mentorshipHub',
        read: false,
        createdAt: now,
      });
    } catch (e) {
      console.error("Mentorship request notification error:", e.message);
    }

    return NextResponse.json({
      success: true,
      message: "Mentorship request sent",
      mentorship: { ...mentorship, _id: result.insertedId.toString() }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating mentorship request:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}