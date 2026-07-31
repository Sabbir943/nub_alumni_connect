import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { senderEmail, receiverEmail, text } = await request.json();
    if (!senderEmail || !receiverEmail || !text) {
      return NextResponse.json({ success: false, message: "senderEmail, receiverEmail, and text are required" }, { status: 400 });
    }

    const collection = await getCollection('messages');
    const newMessage = {
      senderEmail, receiverEmail, text,
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
          link: `/dashboard/alumni/text?chatWith=${senderEmail}`,
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
