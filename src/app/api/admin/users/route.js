import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const users = await getCollection('user');
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const total = await users.countDocuments(query);
    const userList = await users.find(query, {
      projection: { name: 1, email: 1, role: 1, image: 1, emailVerified: 1, createdAt: 1 },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      users: userList.map(u => ({ ...u, _id: u._id.toString() })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { error, session } = await requireAdmin(request);
    if (error) return error;

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ message: 'User ID and role are required' }, { status: 400 });
    }

    const validRoles = ['Student', 'Alumni', 'Admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const { ObjectId } = await import('mongodb');
    const users = await getCollection('user');

    // Prevent admin from demoting themselves
    if (session.user.id === userId && role !== 'Admin') {
      return NextResponse.json({ message: 'Cannot change your own admin role' }, { status: 400 });
    }

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } }
    );

    return NextResponse.json({ message: 'User role updated', userId, role });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { error, session } = await requireAdmin(request);
    if (error) return error;

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const { ObjectId } = await import('mongodb');
    const users = await getCollection('user');
    const userDoc = await users.findOne({ _id: new ObjectId(userId) });

    if (!userDoc) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (session.user.id === userId) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    const userEmail = userDoc.email;

    // Cascade delete: remove user data from all related collections
    const collectionsToClean = [
      { name: 'alumni_directory', query: { email: userEmail } },
      { name: 'students', query: { email: userEmail } },
      { name: 'session', query: { userId: userId } },
      { name: 'account', query: { userId: userId } },
      { name: 'blog_posts', query: { authorEmail: userEmail } },
      { name: 'blog_comments', query: { authorEmail: userEmail } },
      { name: 'jobs', query: { postedBy: userEmail } },
      { name: 'follows', query: { $or: [{ followerEmail: userEmail }, { followingEmail: userEmail }] } },
      { name: 'messages', query: { $or: [{ senderEmail: userEmail }, { receiverEmail: userEmail }] } },
      { name: 'notifications', query: { userEmail: userEmail } },
      { name: 'calls', query: { $or: [{ callerEmail: userEmail }, { receiverEmail: userEmail }] } },
      { name: 'mentorships', query: { $or: [{ studentEmail: userEmail }, { alumniEmail: userEmail }] } },
      { name: 'contacts', query: { email: userEmail } },
      { name: 'reports', query: { $or: [{ reporterEmail: userEmail }, { targetEmail: userEmail }] } },
    ];

    for (const { name, query } of collectionsToClean) {
      try {
        const col = await getCollection(name);
        await col.deleteMany(query);
      } catch (e) {
        console.error(`Cascade delete failed for collection ${name}:`, e);
      }
    }

    // Finally delete the user record itself
    await users.deleteOne({ _id: new ObjectId(userId) });

    return NextResponse.json({ message: 'User and all related data deleted' });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
