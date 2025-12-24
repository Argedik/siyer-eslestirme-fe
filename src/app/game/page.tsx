/**
 * Eski /game route'u - Artık kullanılmıyor
 * Yeni route'lar:
 * - /game-setup - Oyun kurulum sayfası
 * - /game-play - Oyun oynama sayfası
 * 
 * Bu dosya geriye dönük uyumluluk için /game-setup'a yönlendiriyor
 */

import { redirect } from 'next/navigation';

export default function GamePage() {
  redirect('/game-setup');
}
