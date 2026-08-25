import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('follows');

    // Get people I follow
    const iFollowDocs = await collection.find({ followerEmail: email }).toArray();
    const iFollowEmails = new Set(iFollowDocs.map((d) => d.targetEmail));

    // Get people who follow me
    const followMeDocs = await collection.find({ targetEmail: email }).toArray();
    const followMeEmails = new Set(followMeDocs.map((d) => d.followerEmail));

    // Combine: people I follow + people who follow me (bidirectional discovery)
    const allEmails = new Set([...iFollowEmails, ...followMeEmails]);

    if (allEmails.size === 0) {
      return NextResponse.json({ success: true, following: [] });
    }

    const profiles = await Promise.all(
      [...allEmails].map((e) => findProfileByEmail(e))
    );

    // Mark mutual follows so UI can distinguish
    const validProfiles = profiles.filter(Boolean).map((p) => ({
      ...p,
      isMutual: iFollowEmails.has(p.email) && followMeEmails.has(p.email),
    }));

    return NextResponse.json({ success: true, following: validProfiles });
  } catch (error) {
    console.error("Error fetching following list:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
