/**
 * Use Case: Create Game
 * Yeni oyun oluşturur (frontend-only demo)
 */

import { generateCode, CODE_LEN, type GameCode } from '@/domain/game';

export interface CreateGameResult {
	code: GameCode;
	joinUrl: string;
}

/**
 * Yeni oyun oluşturur
 * Not: Bu sprintte backend'e çağrı yok, sadece kod üretimi
 */
export function createGame(): CreateGameResult {
	const code = generateCode(CODE_LEN);
	const joinUrl = `/join/${code}`;

	// Demo için localStorage'a kaydet
	if (typeof window !== 'undefined') {
		localStorage.setItem('current_game_code', code);
	}

	return {
		code,
		joinUrl,
	};
}

/**
 * Mevcut oyun kodunu temizle (oyun bitişi)
 */
export function endGame(): void {
	if (typeof window !== 'undefined') {
		localStorage.removeItem('current_game_code');
	}
}

