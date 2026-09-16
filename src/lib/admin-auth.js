import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function requireAdmin(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
    }

    if (session.user.role?.toLowerCase() !== 'admin') {
      return { error: NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 }) };
    }

    return { session };
  } catch {
    return { error: NextResponse.json({ message: 'Authentication failed' }, { status: 401 }) };
  }
}
