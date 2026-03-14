import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing image URL', { status: 400 });
  }

  try {
    const res = await fetch(imageUrl);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*', // Allow the browser to load this proxy
      },
    });
  } catch (err) {
    console.error('Image Proxy Error:', err);
    return new Response('Failed to fetch image', { status: 500 });
  }
}
