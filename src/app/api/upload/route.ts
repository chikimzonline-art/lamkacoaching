import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'logo' | 'favicon'

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
        { error: 'File too large. Maximum size: 2MB' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory may already exist
    }

    // Determine file extension and name
    const ext = file.type === 'image/svg+xml' ? 'svg' :
                file.type === 'image/png' ? 'png' :
                file.type === 'image/webp' ? 'webp' : 'jpg';

    const fileName = type === 'favicon' ? `favicon.${ext}` : `logo.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store the public URL path in settings
    const publicPath = `/uploads/${fileName}`;

    if (type === 'favicon') {
      await db.setting.upsert({
        where: { key: 'favicon_url' },
        update: { value: publicPath },
        create: { key: 'favicon_url', value: publicPath },
      });
    } else {
      await db.setting.upsert({
        where: { key: 'logo_url' },
        update: { value: publicPath },
        create: { key: 'logo_url', value: publicPath },
      });
    }

    return NextResponse.json({
      success: true,
      url: publicPath,
      message: `${type === 'favicon' ? 'Favicon' : 'Logo'} uploaded successfully`,
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
    const type = searchParams.get('type'); // 'logo' | 'favicon'

    if (type === 'favicon') {
      await db.setting.deleteMany({ where: { key: 'favicon_url' } });
    } else {
      await db.setting.deleteMany({ where: { key: 'logo_url' } });
    }

    return NextResponse.json({ success: true, message: 'Logo removed' });
  } catch (error) {
    console.error('Error removing logo:', error);
    return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 });
  }
}
