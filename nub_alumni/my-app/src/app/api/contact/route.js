import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, message: "Name, email, and message are required." }, { status: 400 });
    }

    const collection = await getCollection('contacts');
    await collection.insertOne({
      name, email, message,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "Contact form submitted successfully." }, { status: 201 });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
