'use client';

import { useState, useRef, useEffect } from 'react';
import { hostLogin } from '@/application/usecases/HostLogin';
import styles from './index.module.scss';

interface AdminLoginDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function AdminLoginDialog({
	isOpen,
	onClose,
	onSuccess,
}: AdminLoginDialogProps) {
	const [pin, setPin] = useState('');
	const [error, setError] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!pin) {
			setError('Lütfen PIN kodunu girin');
			return;
		}

		const success = hostLogin(pin);

		if (success) {
			setPin('');
			setError('');
			onSuccess();
			onClose();
		} else {
			setError('Yanlış PIN kodu');
			setPin('');
		}
	};

	if (!isOpen) return null;

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
				<button className={styles.closeButton} onClick={onClose} aria-label="Kapat">
					×
				</button>

				<h2 className={styles.title}>Admin Girişi</h2>
				<p className={styles.description}>
					Host olarak oyun oluşturabilmek için PIN kodunuzu girin
				</p>

				<form onSubmit={handleSubmit}>
					<div className={styles.field}>
						<input
							ref={inputRef}
							type="password"
							value={pin}
							onChange={(e) => {
								setPin(e.target.value);
								setError('');
							}}
							placeholder="PIN Kodu"
							className={styles.input}
							autoComplete="off"
						/>
						{error && <span className={styles.error}>{error}</span>}
					</div>

					<div className={styles.actions}>
						<button type="button" onClick={onClose} className={styles.secondaryButton}>
							İptal
						</button>
						<button type="submit" className={styles.primaryButton}>
							Giriş
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

