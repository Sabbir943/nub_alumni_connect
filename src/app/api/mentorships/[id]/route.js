import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-helpers';

const VALID_TRANSITIONS = {
  accept: 'active',
  complete: 'completed',
  decline: 'declined',
  cancel: 'declined',
};

export async function PATCH(request, { params }) {
  try {
    const { error, session } = await requireSession(request);
    if (error) return error;

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid mentorship id" }, { status: 400 });
    }

    const { action } = await request.json();
    const status = VALID_TRANSITIONS[action];
    if (!status) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const collection = await getCollection('mentorships');
    const mentorship = await collection.findOne({ _id: new ObjectId(id) });
    if (!mentorship) {
      return NextResponse.json({ success: false, message: "Mentorship not found" }, { status: 404 });
    }

    // Only the involved parties can update
    const userEmail = session.user.email;
    const isAdmin = session.user.role?.toLowerCase() === 'admin';
    if (userEmail !== mentorship.studentEmail && userEmail !== mentorship.alumniEmail && !isAdmin) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // Alumni can only accept/decline, students can only cancel
    if (action === 'accept' || action === 'decline') {
      if (userEmail !== mentorship.alumniEmail && !isAdmin) {
        return NextResponse.json({ success: false, message: "Only alumni can accept/decline" }, { status: 403 });
      }
    }
    if (action === 'cancel') {
      if (userEmail !== mentorship.studentEmail && !isAdmin) {
        return NextResponse.json({ success: false, message: "Only students can cancel" }, { status: 403 });
      }
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date(), reviewedAt: new Date() } },
      { returnDocument: 'after' }
    );

    try {
      const notifications = await getCollection('notifications');

      if (action === 'accept') {
        await notifications.insertOne({
          recipientEmail: mentorship.studentEmail,
          type: 'mentorship_accepted',
          actorEmail: mentorship.alumniEmail,
          actorName: mentorship.alumniName,
          message: `${mentorship.alumniName} accepted your mentorship request`,
          link: '/dashboard/students/my-mentorship',
          read: false,
          createdAt: new Date(),
        });
      } else if (action === 'decline') {
        await notifications.insertOne({
          recipientEmail: mentorship.studentEmail,
          type: 'mentorship_declined',
          actorEmail: mentorship.alumniEmail,
          actorName: mentorship.alumniName,
          message: `${mentorship.alumniName} declined your mentorship request`,
          link: '/dashboard/students/find-mentors',
          read: false,
          createdAt: new Date(),
        });
      }
    } catch (e) {
      console.error("Mentorship status notification error:", e.message);
    }

    return NextResponse.json({
      success: true,
      message: `Mentorship ${status}`,
      mentorship: { ...result, _id: result._id.toString() }
    });
  } catch (error) {
    console.error("Error updating mentorship:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
