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

    const accessControl = JSON.stringify({ access_type: 'anonymous' });
    const signature = crypto
      .createHash('sha1')
      .update(`access_control=${accessControl}&folder=${folder}&resource_type=raw&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    return NextResponse.json({ signature, cloudName, apiKey });
  } catch (error) {
    console.error('Resume sign error:', error);
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
  }
}
