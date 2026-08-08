import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('messages');

    const pipeline = [
      { $match: { receiverEmail: email, read: false } },
      { $group: { _id: '$senderEmail', count: { $sum: 1 } } }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    const unreadCounts = {};
    let totalUnread = 0;
    results.forEach((r) => {
      unreadCounts[r._id] = r.count;
      totalUnread += r.count;
    });

    return NextResponse.json({ success: true, unreadCounts, totalUnread });
  } catch (error) {
    console.error("Error fetching unread summary:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
