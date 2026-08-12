import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { imagekit } from '@/lib/imagekit';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'logo' | 'favicon' | 'gallery' | 'avatar'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, SVG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const folder = type ? `/lamkacoaching/${type}` : '/lamkacoaching/misc';
    const ext = file.type === 'image/svg+xml' ? 'svg' :
                file.type === 'image/png' ? 'png' :
                file.type === 'image/webp' ? 'webp' : 'jpg';
                
    const fileName = type === 'favicon' ? `favicon.${ext}` :
                     type === 'logo' ? `logo.${ext}` :
                     `${Date.now()}.${ext}`;

    const response = await imagekit.files.upload({
      file: buffer.toString('base64'),
      fileName,
      folder,
      useUniqueFileName: type !== 'favicon' && type !== 'logo',
    });

    const publicPath = response.url;
    if (!publicPath) {
      throw new Error('Upload failed: No URL returned from ImageKit');
    }

    if (type === 'favicon') {
      await db.setting.upsert({
        where: { key: 'favicon_url' },
        update: { value: publicPath },
        create: { key: 'favicon_url', value: publicPath },
      });
    } else if (type === 'logo') {
      await db.setting.upsert({
        where: { key: 'logo_url' },
        update: { value: publicPath },
        create: { key: 'logo_url', value: publicPath },
      });
    }

    return NextResponse.json({
      success: true,
      url: publicPath,
      message: `${type || 'File'} uploaded successfully`,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'favicon') {
      await db.setting.deleteMany({ where: { key: 'favicon_url' } });
    } else if (type === 'logo') {
      await db.setting.deleteMany({ where: { key: 'logo_url' } });
    }

    return NextResponse.json({ success: true, message: 'Logo removed' });
  } catch (error) {
    console.error('Error removing logo:', error);
    return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 });
  }
}
