'use client';

import { useEffect, useState } from 'react';
import { getLobbyByCode } from '@/services/lobbyApi';
import type { PlayerResponse } from '@/types/lobby';
import Avvvatars from 'avvvatars-react';
import styles from './PlayerList.module.scss';

interface PlayerListProps {
	/** Lobi kodu */
	lobbyCode?: string;
}

/**
 * Oyuncu Listesi Komponenti
 * Backend'den gelen oyuncuları avatar ve isimleriyle gösterir
 */
export default function PlayerList({ lobbyCode }: PlayerListProps) {
	const [players, setPlayers] = useState<PlayerResponse[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Lobi kodu yoksa veya localStorage'da yoksa çık
		if (!lobbyCode) {
			// localStorage'dan dene
			const storedCode = typeof window !== 'undefined' 
				? localStorage.getItem('current_game_code') 
				: null;
			
			if (!storedCode) {
				return;
			}
			
			fetchPlayers(storedCode);
		} else {
			fetchPlayers(lobbyCode);
		}
	}, [lobbyCode]);

	const fetchPlayers = async (code: string) => {
		setLoading(true);
		setError(null);
		
		try {
			const lobby = await getLobbyByCode(code);
			setPlayers(lobby.players || []);
		} catch (err: any) {
			setError('Oyuncu listesi yüklenemedi');
			console.error('Oyuncu listesi hatası:', err);
		} finally {
			setLoading(false);
		}
	};

	// Polling: Her 3 saniyede bir güncelle
	useEffect(() => {
		const code = lobbyCode || (typeof window !== 'undefined' 
			? localStorage.getItem('current_game_code') 
			: null);
		
		if (!code) return;

		const interval = setInterval(() => {
			fetchPlayers(code);
		}, 3000); // 3 saniyede bir güncelle

		return () => clearInterval(interval);
	}, [lobbyCode]);

	if (loading && players.length === 0) {
		return (
			<div className={styles.playerList}>
				<h3 className={styles.title}>Oyuncular</h3>
				<div className={styles.loading}>Yükleniyor...</div>
			</div>
		);
	}

	if (error && players.length === 0) {
		return (
			<div className={styles.playerList}>
				<h3 className={styles.title}>Oyuncular</h3>
				<div className={styles.error}>{error}</div>
			</div>
		);
	}

	return (
		<div className={styles.playerList}>
			<h3 className={styles.title}>
				Oyuncular
				{players.length > 0 && <span className={styles.count}>({players.length})</span>}
			</h3>
			
			{players.length === 0 ? (
				<div className={styles.empty}>
					<p>Henüz oyuncu yok</p>
					<p className={styles.hint}>Oyuncular lobiye katıldıkça burada görünecek</p>
				</div>
			) : (
				<ul className={styles.list}>
					{players.map((player) => (
						<li key={player.id} className={styles.item}>
							<div className={styles.avatarWrapper}>
								<Avvvatars
									value={player.avatarUrl || player.username}
									style="shape"
									size={40}
									shadow={true}
									border={player.isAdmin}
									borderColor="#20b2aa"
									borderSize={2}
								/>
								{player.isAdmin && (
									<span className={styles.adminBadge} title="Admin">👑</span>
								)}
							</div>
							<div className={styles.info}>
								<span className={styles.username}>{player.username}</span>
								{player.score !== undefined && (
									<span className={styles.score}>{player.score} puan</span>
								)}
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

