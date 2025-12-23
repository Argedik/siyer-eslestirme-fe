/**
 * Unique ID oluşturma yardımcı fonksiyonları
 * 
 * Her kullanıcı için benzersiz bir ID oluşturur
 * Format: timestamp-randomString (örn: "1735123456789-a3f5b2c1")
 */

/**
 * Rastgele string oluşturur
 */
function randomString(length: number = 8): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Unique client ID oluşturur
 * Her çağrıda farklı bir ID döner
 * 
 * @returns Unique client ID (örn: "1735123456789-a3f5b2c1")
 */
export function generateClientId(): string {
	const timestamp = Date.now();
	const random = randomString(8);
	return `${timestamp}-${random}`;
}

/**
 * Browser'da saklanan unique client ID'yi alır veya oluşturur
 * Aynı browser'da her zaman aynı ID'yi döner
 * 
 * @returns Unique client ID
 */
export function getOrCreateClientId(): string {
	if (typeof window === 'undefined') {
		return generateClientId();
	}

	const STORAGE_KEY = 'siyer_client_id';
	
	// Eğer localStorage'da varsa onu kullan
	const existingId = localStorage.getItem(STORAGE_KEY);
	if (existingId) {
		return existingId;
	}

	// Yoksa yeni oluştur ve sakla
	const newId = generateClientId();
	localStorage.setItem(STORAGE_KEY, newId);
	return newId;
}

/**
 * Client ID'yi temizler (test için)
 */
export function clearClientId(): void {
	if (typeof window !== 'undefined') {
		localStorage.removeItem('siyer_client_id');
	}
}

