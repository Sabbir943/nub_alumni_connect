import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail, serializeId, ObjectId } from '@/lib/mongodb';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { email, adminEmail } = await request.json();

    if (!email || !adminEmail) {
      return NextResponse.json({ message: 'email and adminEmail are required' }, { status: 400 });
    }

    const groups = await getCollection('group_conversations');
    const group = await groups.findOne({ _id: new ObjectId(id) });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    const admin = group.participants.find((p) => p.email === adminEmail);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Only admins can add participants' }, { status: 403 });
    }

    if (group.participants.some((p) => p.email === email)) {
      return NextResponse.json({ message: 'User is already a member' }, { status: 409 });
    }

    const newParticipant = { email, role: 'member', joinedAt: new Date() };
    await groups.updateOne(
      { _id: new ObjectId(id) },
      { $push: { participants: newParticipant } }
    );

    const messages = await getCollection('group_messages');
    const profile = await findProfileByEmail(email);
    const systemMsg = {
      groupId: new ObjectId(id),
      senderEmail: 'system',
      text: `${profile?.fullName || email.split('@')[0]} joined the group`,
      type: 'system',
      readBy: [],
      createdAt: new Date(),
    };
    await messages.insertOne(systemMsg);

    return NextResponse.json({ success: true, participant: newParticipant });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { email, targetEmail } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'email is required' }, { status: 400 });
    }

    const groups = await getCollection('group_conversations');
    const group = await groups.findOne({ _id: new ObjectId(id) });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    const isSelfLeave = !targetEmail || targetEmail === email;
    const isAdmin = group.participants.find((p) => p.email === email)?.role === 'admin';

    if (!isSelfLeave && !isAdmin) {
      return NextResponse.json({ message: 'Only admins can remove participants' }, { status: 403 });
    }

    const removeEmail = isSelfLeave ? email : targetEmail;

    if (removeEmail === group.createdBy && isSelfLeave) {
      return NextResponse.json({ message: 'Creator cannot leave the group. Delete it instead.' }, { status: 400 });
    }

    await groups.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { participants: { email: removeEmail } } }
    );

    const messages = await getCollection('group_messages');
    const profile = await findProfileByEmail(removeEmail);
    const systemMsg = {
      groupId: new ObjectId(id),
      senderEmail: 'system',
      text: isSelfLeave
        ? `${profile?.fullName || removeEmail.split('@')[0]} left the group`
        : `${profile?.fullName || removeEmail.split('@')[0]} was removed from the group`,
      type: 'system',
      readBy: [],
      createdAt: new Date(),
    };
    await messages.insertOne(systemMsg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
