import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('resumes');
    const resume = await collection.findOne({ email });

    if (!resume || !resume.dataBase64) {
      return NextResponse.json({ message: 'Resume not found' }, { status: 404 });
    }

    const binaryString = atob(resume.dataBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const headers = new Headers();
    headers.set('Content-Type', resume.contentType || 'application/octet-stream');
    headers.set('Content-Length', String(bytes.length));
    headers.set('Content-Disposition', `inline; filename="${resume.filename || 'resume'}"`);
    headers.set('Cache-Control', 'public, max-age=86400');

    return new NextResponse(bytes, { status: 200, headers });
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
