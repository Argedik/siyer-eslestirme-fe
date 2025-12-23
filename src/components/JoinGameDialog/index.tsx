'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidCode, toCode, CODE_LEN } from '@/domain/game';
import { getLobbyByCode } from '@/services/lobbyApi';
import styles from './index.module.scss';

interface JoinGameDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function JoinGameDialog({ isOpen, onClose }: JoinGameDialogProps) {
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	const [isValidating, setIsValidating] = useState(false);
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			// Popup açıldığında state'leri temizle
			setCode('');
			setError('');
			setIsValidating(false);
			// Input'a focus ver
			if (inputRef.current) {
				inputRef.current.focus();
			}
		}
	}, [isOpen]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.toUpperCase().slice(0, CODE_LEN);
		setCode(value);
		
		// Gerçek zamanlı validation - sadece kod tamamlandığında kontrol et
		if (value.length === CODE_LEN && !isValidCode(value)) {
			setError('Türkçe karakterleri denebilirsiniz.');
		} else {
			setError('');
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!code) {
			setError('Lütfen oyun kodunu girin');
			return;
		}

		if (!isValidCode(code)) {
			setError('Rakam Türkçe karakterleri denebilirsiniz.');
			return;
		}

		setIsValidating(true);
		setError('');

		try {
			const validCode = toCode(code);
			// Backend'den lobi doğrulama
			await getLobbyByCode(validCode);
			// Doğru kod - oyun sayfasına git
			router.push('/game');
		} catch (err) {
			// Yanlış kod - animasyonlu uyarı göster
			setError('Lütfen adminin paylaştığı lobi kodunu giriniz');
			setIsValidating(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
				<button className={styles.closeButton} onClick={onClose} aria-label="Kapat">
					×
				</button>

				<h2 className={styles.title}>Oyuna Katıl</h2>
				<p className={styles.description}>
					Host tarafından paylaşılan 2 haneli oyun kodunu girin
				</p>

				<form onSubmit={handleSubmit}>
					<div className={styles.field}>
						<input
							ref={inputRef}
							type="text"
							value={code}
							onChange={handleInputChange}
							placeholder="AB"
							className={styles.input}
							maxLength={CODE_LEN}
							pattern="[A-PR-VY-Z]{2}"
							title="Türkçe karakterleri denebilirsiniz."
							autoComplete="off"
						/>
						{error && <span className={styles.error}>{error}</span>}
					</div>

					<div className={styles.actions}>
						<button type="button" onClick={onClose} className={styles.secondaryButton}>
							İptal
						</button>
						<button type="submit" className={styles.primaryButton} disabled={isValidating}>
							{isValidating ? 'Kontrol Ediliyor...' : 'Katıl'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

