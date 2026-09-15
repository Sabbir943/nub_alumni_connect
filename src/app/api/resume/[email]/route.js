import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

function detectContentType(buffer) {
  const hex = buffer.slice(0, 8).toString('hex');
  if (hex.startsWith('25504446')) return 'application/pdf';
  if (hex.startsWith('d0cf11e0')) return 'application/msword';
  if (hex.startsWith('504b0304')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return '';
}

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
    } else {
      return NextResponse.json({ message: 'Resume data empty' }, { status: 404 });
    }

    const contentType = detectContentType(buffer) || resume.contentType || 'application/pdf';
    const filename = resume.filename || 'resume.pdf';

    const blob = new Blob([buffer], { type: contentType });

    return new NextResponse(blob.stream(), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
      },
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
