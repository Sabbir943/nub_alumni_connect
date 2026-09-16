import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-helpers';

export async function POST(request) {
  try {
    const { error, session } = await requireSession(request);
    if (error) return error;

    const { receiverEmail, text } = await request.json();
    const senderEmail = session.user.email;

    if (!receiverEmail || !text) {
      return NextResponse.json({ success: false, message: "receiverEmail and text are required" }, { status: 400 });
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return NextResponse.json({ success: false, message: "Message cannot be empty" }, { status: 400 });
    }
    if (trimmedText.length > 2000) {
      return NextResponse.json({ success: false, message: "Message too long (max 2000 characters)" }, { status: 400 });
    }

    const collection = await getCollection('messages');
    const newMessage = {
      senderEmail, receiverEmail, text: trimmedText,
      read: false,
      createdAt: new Date().toISOString()
    };

    const result = await collection.insertOne(newMessage);

    try {
      const senderProfile = await findProfileByEmail(senderEmail);
      const senderName = senderProfile?.fullName || senderEmail.split('@')[0];
      const notifications = await getCollection('notifications');
      const recentFromSender = await notifications.findOne({
        recipientEmail: receiverEmail,
        type: 'message',
        actorEmail: senderEmail,
        read: false,
      });
      if (!recentFromSender) {
        await notifications.insertOne({
          recipientEmail: receiverEmail,
          type: 'message',
          actorEmail: senderEmail,
          actorName: senderName,
          message: `${senderName} sent you a message`,
          link: `/dashboard`,
          read: false,
          createdAt: new Date(),
        });
      }
    } catch (e) {
      console.error("Message notification error:", e.message);
    }

    return NextResponse.json({ success: true, message: { ...newMessage, _id: result.insertedId } }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
