import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ isAdmin: false, message: 'Admin not configured' });
    }

    if (email === adminEmail && password === adminPassword) {
      const users = await getCollection('user');
      await users.updateOne(
        { email },
        { $set: { role: 'Admin' } }
      );
      return NextResponse.json({ isAdmin: true, message: 'Admin role assigned' });
    }

    return NextResponse.json({ isAdmin: false });
  } catch (error) {
    console.error('Admin init error:', error);
    return NextResponse.json({ isAdmin: false, message: 'Internal server error' }, { status: 500 });
  }
}
