import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ success: false, message: 'Email and role are required.' }, { status: 400 });
    }

    const validRoles = ['Student', 'Alumni'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, message: 'Invalid role.' }, { status: 400 });
    }

    const users = await getCollection('user');
    const result = await users.updateOne(
      { email },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Role updated.' });
  } catch (error) {
    console.error('Set role error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
