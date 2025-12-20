/**
 * Domain: Game - Oyun kodu ve kurallar
 */

export type GameCode = string;

export const CODE_LEN = 2;

// Q, W, X hariç A-Z
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	.split('')
	.filter((c) => !['Q', 'W', 'X'].includes(c));

// Regex: Q/W/X hariç 2 hane
const CODE_REGEX = /^[A-PR-VY-Z]{2}$/;

/**
 * Verilen string'in geçerli bir oyun kodu olup olmadığını kontrol eder
 */
export function isValidCode(s: string): s is GameCode {
	const normalized = s.trim().toUpperCase();
	return CODE_REGEX.test(normalized);
}

/**
 * Rastgele oyun kodu üretir
 * @param len Kod uzunluğu (varsayılan: 2)
 */
export function generateCode(len: number = CODE_LEN): GameCode {
	let code = '';
	for (let i = 0; i < len; i++) {
		const randomIndex = Math.floor(Math.random() * ALPHABET.length);
		code += ALPHABET[randomIndex];
	}
	return code;
}

/**
 * Input string'ini oyun koduna dönüştürür
 * @throws Error - Geçersiz kod formatı
 */
export function toCode(input: string): GameCode {
	const normalized = input.trim().toUpperCase();
	if (!isValidCode(normalized)) {
		throw new Error(`Geçersiz oyun kodu: "${input}". Format: 2 hane (Q/W/X hariç A-Z)`);
	}
	return normalized;
}

