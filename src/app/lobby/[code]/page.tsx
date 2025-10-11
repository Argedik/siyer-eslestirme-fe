'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';

export default function LobbyPage() {
	const params = useParams();
	const code = params.code as string;

	return (
		<div className={styles.container}>
			<div className={styles.card}>
				<h1 className={styles.title}>
					🎮 Lobi
				</h1>
				
				<div className={styles.codeDisplay}>
					<span className={styles.label}>Oyun Kodu:</span>
					<span className={styles.code}>{code?.toUpperCase()}</span>
				</div>

				<p className={styles.message}>
					Bu sayfa bir placeholder'dır. Adım 2'de backend entegrasyonu ile birlikte lobi işlevselliği eklenecektir.
				</p>

				<div className={styles.features}>
					<div className={styles.feature}>✓ Oyuncu listesi</div>
					<div className={styles.feature}>✓ Takım seçimi</div>
					<div className={styles.feature}>✓ Hazır durumu</div>
					<div className={styles.feature}>✓ Gerçek zamanlı senkronizasyon</div>
				</div>

				<Link href="/" className={styles.backButton}>
					← Ana Sayfaya Dön
				</Link>
			</div>
		</div>
	);
}

