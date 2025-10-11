/**
 * Domain: Host - Host yetkilendirme
 */

const HOST_KEY = 'host';
const HOST_VALUE = '1';

/**
 * localStorage'dan host durumunu kontrol eder
 */
export function isHostFromStorage(): boolean {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem(HOST_KEY) === HOST_VALUE;
}

/**
 * Host durumunu localStorage'a kaydeder
 * @param flag Host durumu
 * @param hours Opsiyonel - Geçerlilik süresi (saat cinsinden)
 */
export function setHost(flag: boolean, hours?: number): void {
	if (typeof window === 'undefined') return;

	if (flag) {
		localStorage.setItem(HOST_KEY, HOST_VALUE);
		
		// Opsiyonel: expiry için ayrı key kullanabiliriz
		if (hours) {
			const expiry = Date.now() + hours * 60 * 60 * 1000;
			localStorage.setItem(`${HOST_KEY}_expiry`, expiry.toString());
		}
	} else {
		localStorage.removeItem(HOST_KEY);
		localStorage.removeItem(`${HOST_KEY}_expiry`);
	}
}

/**
 * Host durumunu ve expiry kontrolünü birlikte yapar
 */
export function isHostValid(): boolean {
	if (!isHostFromStorage()) return false;

	const expiry = localStorage.getItem(`${HOST_KEY}_expiry`);
	if (expiry) {
		const expiryTime = parseInt(expiry, 10);
		if (Date.now() > expiryTime) {
			setHost(false);
			return false;
		}
	}

	return true;
}

