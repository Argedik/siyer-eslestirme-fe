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
				// Geçerli kod - lobby'ye yönlendir
				router.replace(`/lobby/${upperCode}`);
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
			background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
			color: '#fff',
			fontSize: '1.5rem'
		}}>
			Yönlendiriliyor...
		</div>
	);
}

