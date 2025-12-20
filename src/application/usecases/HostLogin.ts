/**
 * Use Case: Host Login
 * PIN ile host girişi yapar
 */

import { setHost } from '@/domain/host';

/**
 * Host girişi için PIN doğrulama
 * @param pin Kullanıcının girdiği PIN
 * @returns true - PIN doğru, false - PIN yanlış
 */
export function hostLogin(pin: string): boolean {
	const correctPin = process.env.NEXT_PUBLIC_HOST_PIN || '2004571';
	
	if (pin === correctPin) {
		setHost(true, 6); // 6 saat geçerli
		return true;
	}
	
	return false;
}

