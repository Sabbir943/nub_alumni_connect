import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail, serializeId } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ message: 'email is required' }, { status: 400 });
    }

    const groups = await getCollection('group_conversations');
    const myGroups = await groups
      .find({ 'participants.email': email })
      .sort({ lastMessageAt: -1 })
      .toArray();

    const groupsWithMeta = await Promise.all(
      myGroups.map(async (group) => {
        const participantProfiles = await Promise.all(
          group.participants.slice(0, 10).map(async (p) => {
            const profile = await findProfileByEmail(p.email);
            return {
              email: p.email,
              role: p.role,
              joinedAt: p.joinedAt,
              name: profile?.fullName || p.email.split('@')[0],
              avatar: profile?.profilePictureUrl || null,
            };
          })
        );

        const unreadMessages = await getCollection('group_messages');
        const lastRead = await unreadMessages.findOne(
          { groupId: group._id, 'readBy.email': email },
          { sort: { createdAt: -1 }, projection: { createdAt: 1 } }
        );
        const unreadCount = await unreadMessages.countDocuments({
          groupId: group._id,
          senderEmail: { $ne: email },
          createdAt: lastRead ? { $gt: lastRead.createdAt } : { $exists: true },
          'readBy.email': { $ne: email },
        });

        return {
          ...serializeId(group),
          type: 'group',
          participantProfiles,
          participantCount: group.participants.length,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ success: true, groups: groupsWithMeta });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, avatar, participantEmails, creatorEmail } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Group name is required' }, { status: 400 });
    }
    if (!creatorEmail) {
      return NextResponse.json({ message: 'creatorEmail is required' }, { status: 400 });
    }

    const allEmails = [...new Set([creatorEmail, ...(participantEmails || [])])];

    if (allEmails.length < 2) {
      return NextResponse.json({ message: 'A group needs at least 2 members' }, { status: 400 });
    }

    const participants = allEmails.map((email) => ({
      email,
      role: email === creatorEmail ? 'admin' : 'member',
      joinedAt: new Date(),
    }));

    const groups = await getCollection('group_conversations');
    const result = await groups.insertOne({
      name: name.trim(),
      avatar: avatar || null,
      participants,
      createdBy: creatorEmail,
      createdAt: new Date(),
      lastMessage: null,
      lastMessageAt: null,
      lastMessageBy: null,
    });

    const newGroup = await groups.findOne({ _id: result.insertedId });

    return NextResponse.json({ success: true, group: serializeId(newGroup) }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
