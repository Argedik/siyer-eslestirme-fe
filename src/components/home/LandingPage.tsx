'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isHostValid } from '@/domain/host';
import JoinGameDialog from '@/components/JoinGameDialog';
import AdminLoginDialog from '@/components/AdminLoginDialog';
import CreateGameButton from '@/components/CreateGameButton';
import GameReadyDialog from '@/components/GameReadyDialog';
import styles from './LandingPage.module.scss';

const mascots = [
	'/resimler/kartlar/siyer001.png',
	'/resimler/kartlar/siyer002.png',
	'/resimler/kartlar/siyer003.png',
];

const imagesBaseUrl = process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://argedik.com/images';

export default function LandingPage() {
	const [isHost, setIsHost] = useState(false);
	const [joinDialogOpen, setJoinDialogOpen] = useState(false);
	const [adminDialogOpen, setAdminDialogOpen] = useState(false);
	const [gameReadyDialogOpen, setGameReadyDialogOpen] = useState(false);
	const [gameCode, setGameCode] = useState('');
	const [joinUrl, setJoinUrl] = useState('');

	useEffect(() => {
		// Host durumunu kontrol et
		setIsHost(isHostValid());
	}, []);

	const handleAdminSuccess = () => {
		setIsHost(true);
	};

	const handleGameCreated = (code: string, url: string) => {
		setGameCode(code);
		setJoinUrl(url);
		setGameReadyDialogOpen(true);
	};

	return (
		<>
			<div className={styles.page}>
				<div className={styles.glowBackdrop} aria-hidden>
					<span className={`${styles.orb} ${styles.orbOne}`} />
					<span className={`${styles.orb} ${styles.orbTwo}`} />
					<span className={`${styles.orb} ${styles.orbThree}`} />
				</div>

				<header className={styles.hero}>
					<h1 className={styles.heroTitle}>
						3D <span className={styles.heroHighlight}>Siyer Eşleştirme</span>{' '}
						arenasına hoş geldin!
					</h1>

					<img 
						src={`${imagesBaseUrl}/siyer001.png`} 
						alt='Siyer Eşleştirme' 
						style={{ 
							maxWidth: '200px', 
							height: 'auto', 
							margin: '1rem auto', 
							display: 'block',
							borderRadius: '12px'
						}}
					/>

					<p className={styles.heroCopy}>
						Lise kulübünle birlikte oynayabileceğin bu kart oyunu, sevimli
						animasyonları ve takım skor takibiyle turnuvaları çok daha eğlenceli
						hale getiriyor. Tüm oyuncular tarayıcılarından bağlanıp takma adlarını
						seçsin, kartları çevirsin ve tarihi kavramları keşfetsin.
					</p>

					<div className={styles.actionRow}>
						<button 
							className={styles.primaryButton}
							onClick={() => setJoinDialogOpen(true)}
						>
							Oyuna Katıl
						</button>

						<button 
							className={styles.secondaryButton}
							onClick={() => setAdminDialogOpen(true)}
						>
							Admin Panel
						</button>

						{isHost && (
							<CreateGameButton onGameCreated={handleGameCreated} />
						)}
					</div>
				</header>

				<section className={styles.preview}>
					<div className={styles.previewCards}>
						{mascots.map((src, index) => (
							<figure
								key={src}
								className={styles.previewCard}
								style={{ rotate: `${(index - 1) * 10}deg` }}
							>
								<Image src={src} alt="Ön izleme kartı" width={120} height={120} />
								<figcaption className={styles.previewCaption}>
									Sürükleyici eşleşmeler
								</figcaption>
							</figure>
						))}
					</div>
				</section>
			</div>

			{/* Dialogs */}
			<JoinGameDialog 
				isOpen={joinDialogOpen} 
				onClose={() => setJoinDialogOpen(false)} 
			/>

			<AdminLoginDialog 
				isOpen={adminDialogOpen} 
				onClose={() => setAdminDialogOpen(false)}
				onSuccess={handleAdminSuccess}
			/>

			<GameReadyDialog 
				isOpen={gameReadyDialogOpen} 
				onClose={() => setGameReadyDialogOpen(false)}
				code={gameCode}
				joinUrl={joinUrl}
			/>
		</>
	);
}
