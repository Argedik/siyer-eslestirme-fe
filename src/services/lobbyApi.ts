/**
 * Lobby API - Lobi İşlemleri
 * 
 * SOLID PRENSİPLERİ:
 * - S (Single Responsibility): Sadece lobi API işlemlerini yapar
 * - D (Dependency Inversion): api.ts'e bağımlı (soyutlama)
 * 
 * BACKEND REFERANS:
 * - Presentation/Controllers/LobbyController.cs
 * - [Route("api/[controller]")] → api/lobby
 * 
 * EŞLEŞTİRME TABLOSU:
 * | Backend Fonksiyon    | Frontend Fonksiyon  | Endpoint              |
 * |---------------------|--------------------|-----------------------|
 * | CreateLobby()       | createLobby()      | POST /api/lobby/create |
 * | JoinLobby()         | joinLobby()        | POST /api/lobby/join   |
 * | GetLobbyByCode()    | getLobbyByCode()   | GET /api/lobby/{code}  |
 * | GetPlayers()        | getPlayers()       | GET /api/lobby/{id}/players |
 * | LeaveLobby()        | leaveLobby()       | POST /api/lobby/{userId}/leave |
 */

import { fetchApi } from './api';
import type {
  CreateLobbyRequest,
  JoinLobbyRequest,
  LobbyResponse,
  PlayerResponse,
} from '@/types/lobby';

// ============================================
// LOBİ OLUŞTURMA
// ============================================

/**
 * Yeni lobi oluşturur
 * 
 * BACKEND REFERANS:
 * - LobbyController.cs → CreateLobby()
 * - [HttpPost("create")]
 * 
 * SENARYO: MADDE 1
 * - Admin "Oyunu Kur" butonuna tıklar
 * - Bu fonksiyon çağrılır
 * - PostgreSQL'de Lobbies tablosuna kayıt yapılır
 * - Lobi kodu döner (örn: "K7")
 * 
 * @param request - Lobi oluşturma isteği
 * @returns Promise<LobbyResponse> - Oluşturulan lobi bilgisi
 * 
 * KULLANIM:
 * const lobby = await createLobby({ adminUsername: "Admin" });
 * console.log(lobby.code); // "K7"
 */
export async function createLobby(
  request: CreateLobbyRequest
): Promise<LobbyResponse> {
  return fetchApi<LobbyResponse>('/api/lobby/create', {
    method: 'POST',
    body: request,
  });
}

// ============================================
// LOBİYE KATILMA
// ============================================

/**
 * Lobiye katılır
 * 
 * BACKEND REFERANS:
 * - LobbyController.cs → JoinLobby()
 * - [HttpPost("join")]
 * 
 * SENARYO: MADDE 2-3
 * - Oyuncu QR kod tarar veya kod girer
 * - Bu fonksiyon çağrılır
 * - PostgreSQL'de Users tablosuna kayıt yapılır
 * - SignalR ile diğer oyunculara bildirim gider
 * 
 * @param request - Katılma isteği
 * @returns Promise<LobbyResponse> - Güncel lobi bilgisi
 * 
 * KULLANIM:
 * const lobby = await joinLobby({ lobbyCode: "K7", username: "Ali" });
 * console.log(lobby.players.length); // 2
 */
export async function joinLobby(
  request: JoinLobbyRequest
): Promise<LobbyResponse> {
  return fetchApi<LobbyResponse>('/api/lobby/join', {
    method: 'POST',
    body: request,
  });
}

// ============================================
// LOBİ BİLGİSİ GETIRME
// ============================================

/**
 * Lobi koduna göre lobi bilgisi getirir
 * 
 * BACKEND REFERANS:
 * - LobbyController.cs → GetLobbyByCode()
 * - [HttpGet("{code}")]
 * 
 * @param code - Lobi kodu (örn: "K7")
 * @returns Promise<LobbyResponse> - Lobi bilgisi
 * 
 * KULLANIM:
 * const lobby = await getLobbyByCode("K7");
 * console.log(lobby.players); // [{...}, {...}]
 */
export async function getLobbyByCode(code: string): Promise<LobbyResponse> {
  return fetchApi<LobbyResponse>(`/api/lobby/${code}`, {
    method: 'GET',
  });
}

// ============================================
// OYUNCU LİSTESİ
// ============================================

/**
 * Lobideki oyuncuları listeler
 * 
 * BACKEND REFERANS:
 * - LobbyController.cs → GetPlayers()
 * - [HttpGet("{lobbyId:int}/players")]
 * 
 * SENARYO: MADDE 4
 * - Lobi sayfasında oyuncu listesi gösterilir
 * 
 * @param lobbyId - Lobi ID
 * @returns Promise<PlayerResponse[]> - Oyuncu listesi
 * 
 * KULLANIM:
 * const players = await getPlayers(1);
 * players.forEach(p => console.log(p.username));
 */
export async function getPlayers(lobbyId: number): Promise<PlayerResponse[]> {
  return fetchApi<PlayerResponse[]>(`/api/lobby/${lobbyId}/players`, {
    method: 'GET',
  });
}

// ============================================
// LOBİDEN AYRILMA
// ============================================

/**
 * Lobiden ayrılır
 * 
 * BACKEND REFERANS:
 * - LobbyController.cs → LeaveLobby()
 * - [HttpPost("{userId:int}/leave")]
 * 
 * @param userId - Kullanıcı ID
 * @returns Promise<{ message: string }> - Başarı mesajı
 * 
 * KULLANIM:
 * await leaveLobby(5);
 */
export async function leaveLobby(
  userId: number
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/api/lobby/${userId}/leave`, {
    method: 'POST',
  });
}

