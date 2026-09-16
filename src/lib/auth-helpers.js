import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function requireSession(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
    }

    return { session };
  } catch {
    return { error: NextResponse.json({ message: 'Authentication failed' }, { status: 401 }) };
  }
}

export async function requireOwnership(request, resourceEmail) {
  const { error, session } = await requireSession(request);
  if (error) return { error };

  // Admin can access anything
  if (session.user.role?.toLowerCase() === 'admin') {
    return { session, isOwner: true, isAdmin: true };
  }

  // Check ownership
  const isOwner = session.user.email === resourceEmail;
  if (!isOwner) {
    return { error: NextResponse.json({ message: 'Forbidden: You can only access your own resources' }, { status: 403 }) };
  }

  return { session, isOwner: true, isAdmin: false };
}
