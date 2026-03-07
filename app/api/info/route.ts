import { NextRequest, NextResponse } from 'next/server';
import { getVideoInfo } from '@/lib/downloader';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const info = await getVideoInfo(url);
    return NextResponse.json(info);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
