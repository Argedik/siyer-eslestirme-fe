/**
 * Lobby Tipleri - Backend DTO Karşılıkları
 * 
 * BACKEND REFERANS:
 * - Application/DTOs/Requests/CreateLobbyRequest.cs
 * - Application/DTOs/Requests/JoinLobbyRequest.cs
 * - Application/DTOs/Responses/LobbyResponse.cs
 * - Application/DTOs/Responses/PlayerResponse.cs
 * 
 * SOLID PRENSİPLERİ:
 * - S (Single Responsibility): Sadece lobi tiplerini tanımlar
 * - I (Interface Segregation): Her tip ayrı, küçük ve odaklı
 */

// ============================================
// REQUEST TİPLERİ (Frontend → Backend)
// ============================================

/**
 * Lobi Oluşturma İsteği
 * 
 * BACKEND REFERANS:
 * - POST /api/lobby/create
 * - CreateLobbyRequest.cs
 * 
 * KULLANIM:
 * const request: CreateLobbyRequest = { adminUsername: "Admin" };
 */
export interface CreateLobbyRequest {
  /** Lobi oluşturan kullanıcının adı */
  adminUsername: string;
}

/**
 * Lobiye Katılma İsteği
 * 
 * BACKEND REFERANS:
 * - POST /api/lobby/join
 * - JoinLobbyRequest.cs
 * 
 * KULLANIM:
 * const request: JoinLobbyRequest = { lobbyCode: "K7", username: "Ali" };
 */
export interface JoinLobbyRequest {
  /** Lobi kodu (örn: "K7") */
  lobbyCode: string;
  /** Katılan kullanıcının adı */
  username: string;
  /** Avatar URL'i (opsiyonel) - Avvvatars için kullanılan value */
  avatarUrl?: string;
  /** Unique client ID - Her kullanıcı için benzersiz ID */
  clientId?: string;
}

// ============================================
// RESPONSE TİPLERİ (Backend → Frontend)
// ============================================

/**
 * Oyuncu Bilgisi
 * 
 * BACKEND REFERANS:
 * - PlayerResponse.cs
 */
export interface PlayerResponse {
  /** Oyuncu ID */
  id: number;
  /** Oyuncu kullanıcı adı */
  username: string;
  /** Admin mi? */
  isAdmin: boolean;
  /** Avatar URL'i (opsiyonel) - Avvvatars için kullanılan value */
  avatarUrl?: string;
  /** Katılma zamanı (opsiyonel) */
  joinedAt?: string;
}

/**
 * Lobi Durumu Enum
 * 
 * BACKEND REFERANS:
 * - Domain/Entities/LobbyStatus.cs
 */
export enum LobbyStatus {
  /** Oyuncu bekleniyor */
  Waiting = 0,
  /** Oyun devam ediyor */
  InProgress = 1,
  /** Oyun tamamlandı */
  Completed = 2,
}

/**
 * Lobi Bilgisi Yanıtı
 * 
 * BACKEND REFERANS:
 * - LobbyResponse.cs
 * - GET /api/lobby/{code}
 * - POST /api/lobby/create
 * - POST /api/lobby/join
 * 
 * KULLANIM:
 * const lobby: LobbyResponse = await createLobby({ adminUsername: "Admin" });
 * console.log(lobby.code); // "K7"
 */
export interface LobbyResponse {
  /** Lobi ID */
  id: number;
  /** Lobi kodu (2 hane, örn: "K7") */
  code: string;
  /** Lobi durumu */
  status: LobbyStatus;
  /** Oluşturulma zamanı */
  createdAt: string;
  /** Lobideki oyuncular */
  players: PlayerResponse[];
}

