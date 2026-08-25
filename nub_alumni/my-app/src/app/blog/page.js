'use client';

import { authClient } from '@/lib/auth-client';
import BlogFeed from '@/component/BlogFeed';

export default function BlogPage() {
  const { data: session } = authClient.useSession();
  const email = session?.user?.email || '';

  return <BlogFeed currentUserEmail={email} />;
}
