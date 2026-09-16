import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-helpers';

export async function GET(request, { params }) {
  try {
    const { error, session } = await requireSession(request);
    if (error) return error;

    const { email } = await params;

    // Users can only view their own conversations
    if (session.user.email !== email) {
      return NextResponse.json({ success: false, message: "Forbidden: Can only view your own conversations" }, { status: 403 });
    }

    const messagesCol = await getCollection('messages');

    const sentDocs = await messagesCol
      .find({ senderEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    const receivedDocs = await messagesCol
      .find({ receiverEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

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
        const existing = conversations.get(partnerEmail);
        if (new Date(doc.createdAt) > new Date(existing.lastMessageAt)) {
          existing.lastMessage = doc.text;
          existing.lastMessageAt = doc.createdAt;
          existing.lastMessageBy = doc.senderEmail;
        }
      }
    }

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

    const validProfiles = profiles
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    return NextResponse.json({ success: true, conversations: validProfiles });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
