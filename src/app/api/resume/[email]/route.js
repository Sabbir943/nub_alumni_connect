import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('resumes');
    const resume = await collection.findOne({ email });

    if (!resume) {
      return NextResponse.json({ message: 'Resume not found' }, { status: 404 });
    }

    let buffer;

    if (resume.dataBase64) {
      buffer = Buffer.from(resume.dataBase64, 'base64');
      console.log(`[Resume] email=${email} dataBase64.length=${resume.dataBase64.length} buffer.length=${buffer.length}`);
      console.log(`[Resume] first 16 bytes (hex): ${buffer.slice(0, 16).toString('hex')}`);
      console.log(`[Resume] first 16 bytes (ascii): ${buffer.slice(0, 16).toString('ascii')}`);
    } else if (resume.data) {
      const raw = resume.data;
      if (Buffer.isBuffer(raw)) {
        buffer = raw;
      } else if (raw.buffer) {
        buffer = Buffer.from(raw.buffer);
      } else if (typeof raw === 'object' && raw.sub_type !== undefined) {
        buffer = Buffer.from(Object.values(raw));
      } else {
        buffer = Buffer.from(raw);
      }
      console.log(`[Resume] legacy data path, buffer.length=${buffer.length}`);
    } else {
      return NextResponse.json({ message: 'Resume data empty' }, { status: 404 });
    }

    const uint8 = new Uint8Array(buffer);

    const headers = new Headers();
    headers.set('Content-Type', resume.contentType || 'application/octet-stream');
    headers.set('Content-Length', String(uint8.byteLength));
    headers.set('Content-Disposition', `inline; filename="${resume.filename || 'resume'}"`);
    headers.set('Cache-Control', 'no-store');

    return new Response(uint8, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('resumes');
    await collection.deleteOne({ email });

    return NextResponse.json({ message: 'Resume deleted' }, { status: 200 });
  } catch (error) {
    console.error('Resume delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
