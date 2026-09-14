import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = formData.get('email');

    if (!file || !email) {
      return NextResponse.json({ message: 'File and email are required.' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Only PDF, DOC, and DOCX files are allowed.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'File must be less than 5MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    const collection = await getCollection('resumes');

    await collection.updateOne(
      { email },
      {
        $set: {
          email,
          filename: file.name,
          contentType: file.type,
          dataBase64: base64,
          size: file.size,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: 'Resume uploaded successfully',
      resumeUrl: `/api/resume/${encodeURIComponent(email)}`,
      filename: file.name,
    }, { status: 200 });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
