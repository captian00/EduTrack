import { NextRequest, NextResponse } from 'next/server';

const VIETQR_HOST = 'img.vietqr.io';
const VIETQR_PATH_PREFIX = '/image/';

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('url');

  if (!source) {
    return NextResponse.json({ message: 'Thiếu URL ảnh VietQR.' }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(source);
  } catch {
    return NextResponse.json({ message: 'URL ảnh VietQR không hợp lệ.' }, { status: 400 });
  }

  if (
    imageUrl.protocol !== 'https:' ||
    imageUrl.hostname !== VIETQR_HOST ||
    !imageUrl.pathname.startsWith(VIETQR_PATH_PREFIX)
  ) {
    return NextResponse.json({ message: 'Nguồn ảnh không được hỗ trợ.' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Không thể tải ảnh VietQR.' },
        { status: response.status },
      );
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không thể kết nối tới VietQR.' },
      { status: 502 },
    );
  }
}
