import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-helpers';

export async function GET(request, { params }) {
  try {
    const { error } = await requireSession(request);
    if (error) return error;

    const { email } = await params;
    const collection = await getCollection('follows');

    const iFollowDocs = await collection.find({ followerEmail: email }).toArray();
    const iFollowEmails = new Set(iFollowDocs.map((d) => d.targetEmail));

    const followMeDocs = await collection.find({ targetEmail: email }).toArray();
    const followMeEmails = new Set(followMeDocs.map((d) => d.followerEmail));

    const allEmails = new Set([...iFollowEmails, ...followMeEmails]);

    if (allEmails.size === 0) {
      return NextResponse.json({ success: true, following: [] });
    }

    const profiles = await Promise.all(
      [...allEmails].map((e) => findProfileByEmail(e))
    );

    const validProfiles = profiles.map((p, i) => {
      const email = [...allEmails][i];
      const base = p || {
        email,
        fullName: email.split('@')[0],
        profilePictureUrl: null,
      };
      return {
        ...base,
        isMutual: iFollowEmails.has(email) && followMeEmails.has(email),
      };
    });

    return NextResponse.json({ success: true, following: validProfiles });
  } catch (error) {
    console.error("Error fetching following list:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
