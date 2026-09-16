import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const events = await getCollection('events');
    const eventList = await events.find({})
      .sort({ date: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ events: eventList.map(e => ({ ...e, _id: e._id.toString() })) });
  } catch (error) {
    console.error('Admin events error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { title, description, date, location, type } = await request.json();

    if (!title || !date) {
      return NextResponse.json({ message: 'Title and date are required' }, { status: 400 });
    }

    const validTypes = ['reunion', 'workshop', 'networking', 'seminar'];
    const sanitizedType = validTypes.includes(type) ? type : 'reunion';

    const events = await getCollection('events');
    const event = {
      title,
      description: description || '',
      date,
      location: location || '',
      type: sanitizedType,
      createdAt: new Date().toISOString(),
    };

    const result = await events.insertOne(event);
    return NextResponse.json({ message: 'Event created', eventId: result.insertedId.toString() });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
