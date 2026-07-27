import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

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
    return NextResponse.json({ success: true, message: { ...newMessage, _id: result.insertedId } }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
