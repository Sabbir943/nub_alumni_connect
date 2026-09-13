import { NextResponse } from 'next/server';
import { getCollection, serializeId, ObjectId } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const groups = await getCollection('group_conversations');
    const group = await groups.findOne({ _id: new ObjectId(id) });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    if (email && !group.participants.some((p) => p.email === email)) {
      return NextResponse.json({ message: 'Not a member of this group' }, { status: 403 });
    }

    return NextResponse.json({ success: true, group: serializeId(group) });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { name, avatar, email } = await request.json();

    const groups = await getCollection('group_conversations');
    const group = await groups.findOne({ _id: new ObjectId(id) });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    const participant = group.participants.find((p) => p.email === email);
    if (!participant || participant.role !== 'admin') {
      return NextResponse.json({ message: 'Only admins can update the group' }, { status: 403 });
    }

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (avatar !== undefined) update.avatar = avatar;

    await groups.updateOne({ _id: new ObjectId(id) }, { $set: update });
    const updated = await groups.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, group: serializeId(updated) });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const groups = await getCollection('group_conversations');
    const group = await groups.findOne({ _id: new ObjectId(id) });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    if (group.createdBy !== email) {
      return NextResponse.json({ message: 'Only the creator can delete the group' }, { status: 403 });
    }

    const groupMessages = await getCollection('group_messages');
    await groupMessages.deleteMany({ groupId: new ObjectId(id) });
    await groups.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
