import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url || !url.includes('cloudinary.com')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudinaryUrl || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    const cloudName = cloudinaryUrl.split('@')[1];

    const urlParts = cloudinaryUrl.split('://')[1] || cloudinaryUrl;
    const apiKey = urlParts.split(':')[0];

    let publicId = url;
    publicId = publicId.replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, '');
    publicId = publicId.replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/raw\/upload\//, '');
    publicId = publicId.replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\//, '');
    publicId = publicId.split('?')[0];
    if (publicId.startsWith('/')) publicId = publicId.substring(1);
    publicId = publicId.replace(/^v\d+\//, '');

    const resourceTypes = ['image', 'raw'];

    for (const rt of resourceTypes) {
      try {
        const timestamp = Math.round(Date.now() / 1000);
        const signature = crypto
          .createHash('sha1')
          .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
          .digest('hex');

        const downloadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/download/${rt}/${publicId}`;

        const downloadRes = await fetch(downloadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey, timestamp, signature }),
        });

        if (downloadRes.ok) {
          const contentType = downloadRes.headers.get('content-type') || '';

          if (contentType.includes('application/json')) {
            const jsonData = await downloadRes.json();
            if (jsonData.url) {
              const fileRes = await fetch(jsonData.url);
              if (fileRes.ok) {
                const fileBody = await fileRes.arrayBuffer();
                const fileContentType = fileRes.headers.get('content-type') || 'application/octet-stream';
                const filename = publicId.split('/').pop() || 'resume';
                return new NextResponse(fileBody, {
                  headers: {
                    'Content-Type': fileContentType,
                    'Content-Disposition': `inline; filename="${filename}"`,
                    'Cache-Control': 'public, max-age=31536000',
                  },
                });
              }
            }
          } else {
            const body = await downloadRes.arrayBuffer();
            const filename = publicId.split('/').pop() || 'resume';
            return new NextResponse(body, {
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${filename}"`,
                'Cache-Control': 'public, max-age=31536000',
              },
            });
          }
        }
      } catch (e) {
        console.error(`Resume proxy ${rt} attempt failed:`, e.message);
      }
    }

    const directRes = await fetch(url);
    if (directRes.ok) {
      const body = await directRes.arrayBuffer();
      const filename = publicId.split('/').pop() || 'resume';
      return new NextResponse(body, {
        headers: {
          'Content-Type': directRes.headers.get('content-type') || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    console.error('Resume proxy: all attempts failed for:', publicId);
    return NextResponse.json({ error: 'Could not fetch resume' }, { status: 404 });
  } catch (error) {
    console.error('Resume proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
  }
}
