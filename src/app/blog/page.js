'use client';

import { authClient } from '@/lib/auth-client';
import BlogFeed from '@/component/BlogFeed';

export default function BlogPage() {
  const { data: session } = authClient.useSession();
  const email = session?.user?.email || '';
  const role = session?.user?.role || '';

  return <BlogFeed currentUserEmail={email} currentUserRole={role} />;
}
