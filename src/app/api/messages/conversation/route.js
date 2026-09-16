import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-helpers';

export async function GET(request) {
  try {
    const { error, session } = await requireSession(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const user1 = searchParams.get('user1');
    const user2 = searchParams.get('user2');

    if (!user1 || !user2) {
      return NextResponse.json({ success: false, message: "user1 and user2 are required" }, { status: 400 });
    }

    // Users can only view their own conversations
    const userEmail = session.user.email;
    if (userEmail !== user1 && userEmail !== user2) {
      return NextResponse.json({ success: false, message: "Forbidden: Can only view your own conversations" }, { status: 403 });
    }

    const collection = await getCollection('messages');

    const messages = await collection
      .find({
        $or: [
          { senderEmail: user1, receiverEmail: user2 },
          { senderEmail: user2, receiverEmail: user1 }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray();

    await collection.updateMany(
      { senderEmail: user2, receiverEmail: user1, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
