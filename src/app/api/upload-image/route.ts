import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const fileName = formData.get('fileName') as string;

		if (!file) {
			return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
		}

		if (!fileName) {
			return NextResponse.json(
				{ error: 'Dosya adı belirtilmedi' },
				{ status: 400 }
			);
		}

		// Dosya türünü kontrol et
		if (!file.type.startsWith('image/')) {
			return NextResponse.json(
				{ error: 'Sadece resim dosyaları kabul edilir' },
				{ status: 400 }
			);
		}

		// Dosya boyutunu kontrol et (5MB)
		if (file.size > 5 * 1024 * 1024) {
			return NextResponse.json(
				{ error: "Dosya boyutu 5MB'dan küçük olmalı" },
				{ status: 400 }
			);
		}

		// Dosyayı buffer'a çevir
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Hedef klasör yolunu oluştur
		const uploadDir = path.join(process.cwd(), 'public', 'resimler', 'kartlar');
		const filePath = path.join(uploadDir, fileName);

		// Dosyayı kaydet
		await writeFile(filePath, buffer);

		return NextResponse.json({
			success: true,
			fileName,
			message: 'Dosya başarıyla yüklendi',
		});
	} catch (error) {
		console.error('Dosya yükleme hatası:', error);
		return NextResponse.json(
			{ error: 'Dosya yüklenirken bir hata oluştu' },
			{ status: 500 }
		);
	}
}
