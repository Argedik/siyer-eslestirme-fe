'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidCode, toCode, CODE_LEN } from '@/domain/game';
import { getLobbyByCode, joinLobby } from '@/services/lobbyApi';
import { getRandomPlayerName, type PlayerName } from '@/domain/playerNames';
import { getOrCreateClientId } from '@/utils/uuid';
import Avvvatars from 'avvvatars-react';
import AvatarSelector from '@/components/AvatarSelector';
import styles from './index.module.scss';

interface JoinGameDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function JoinGameDialog({ isOpen, onClose }: JoinGameDialogProps) {
	const [code, setCode] = useState('');
	const [playerName, setPlayerName] = useState<PlayerName>(getRandomPlayerName());
	const [avatarUrl, setAvatarUrl] = useState<string>('');
	const [error, setError] = useState('');
	const [isValidating, setIsValidating] = useState(false);
	const [showAvatarSelector, setShowAvatarSelector] = useState(false);
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const playerNameInputRef = useRef<HTMLInputElement>(null);
	const isSubmittingRef = useRef(false); // Çoklu gönderimi engellemek için

	useEffect(() => {
		if (isOpen) {
			// Popup açıldığında state'leri temizle
			setCode('');
			setError('');
			setIsValidating(false);
			setShowAvatarSelector(false);
			isSubmittingRef.current = false; // Submit flag'ini sıfırla
			
			// localStorage'daki oyun verilerini temizle (deviceId hariç - aynı cihazı tanımak için)
			if (typeof window !== 'undefined') {
				// Oyun verilerini temizle ama deviceId'yi sakla
				localStorage.removeItem('current_game_code');
				localStorage.removeItem('current_lobby_id');
				// siyer_client_id'yi SİLME - aynı cihazı tanımak için gerekli
				// Başka saklanan oyun verilerini temizle
				Object.keys(localStorage).forEach(key => {
					if ((key.startsWith('lobby_') || key.startsWith('player_')) && key !== 'siyer_client_id') {
						localStorage.removeItem(key);
					}
				});
			}
			
			// Yeni rastgele oyuncu ismi ata (eski veriler yok)
			const randomName = getRandomPlayerName();
			setPlayerName(randomName);
			setAvatarUrl(randomName); // Avatar URL'i oyuncu ismi olarak sakla (avvvatars aynı value için aynı avatar üretir)
			
			// Input'a focus ver
			if (playerNameInputRef.current) {
				playerNameInputRef.current.focus();
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

		// Çoklu gönderimi engelle
		if (isSubmittingRef.current || isValidating) {
			return;
		}

		if (!code) {
			setError('Lütfen oyun kodunu girin');
			return;
		}

		if (!isValidCode(code)) {
			setError('Rakam Türkçe karakterleri denebilirsiniz.');
			return;
		}

		if (!playerName.trim()) {
			setError('Lütfen oyuncu adınızı girin');
			return;
		}

		// Submit flag'ini set et
		isSubmittingRef.current = true;
		setIsValidating(true);
		setError('');

		try {
			const validCode = toCode(code);
			
			// Aynı cihaz için aynı deviceId'yi kullan (localStorage'da saklanır)
			const deviceId = getOrCreateClientId();
			
			// Sadece şu anki kullanıcının bilgilerini gönder
			const requestPayload = {
				lobbyCode: validCode,
				username: playerName.trim(),
				avatarUrl: avatarUrl || playerName.trim(),
				deviceId: deviceId, // Backend'de deviceId olarak bekleniyor
			};
			
			// Backend'e katılma isteği gönder (sadece 1 kez, sadece şu anki kullanıcı bilgileri)
			const lobby = await joinLobby(requestPayload);

			// Lobi kodunu localStorage'a kaydet (oyuncu listesi için)
			if (typeof window !== 'undefined') {
				localStorage.setItem('current_game_code', validCode);
				if (lobby.id) {
					localStorage.setItem('current_lobby_id', lobby.id.toString());
				}
			}

			// Başarılı - oyun kurulum sayfasına git
			router.push('/game-setup');
		} catch (err: any) {
			// Hata durumunda uyarı göster
			const errorMessage = err?.message || 'Lütfen adminin paylaştığı lobi kodunu giriniz';
			setError(errorMessage);
			setIsValidating(false);
			isSubmittingRef.current = false; // Hata durumunda flag'i sıfırla
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
					{/* Oyuncu Adı ve Avatar */}
					<div className={styles.field}>
						<label className={styles.label}>Oyuncu adınız</label>
						<div className={styles.playerNameContainer}>
							<button
								type="button"
								className={styles.avatarButton}
								onClick={() => setShowAvatarSelector(true)}
								aria-label="Avatar seç"
							>
								<Avvvatars
									value={avatarUrl || playerName}
									style="shape"
									size={48}
									shadow={true}
									border={true}
									borderColor="#20b2aa"
									borderSize={2}
								/>
							</button>
							<input
								ref={playerNameInputRef}
								type="text"
								value={playerName}
								onChange={(e) => {
									const newName = e.target.value as PlayerName;
									setPlayerName(newName);
									// Avatar URL'ini değiştirme - sadece avatar seçildiğinde güncellenir
								}}
								className={styles.playerNameInput}
								placeholder="Oyuncu adınız"
								autoComplete="off"
							/>
						</div>
					</div>

					{/* Lobi Kodu */}
					<div className={styles.field}>
						<label className={styles.label}>Lobi kodu</label>
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

				{/* Avatar Seçim Dialogu */}
				<AvatarSelector
					isOpen={showAvatarSelector}
					onClose={() => setShowAvatarSelector(false)}
					onSelect={(avatarValue) => {
						setPlayerName(avatarValue as PlayerName);
						setAvatarUrl(avatarValue); // Avatar seçildiğinde URL'i güncelle
					}}
					currentValue={playerName}
				/>
			</div>
		</div>
	);
}

