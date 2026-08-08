import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request) {
  try {
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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const { ObjectId } = await import('mongodb');
    const users = await getCollection('user');
    const result = await users.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
