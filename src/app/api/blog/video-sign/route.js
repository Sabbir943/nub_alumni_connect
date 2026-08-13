import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { timestamp, folder } = await request.json();

    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudinaryUrl || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary not configured. Check CLOUDINARY_URL and CLOUDINARY_API_SECRET in .env' }, { status: 500 });
    }

    const cloudName = cloudinaryUrl.split('@')[1];
    const apiKey = cloudinaryUrl.split('://')[1].split(':')[0];

    const signature = crypto
      .createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    return NextResponse.json({ signature, cloudName, apiKey });
  } catch (error) {
    console.error('Video sign error:', error);
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
  }
}
