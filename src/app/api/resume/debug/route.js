import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email query param required' }, { status: 400 });
    }

    const collection = await getCollection('resumes');
    const resume = await collection.findOne({ email });

    if (!resume) {
      return NextResponse.json({ message: 'No resume found', email }, { status: 404 });
    }

    const info = {
      email: resume.email,
      filename: resume.filename,
      contentType: resume.contentType,
      size: resume.size,
      hasDataBase64: !!resume.dataBase64,
      dataBase64Length: resume.dataBase64 ? resume.dataBase64.length : 0,
      dataBase64First100: resume.dataBase64 ? resume.dataBase64.substring(0, 100) : null,
      dataBase64Last100: resume.dataBase64 ? resume.dataBase64.substring(resume.dataBase64.length - 100) : null,
      hasData: !!resume.data,
      dataType: resume.data ? typeof resume.data : null,
      keys: Object.keys(resume).filter(k => k !== 'dataBase64' && k !== 'data'),
    };

    if (resume.dataBase64) {
      const buffer = Buffer.from(resume.dataBase64, 'base64');
      info.bufferLength = buffer.length;
      info.bufferFirst4Bytes = buffer.slice(0, 4).toString('hex');
      info.isPdf = buffer.slice(0, 4).toString('ascii') === '%PDF';
    }

    return NextResponse.json(info, { status: 200 });
  } catch (error) {
    console.error('Resume debug error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
