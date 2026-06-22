import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put, del } from '@vercel/blob';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { revalidateAll } from '@/lib/revalidate';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon'];

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'logo' | 'favicon' | 'gallery'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, SVG, WebP, GIF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

    // Determine filename
    const ext = file.name.split('.').pop() || 'jpg';
    let fileName = file.name;
    if (type === 'favicon') {
      fileName = `favicon.${ext}`;
    } else if (type === 'logo') {
      fileName = `logo.${ext}`;
    }

    // If uploading a logo or favicon, delete the old one from Vercel Blob first to keep storage clean
    if (type === 'logo' || type === 'favicon') {
      const dbKey = type === 'favicon' ? 'favicon_url' : 'logo_url';
      const existingSetting = await db.setting.findUnique({
        where: { key: dbKey },
      });
      if (existingSetting && existingSetting.value.startsWith('https://')) {
        try {
          await del(existingSetting.value);
        } catch (e) {
          console.error('Failed to delete old blob:', e);
        }
      }
    }

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
    });

    const publicPath = blob.url;

    // Save to settings db if logo/favicon
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

    revalidateAll();
    return NextResponse.json({
      success: true,
      url: publicPath,
      message: `${type === 'favicon' ? 'Favicon' : type === 'logo' ? 'Logo' : 'Image'} uploaded successfully`,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'logo' | 'favicon'
    const url = searchParams.get('url'); // For gallery/general deletes

    if (type === 'favicon') {
      const existing = await db.setting.findUnique({ where: { key: 'favicon_url' } });
      if (existing && existing.value.startsWith('https://')) {
        try { await del(existing.value); } catch {}
      }
      await db.setting.deleteMany({ where: { key: 'favicon_url' } });
    } else if (type === 'logo') {
      const existing = await db.setting.findUnique({ where: { key: 'logo_url' } });
      if (existing && existing.value.startsWith('https://')) {
        try { await del(existing.value); } catch {}
      }
      await db.setting.deleteMany({ where: { key: 'logo_url' } });
    } else if (url) {
      if (url.startsWith('https://')) {
        try { await del(url); } catch {}
      }
    }

    revalidateAll();
    return NextResponse.json({ success: true, message: 'File removed successfully' });
  } catch (error) {
    console.error('Error removing file:', error);
    return NextResponse.json({ error: 'Failed to remove file' }, { status: 500 });
  }
}
