# ADIM 1.4: Frontend Lobby API Entegrasyonu

## YOL HARİTASI - MİKRO ADIMLAR

**FAZE 1: BACKEND'İ ANLAMA**
- 1.1 Endpoint Nedir? ✅
- 1.2 Hangi Endpoint'e İhtiyacımız Var? ✅
- 1.3 LobbyController.cs İnceleme ✅
- 1.4 Frontend API Servis Katmanı (ŞU AN BURADAYIZ)

---

## Backend Referans: LobbyController.cs Endpoint'leri

| Endpoint | HTTP Metodu | Açıklama | Frontend'de Kullanım |
|----------|-------------|----------|---------------------|
| `api/lobby/create` | POST | Lobi oluştur | "Oyunu Kur" butonu |
| `api/lobby/join` | POST | Lobiye katıl | "Oyuna Katıl" butonu |
| `api/lobby/{code}` | GET | Lobi bilgisi | Lobi sayfası |
| `api/lobby/{lobbyId}/players` | GET | Oyuncu listesi | Lobi sayfası |
| `api/lobby/{userId}/leave` | POST | Lobiden ayrıl | Çıkış butonu |

---

## Oluşturulacak Dosyalar

### 1. `src/services/api.ts` - Temel API Client

**Amacı:** Tüm API isteklerini yönetir. Fetch wrapper.

**SOLID Prensibi:**
- **S** (Single Responsibility): Sadece HTTP isteklerini yönetir
- **O** (Open/Closed): Yeni endpoint'ler eklenebilir, mevcut kod değişmez

**Backend'den Bakılan Yer:**
- `appsettings.json` → API base URL
- `[Route("api/[controller]")]` → URL formatı

---

### 2. `src/services/lobbyApi.ts` - Lobi API Fonksiyonları

**Amacı:** LobbyController.cs'deki endpoint'lere istek gönderir.

**SOLID Prensibi:**
- **S** (Single Responsibility): Sadece lobi işlemlerini yapar
- **D** (Dependency Inversion): api.ts'e bağımlı (soyutlama)

**Backend'den Bakılan Yer:**
- `LobbyController.cs` → Her `[HttpPost]` ve `[HttpGet]` için bir fonksiyon

**Eşleştirme Tablosu:**

| Backend Fonksiyon | Frontend Fonksiyon |
|-------------------|-------------------|
| `CreateLobby()` | `createLobby()` |
| `JoinLobby()` | `joinLobby()` |
| `GetLobbyByCode()` | `getLobbyByCode()` |
| `GetPlayers()` | `getPlayers()` |
| `LeaveLobby()` | `leaveLobby()` |

---

### 3. `src/types/lobby.ts` - Lobi Tipleri

**Amacı:** TypeScript tip tanımları. Backend DTO'larının frontend karşılığı.

**Backend'den Bakılan Yer:**
- `CreateLobbyRequest.cs` → `CreateLobbyRequest` interface
- `JoinLobbyRequest.cs` → `JoinLobbyRequest` interface
- `LobbyResponse.cs` → `LobbyResponse` interface
- `PlayerResponse.cs` → `PlayerResponse` interface

---

### 4. `src/application/usecases/CreateGame.ts` - Güncelleme

**Amacı:** Backend'e lobi oluşturma isteği gönderir.

**Değişiklik:**
- Eski: `generateCode()` ile frontend'de kod üretiyordu
- Yeni: `lobbyApi.createLobby()` ile backend'e istek gönderir

---

### 5. `src/components/CreateGameButton/index.tsx` - Güncelleme

**Amacı:** Butona tıklandığında backend'e istek gönderir.

**Değişiklik:**
- Eski: Senkron `createGame()` çağrısı
- Yeni: Asenkron `await createGame()` çağrısı + loading/error state

---

## Klasör Yapısı (Sonuç)

```
src/
├── services/           ← YENİ KLASÖR
│   ├── api.ts          ← Temel API client
│   └── lobbyApi.ts     ← Lobi API fonksiyonları
├── types/
│   ├── scss.d.ts       ← Mevcut
│   └── lobby.ts        ← YENİ - Lobi tipleri
├── application/
│   └── usecases/
│       └── CreateGame.ts ← GÜNCELLEME
└── components/
    └── CreateGameButton/
        └── index.tsx     ← GÜNCELLEME
```

---

## Request/Response Formatları

### CreateLobby

**Request:**
```json
POST api/lobby/create
{
  "adminUsername": "Admin"
}
```

**Response:**
```json
{
  "id": 1,
  "code": "K7",
  "status": 0,
  "createdAt": "2025-12-16T17:00:00Z",
  "players": [
    {
      "id": 1,
      "username": "Admin",
      "isAdmin": true
    }
  ]
}
```

### JoinLobby

**Request:**
```json
POST api/lobby/join
{
  "lobbyCode": "K7",
  "username": "Ali"
}
```

**Response:**
```json
{
  "id": 1,
  "code": "K7",
  "status": 0,
  "players": [
    { "id": 1, "username": "Admin", "isAdmin": true },
    { "id": 2, "username": "Ali", "isAdmin": false }
  ]
}
```

---

## Sonraki Adımlar

1. Dosyaları oluştur
2. Frontend'i başlat (`pnpm dev`)
3. "Oyunu Kur" butonuna tıkla
4. pgAdmin'de `Lobbies` tablosunu kontrol et
5. Kayıt var mı? → Test başarılı ✅

