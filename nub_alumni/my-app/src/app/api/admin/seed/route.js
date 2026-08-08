import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ message: 'Admin credentials not configured in .env' }, { status: 500 });
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: 'Admin',
      },
    });

    if (result && result.user) {
      return NextResponse.json({
        message: 'Admin account ready',
        email: adminEmail,
      });
    }

    return NextResponse.json({ message: 'Admin account setup complete' });
  } catch (error) {
    if (error.message?.includes('already') || error.message?.includes('exist')) {
      return NextResponse.json({ message: 'Admin account already exists', email: process.env.ADMIN_EMAIL });
    }
    console.error('Admin seed error:', error);
    return NextResponse.json({ message: 'Admin setup failed', error: error.message }, { status: 500 });
  }
}
