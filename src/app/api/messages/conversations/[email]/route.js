import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const messagesCol = await getCollection('messages');

    // Find all unique people this user has exchanged messages with
    const sentDocs = await messagesCol
      .find({ senderEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    const receivedDocs = await messagesCol
      .find({ receiverEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    // Build a map of conversation partners with last message info
    const conversations = new Map();

    for (const doc of sentDocs) {
      const partnerEmail = doc.receiverEmail;
      if (!conversations.has(partnerEmail)) {
        conversations.set(partnerEmail, {
          email: partnerEmail,
          lastMessage: doc.text,
          lastMessageAt: doc.createdAt,
          lastMessageBy: doc.senderEmail,
        });
      }
    }

    for (const doc of receivedDocs) {
      const partnerEmail = doc.senderEmail;
      if (!conversations.has(partnerEmail)) {
        conversations.set(partnerEmail, {
          email: partnerEmail,
          lastMessage: doc.text,
          lastMessageAt: doc.createdAt,
          lastMessageBy: doc.senderEmail,
        });
      } else {
        // Update if this message is newer
        const existing = conversations.get(partnerEmail);
        if (new Date(doc.createdAt) > new Date(existing.lastMessageAt)) {
          existing.lastMessage = doc.text;
          existing.lastMessageAt = doc.createdAt;
          existing.lastMessageBy = doc.senderEmail;
        }
      }
    }

    // Fetch profiles for all conversation partners
    const partnerEmails = [...conversations.keys()];
    if (partnerEmails.length === 0) {
      return NextResponse.json({ success: true, conversations: [] });
    }

    const profiles = await Promise.all(
      partnerEmails.map(async (e) => {
        const profile = await findProfileByEmail(e);
        const convo = conversations.get(e);
        const base = profile || {
          email: e,
          fullName: e.split('@')[0],
          profilePictureUrl: null,
        };
        return {
          ...base,
          lastMessage: convo.lastMessage,
          lastMessageAt: convo.lastMessageAt,
          lastMessageBy: convo.lastMessageBy,
        };
      })
    );

    // Sort by last message time (most recent first)
    const validProfiles = profiles
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    return NextResponse.json({ success: true, conversations: validProfiles });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
