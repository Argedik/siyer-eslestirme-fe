'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import styles from './index.module.scss';

interface GameReadyDialogProps {
	isOpen: boolean;
	onClose: () => void;
	code: string;
	joinUrl: string;
	onNavigateToLobby?: () => void;
	error?: string | null;
}

export default function GameReadyDialog({
	isOpen,
	onClose,
	code,
	joinUrl,
	onNavigateToLobby,
	error,
}: GameReadyDialogProps) {
	const [qrDataUrl, setQrDataUrl] = useState('');
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState(false);
	const confettiTriggered = useRef(false);

	useEffect(() => {
		if (isOpen && code && !confettiTriggered.current) {
			// Yıldızlar ve çizgilerle confetti animasyonu
			const duration = 3000;
			const end = Date.now() + duration;

			const frame = () => {
				// Yıldızlar (stars)
				confetti({
					particleCount: 3,
					angle: 60,
					spread: 55,
					origin: { x: 0, y: 0.6 },
					shapes: ['star'],
					colors: ['#FFD700', '#FFA500', '#FF6347'],
				});

				confetti({
					particleCount: 3,
					angle: 120,
					spread: 55,
					origin: { x: 1, y: 0.6 },
					shapes: ['star'],
					colors: ['#FFD700', '#FFA500', '#FF6347'],
				});

				// Çizgiler (lines) - ince dikdörtgenler
				confetti({
					particleCount: 2,
					angle: 90,
					spread: 360,
					origin: { x: Math.random(), y: 0 },
					shapes: ['square'],
					colors: ['#00FFFF', '#0080FF', '#8000FF'],
					ticks: 200,
					gravity: 1,
					decay: 0.94,
					startVelocity: 30,
					scalar: 0.8,
				});

				if (Date.now() < end) {
					requestAnimationFrame(frame);
				}
			};

			frame();
			confettiTriggered.current = true;
		}

		// Reset when dialog closes
		if (!isOpen) {
			confettiTriggered.current = false;
		}
	}, [isOpen, code]);

	useEffect(() => {
		if (isOpen && joinUrl) {
			// QR kod oluştur
			const fullUrl = `${window.location.origin}${joinUrl}`;
			QRCode.toDataURL(fullUrl, {
				width: 200,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF',
				},
			})
				.then((url) => setQrDataUrl(url))
				.catch((err) => console.error('QR kod oluşturulamadı:', err));
		}
	}, [isOpen, joinUrl]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	const copyToClipboard = async (text: string, type: 'code' | 'url') => {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'code') {
				setCopiedCode(true);
				setTimeout(() => setCopiedCode(false), 2000);
			} else {
				setCopiedUrl(true);
				setTimeout(() => setCopiedUrl(false), 2000);
			}
		} catch (err) {
			console.error('Kopyalama başarısız:', err);
		}
	};

	if (!isOpen) return null;

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
				<button className={styles.closeButton} onClick={onClose} aria-label="Kapat">
					×
				</button>

				{error ? (
					<>
						<h2 className={styles.title}>⚠️ Sunucu Hatası</h2>
						<p className={styles.description} style={{ color: '#ff6b6b' }}>
							Sunucumuzu açmamız gerekiyor
						</p>
						<div className={styles.content}>
							<p style={{ 
								color: 'rgba(255, 255, 255, 0.8)', 
								textAlign: 'center',
								margin: '1rem 0'
							}}>
								{error}
							</p>
						</div>
						<div className={styles.actions}>
							<button onClick={onClose} className={styles.primaryButton}>
								Tamam
							</button>
						</div>
					</>
				) : (
					<>
				<h2 className={styles.title}>🎉 Oyun Hazır!</h2>
				<p className={styles.description}>
					Oyuncular aşağıdaki kod veya QR ile katılabilir
				</p>

				<div className={styles.content}>
					<div className={styles.codeSection}>
						<label className={styles.label}>Oyun Kodu:</label>
						<div className={styles.copyRow}>
							<span className={styles.code}>{code}</span>
							<button
								className={styles.copyButton}
								onClick={() => copyToClipboard(code, 'code')}
								disabled={copiedCode}
							>
								{copiedCode ? '✓ Kopyalandı' : 'Kopyala'}
							</button>
						</div>
					</div>

					<div className={styles.urlSection}>
						<label className={styles.label}>Bağlantı:</label>
						<div className={styles.copyRow}>
							<span className={styles.url}>{joinUrl}</span>
							<button
								className={styles.copyButton}
								onClick={() =>
									copyToClipboard(`${window.location.origin}${joinUrl}`, 'url')
								}
								disabled={copiedUrl}
							>
								{copiedUrl ? '✓ Kopyalandı' : 'Kopyala'}
							</button>
						</div>
					</div>

					{qrDataUrl && (
						<div className={styles.qrSection}>
							<label className={styles.label}>QR Kod:</label>
							<img src={qrDataUrl} alt="QR Kod" className={styles.qrCode} />
						</div>
					)}
				</div>

				<div className={styles.actions}>
							{onNavigateToLobby ? (
								<button onClick={onNavigateToLobby} className={styles.primaryButton}>
									Lobiye Git
					</button>
							) : null}
				</div>
					</>
				)}
			</div>
		</div>
	);
}

