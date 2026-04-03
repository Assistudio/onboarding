import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase';
import { documentTypes, type DocumentType } from '@/lib/prisma-enums';

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const clientId = formData.get('clientId') as string | null;
  const policyId = formData.get('policyId') as string | null;
  const docType = ((formData.get('docType') as string | null) ?? 'ALTRO') as DocumentType;

  if (!file) {
    return NextResponse.json({ error: 'File mancante' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File troppo grande (max 20 MB)' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo di file non supportato' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const storagePath = `${clientId ?? 'general'}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type });

  if (error) {
    return NextResponse.json({ error: 'Errore upload: ' + error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  const document = await prisma.document.create({
    data: {
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      mimeType: file.type,
      docType: documentTypes.includes(docType) ? docType : 'ALTRO',
      uploadedById: session.user.id,
      clientId: clientId ?? undefined,
      policyId: policyId ?? undefined,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
