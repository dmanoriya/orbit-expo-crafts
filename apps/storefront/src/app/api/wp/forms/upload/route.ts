import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Limit size to 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File exceeds 15MB limit' }, { status: 400 });
    }

    // Allowed extensions
    const ext = path.extname(file.name).toLowerCase();
    const allowed = ['.pdf', '.dwg', '.jpg', '.jpeg', '.png', '.webp', '.zip', '.step', '.iges'];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ success: false, error: 'File format not supported' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/trade/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'trade');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const fileName = `${safeBaseName}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/trade/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
