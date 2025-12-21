/**
 * Use Case: Create Game (Lobi Oluşturma)
 * 
 * DEĞİŞİKLİK:
 * - ESKİ: Frontend'de kod üretiyordu (generateCode)
 * - YENİ: Backend'e istek gönderiyor (lobbyApi.createLobby)
 * 
 * SOLID PRENSİPLERİ:
 * - S (Single Responsibility): Sadece oyun oluşturma işlemini yapar
 * - D (Dependency Inversion): lobbyApi'ye bağımlı
 * 
 * BACKEND REFERANS:
 * - LobbyController.cs → CreateLobby()
 * - POST /api/lobby/create
 * 
 * SENARYO: MADDE 1
 * 1. Admin "Oyunu Kur" butonuna tıklar
 * 2. Bu fonksiyon çağrılır
 * 3. Backend'e POST /api/lobby/create isteği gider
 * 4. PostgreSQL'de Lobbies tablosuna kayıt yapılır
 * 5. Lobi kodu döner (örn: "K7")
 * 6. Dialog açılır (kod, QR kod gösterilir)
 */

import { createLobby as apiCreateLobby } from '@/services/lobbyApi';
import type { LobbyResponse } from '@/types/lobby';

/**
 * Oyun oluşturma sonucu
 */
export interface CreateGameResult {
  /** Lobi/oyun kodu (örn: "K7") */
  code: string;
  /** Katılım URL'i (örn: "/join/K7") */
  joinUrl: string;
  /** Lobi ID */
  lobbyId: number;
  /** Tam lobi yanıtı (opsiyonel, ileride kullanılabilir) */
  lobby: LobbyResponse;
}

/**
 * Yeni oyun/lobi oluşturur
 * 
 * @param adminUsername - Lobi oluşturan kullanıcının adı (varsayılan: "Admin")
 * @returns Promise<CreateGameResult> - Oyun bilgileri
 * @throws Error - Backend hatası durumunda
 * 
 * KULLANIM:
 * const { code, joinUrl } = await createGame("Admin");
 * console.log(code); // "K7"
 * console.log(joinUrl); // "/join/K7"
 */
export async function createGame(
  adminUsername: string = 'Admin'
): Promise<CreateGameResult> {
  // Backend'e lobi oluşturma isteği gönder
  const lobby = await apiCreateLobby({
    adminUsername,
  });

  const code = lobby.code;
  const joinUrl = `/join/${code}`;

  // localStorage'a kaydet (ileride kullanılabilir)
  if (typeof window !== 'undefined') {
    localStorage.setItem('current_game_code', code);
    localStorage.setItem('current_lobby_id', lobby.id.toString());
  }

  return {
    code,
    joinUrl,
    lobbyId: lobby.id,
    lobby,
  };
}

/**
 * Mevcut oyun kodunu temizle (oyun bitişi)
 */
export function endGame(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('current_game_code');
    localStorage.removeItem('current_lobby_id');
  }
}
