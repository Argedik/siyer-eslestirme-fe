'use client';

import { useState, useEffect } from 'react';
import Avvvatars from 'avvvatars-react';
import { PLAYER_NAMES } from '@/domain/playerNames';
import styles from './index.module.scss';

interface AvatarSelectorProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (avatarValue: string) => void;
	currentValue: string;
}

export default function AvatarSelector({ isOpen, onClose, onSelect, currentValue }: AvatarSelectorProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		if (isOpen) {
			// Mevcut değere göre index bul
			const index = PLAYER_NAMES.findIndex(name => name === currentValue);
			if (index !== -1) {
				setSelectedIndex(index);
			}
		}
	}, [isOpen, currentValue]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleAvatarClick = (index: number) => {
		setSelectedIndex(index);
		const avatarValue = PLAYER_NAMES[index];
		onSelect(avatarValue);
		onClose();
	};

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
				<button className={styles.closeButton} onClick={onClose} aria-label="Kapat">
					×
				</button>

				<h2 className={styles.title}>Avatar Seç</h2>
				<p className={styles.description}>
					16 farklı avatar arasından birini seçin
				</p>

				<div className={styles.avatarGrid}>
					{PLAYER_NAMES.map((name, index) => (
						<button
							key={index}
							type="button"
							className={`${styles.avatarButton} ${selectedIndex === index ? styles.selected : ''}`}
							onClick={() => handleAvatarClick(index)}
							aria-label={`${name} avatarını seç`}
						>
							<Avvvatars
								value={name}
								style="shape"
								size={64}
								shadow={true}
								border={selectedIndex === index}
								borderColor="#20b2aa"
								borderSize={3}
							/>
							<span className={styles.avatarName}>{name}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

