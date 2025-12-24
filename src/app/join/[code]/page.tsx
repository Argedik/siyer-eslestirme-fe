'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isValidCode } from '@/domain/game';

export default function JoinPage() {
	const params = useParams();
	const router = useRouter();
	const code = params.code as string;

	useEffect(() => {
		if (code) {
			const upperCode = code.toUpperCase();
			if (isValidCode(upperCode)) {
				// Geçerli kod - oyun sayfasına yönlendir
				router.replace('/game-setup');
			} else {
				// Geçersiz kod - ana sayfaya yönlendir
				router.replace('/');
			}
		}
	}, [code, router]);

	return (
		<div style={{
			minHeight: '100vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			background: 'linear-gradient(135deg, #0a2e2b 0%, #0d4a45 30%, #0f5c56 60%, #0d4a45 100%)',
			color: '#e0f7f5',
			fontSize: '1.5rem'
		}}>
			Yönlendiriliyor...
		</div>
	);
}

