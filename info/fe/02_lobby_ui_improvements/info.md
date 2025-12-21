# ADIM 2: Lobi UI İyileştirmeleri ve Hata Yönetimi

## TARİH: 2025-12-21

## YOL HARİTASI - MİKRO ADIMLAR

**FAZE 1: BACKEND'İ ANLAMA** ✅
- 1.1 Endpoint Nedir? ✅
- 1.2 Hangi Endpoint'e İhtiyacımız Var? ✅
- 1.3 LobbyController.cs İnceleme ✅
- 1.4 Frontend API Servis Katmanı ✅

**FAZE 2: UI İYİLEŞTİRMELERİ** ✅ (TAMAMLANDI)
- 2.1 CORS Ayarları (Backend) ✅
- 2.2 "Lobiye Git" Butonu Ekleme ✅
- 2.3 Hata Durumu Yönetimi ✅
- 2.4 Dialog Conditional Rendering ✅

---

## YAPILAN İŞLER ÖZETİ

### 1. CORS Ayarları (Backend)

**Sorun:** Frontend (`http://192.168.1.110:3000`) backend'e (`http://78.180.182.197:8080`) istek gönderemiyordu.

**Hata Mesajı:**
```
Access to fetch at 'http://78.180.182.197:8080/health' from origin 'http://192.168.1.110:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Çözüm:** Backend'de `Program.cs` dosyasına frontend origin'leri eklendi.

**Dosya:** `Backend/Program.cs` (Raspberry Pi'de: `/home/argedik/Desktop/be/2025/nov/siyer-eslestirme-be/Program.cs`)

**Eklenen Origin'ler:**
```csharp
policy.WithOrigins(
    "http://localhost:3000",
    "http://localhost:3001",
    "http://192.168.1.110:3000",  // ← Development network IP
    "https://siyer-eslestirme.vercel.app"  // ← Production
)
```

**Not:** Backend değişikliklerinden sonra backend'i yeniden başlatmak gerekiyor.

---

### 2. "Lobiye Git" Butonu Ekleme

**Sorun:** Lobi oluşturulduktan sonra kullanıcı dialog'u kapatıp manuel olarak `/lobby/{code}` URL'ine gitmek zorundaydı.

**Çözüm:** Dialog'a "Lobiye Git" butonu eklendi, tıklandığında otomatik yönlendirme yapılıyor.

#### Değişiklik 1: GameReadyDialog Component

**Dosya:** `src/components/GameReadyDialog/index.tsx`

**Eklenen Prop:**
```typescript
interface GameReadyDialogProps {
  // ... mevcut props
  onNavigateToLobby?: () => void; // ← YENİ: Lobiye git callback'i
}
```

**Buton Mantığı:**
```typescript
<div className={styles.actions}>
  {onNavigateToLobby ? (
    <button onClick={onNavigateToLobby} className={styles.primaryButton}>
      Lobiye Git
    </button>
  ) : null}
</div>
```

**Açıklama:**
- `onNavigateToLobby` varsa → "Lobiye Git" butonu gösterilir
- Yoksa → Buton gösterilmez (fallback kaldırıldı)

#### Değişiklik 2: LandingPage Component

**Dosya:** `src/components/home/LandingPage.tsx`

**Eklenen Import:**
```typescript
import { useRouter } from 'next/navigation';
```

**Eklenen State:**
```typescript
const router = useRouter();
```

**Eklenen Fonksiyon:**
```typescript
const handleNavigateToLobby = () => {
  setGameReadyDialogOpen(false);  // Dialog'u kapat
  router.push(`/lobby/${gameCode}`);  // Lobi sayfasına yönlendir
};
```

**Prop Geçirme:**
```typescript
<GameReadyDialog 
  // ... mevcut props
  onNavigateToLobby={handleNavigateToLobby} // ← YENİ
/>
```

**Akış:**
1. Kullanıcı "Oyunu Kur" butonuna tıklar
2. Lobi başarıyla oluşturulur
3. Dialog açılır → "Lobiye Git" butonu görünür
4. Kullanıcı "Lobiye Git" butonuna tıklar
5. Dialog kapanır → `/lobby/{kod}` sayfasına yönlendirilir

---

### 3. Hata Durumu Yönetimi

**Sorun:** Backend'e bağlanılamadığında veya hata oluştuğunda kullanıcıya net bir mesaj gösterilmiyordu.

**Çözüm:** Hata durumunda dialog açılıp "Sunucumuzu açmamız gerekiyor" uyarısı gösteriliyor.

#### Değişiklik 1: GameReadyDialog - Hata Gösterimi

**Dosya:** `src/components/GameReadyDialog/index.tsx`

**Eklenen Prop:**
```typescript
interface GameReadyDialogProps {
  // ... mevcut props
  error?: string | null; // ← YENİ: Hata mesajı
}
```

**Conditional Rendering:**
```typescript
{error ? (
  // HATA DURUMU
  <>
    <h2 className={styles.title}>⚠️ Sunucu Hatası</h2>
    <p className={styles.description} style={{ color: '#ff6b6b' }}>
      Sunucumuzu açmamız gerekiyor
    </p>
    <div className={styles.content}>
      <p>{error}</p>
    </div>
    <div className={styles.actions}>
      <button onClick={onClose} className={styles.primaryButton}>
        Tamam
      </button>
    </div>
  </>
) : (
  // BAŞARILI DURUM
  <>
    <h2 className={styles.title}>🎉 Oyun Hazır!</h2>
    {/* Kod, QR kod, vb. */}
    <div className={styles.actions}>
      {onNavigateToLobby && (
        <button onClick={onNavigateToLobby}>Lobiye Git</button>
      )}
    </div>
  </>
)}
```

**Açıklama:**
- `error` varsa → "Sunucu Hatası" başlığı + "Sunucumuzu açmamız gerekiyor" mesajı + "Tamam" butonu
- `error` yoksa → "Oyun Hazır!" başlığı + Kod/QR kod + "Lobiye Git" butonu

#### Değişiklik 2: CreateGameButton - Hata Callback

**Dosya:** `src/components/CreateGameButton/index.tsx`

**Eklenen Prop:**
```typescript
interface CreateGameButtonProps {
  onGameCreated: (code: string, joinUrl: string) => void;
  onError?: (error: string) => void; // ← YENİ: Hata callback'i
}
```

**Hata Durumunda Callback:**
```typescript
catch (err) {
  const errorMessage = err instanceof Error ? err.message : '...';
  setError(errorMessage);
  
  // Hata callback'ini çağır (dialog açmak için)
  if (onError) {
    onError(errorMessage); // ← YENİ: Parent'a hata bildir
  }
}
```

**Açıklama:** Hata oluştuğunda `onError` callback'i çağrılıyor, böylece parent component dialog'u hata mesajıyla açabiliyor.

#### Değişiklik 3: LandingPage - Hata State Yönetimi

**Dosya:** `src/components/home/LandingPage.tsx`

**Eklenen State:**
```typescript
const [gameError, setGameError] = useState<string | null>(null);
```

**Eklenen Fonksiyon:**
```typescript
const handleGameError = (error: string) => {
  setGameCode('');
  setJoinUrl('');
  setGameError(error); // Hata mesajını kaydet
  setGameReadyDialogOpen(true); // Dialog'u aç (hata mesajı ile)
};
```

**Güncellenen Fonksiyon:**
```typescript
const handleGameCreated = (code: string, url: string) => {
  setGameCode(code);
  setJoinUrl(url);
  setGameError(null); // ← YENİ: Hata temizle
  setGameReadyDialogOpen(true);
};
```

**Prop Geçirme:**
```typescript
<CreateGameButton 
  onGameCreated={handleGameCreated}
  onError={handleGameError} // ← YENİ: Hata callback'i
/>

<GameReadyDialog 
  // ... mevcut props
  onNavigateToLobby={gameError ? undefined : handleNavigateToLobby} // ← Hata varsa navigation yok
  error={gameError} // ← YENİ: Hata mesajı
/>
```

**Akış:**
1. Kullanıcı "Oyunu Kur" butonuna tıklar
2. Backend'e istek gider → Hata oluşur (örn: CORS, network)
3. `handleGameError(error)` çağrılır
4. `gameError` state'e kaydedilir
5. Dialog açılır → "Sunucu Hatası" + "Sunucumuzu açmamız gerekiyor" + "Tamam" butonu
6. Kullanıcı "Tamam" butonuna tıklar → Dialog kapanır

---

## DOSYA DEĞİŞİKLİKLERİ ÖZETİ

| Dosya | Değişiklik | Açıklama |
|-------|------------|----------|
| `src/components/GameReadyDialog/index.tsx` | `onNavigateToLobby` prop eklendi | Lobiye git callback'i |
| `src/components/GameReadyDialog/index.tsx` | `error` prop eklendi | Hata mesajı |
| `src/components/GameReadyDialog/index.tsx` | Conditional rendering | Hata varsa uyarı, yoksa başarılı içerik |
| `src/components/CreateGameButton/index.tsx` | `onError` prop eklendi | Hata callback'i |
| `src/components/CreateGameButton/index.tsx` | Hata durumunda callback çağrılıyor | Parent'a hata bildirimi |
| `src/components/home/LandingPage.tsx` | `useRouter` import edildi | Next.js navigation |
| `src/components/home/LandingPage.tsx` | `gameError` state eklendi | Hata mesajı state'i |
| `src/components/home/LandingPage.tsx` | `handleNavigateToLobby` eklendi | Lobi sayfasına yönlendirme |
| `src/components/home/LandingPage.tsx` | `handleGameError` eklendi | Hata durumu yönetimi |

---

## TEST SONUÇLARI

### Test 1: CORS Ayarları ✅

**Test:** Browser console'da health check
```javascript
fetch('http://78.180.182.197:8080/health')
  .then(r => r.json())
  .then(console.log)
```

**Sonuç:** ✅ Başarılı - CORS hatası yok, JSON yanıtı geldi

### Test 2: Lobi Oluşturma ✅

**Test:** "Oyunu Kur" butonuna tıkla

**Network Tab:**
- ✅ OPTIONS request (CORS preflight) → 204 No Content
- ✅ POST `/api/lobby/create` → 200 OK
- ✅ Response: `{ id: 1, code: "9H", status: 0, ... }`

**pgAdmin:**
- ✅ `Lobbies` tablosunda yeni kayıt var
- ✅ `Code` sütunu: "9H"
- ✅ `Status` = 0

### Test 3: "Lobiye Git" Butonu ✅

**Test:** Dialog açıldığında "Lobiye Git" butonuna tıkla

**Sonuç:** ✅ Başarılı - `/lobby/9H` sayfasına yönlendirildi

### Test 4: Hata Durumu (Gelecekte Test Edilecek)

**Test:** Backend'i kapat veya yanlış URL kullan

**Beklenen:** Dialog açılır → "Sunucu Hatası" + "Sunucumuzu açmamız gerekiyor" + "Tamam" butonu

---

## BACKEND NOTLARI

### Eski Lobi Kapatma (Henüz Yapılmadı)

**Sorun:** Her "Oyunu Kur" tıklamasında yeni lobi oluşturuluyor, eski lobiler silinmiyor.

**Çözüm (Backend'de Yapılacak):**

**Dosya:** `Application/Services/LobbyService.cs`

**Mantık:**
```csharp
public async Task<LobbyResponse> CreateLobbyAsync(CreateLobbyRequest request)
{
    // 1. Eski aktif lobileri kapat
    var activeLobbies = await _lobbyRepository.GetActiveLobbiesAsync();
    foreach (var oldLobby in activeLobbies)
    {
        oldLobby.Status = LobbyStatus.Completed; // veya sil
        await _lobbyRepository.UpdateAsync(oldLobby);
    }
    
    // 2. Yeni lobi oluştur
    var newLobby = new Lobby { ... };
    await _lobbyRepository.AddAsync(newLobby);
    return MapToResponse(newLobby);
}
```

**Not:** Bu işlem backend'de yapılmalı (business logic). Frontend'de yapılmamalı.

---

## KOD YAPISI (Clean Architecture)

### Frontend Katmanları

```
src/
├── services/              ← API Servis Katmanı
│   ├── api.ts            ← Temel HTTP client (fetch wrapper)
│   └── lobbyApi.ts       ← Lobi API fonksiyonları
├── types/                 ← TypeScript Tip Tanımları
│   └── lobby.ts          ← Lobi DTO'ları (Backend karşılığı)
├── application/           ← Use Case Katmanı
│   └── usecases/
│       └── CreateGame.ts ← İş mantığı (Backend'e istek)
└── components/            ← UI Katmanı
    ├── CreateGameButton/ ← Buton component'i
    ├── GameReadyDialog/  ← Dialog component'i
    └── home/
        └── LandingPage.tsx ← Ana sayfa (State yönetimi)
```

### SOLID Prensipleri

- **S (Single Responsibility):** Her component/function tek bir iş yapar
- **D (Dependency Inversion):** Component'ler interface'lere bağımlı (callback'ler)
- **O (Open/Closed):** Yeni özellikler eklenebilir, mevcut kod değişmez

---

## ÖNEMLİ NOTLAR

### Backend Yeniden Başlatma

Backend'de değişiklik yapıldığında:
1. Process'i bul: `ps aux | grep "SiyerEslestirme.Api.dll"`
2. Durdur: `kill <PID>`
3. Backend otomatik yeniden başlar (systemd servisi varsa)

### CORS Origin'leri

Backend'de şu origin'ler izinli:
- `http://localhost:3000` (Development)
- `http://localhost:3001` (Development)
- `http://192.168.1.110:3000` (Development - Network IP)
- `https://siyer-eslestirme.vercel.app` (Production)

### Environment Variables

Frontend `.env.local` dosyası:
```
NEXT_PUBLIC_API_BASE_URL=http://78.180.182.197:8080
NEXT_PUBLIC_API_URL=http://78.180.182.197:8080/api
NEXT_PUBLIC_SIGNALR_URL=http://78.180.182.197:8080/hubs/game
NEXT_PUBLIC_IMAGES_BASE_URL=https://argedik.com/images
```

---

## SONRAKİ ADIMLAR

1. ✅ CORS ayarları yapıldı
2. ✅ "Lobiye Git" butonu eklendi
3. ✅ Hata durumu yönetimi eklendi
4. ⏳ Backend'de eski lobileri kapatma (Yapılacak)
5. ⏳ Lobi sayfası backend entegrasyonu (Yapılacak)
6. ⏳ SignalR bağlantısı (Yapılacak)

---

## 10 YIL SONRA OKUYAN İÇİN

Bu dokümantasyon, **2025-12-21** tarihinde yapılan frontend iyileştirmelerini açıklar.

**Ana Değişiklikler:**
1. Backend'e API istekleri gönderme (CORS ayarları ile)
2. Lobi oluşturma sonrası otomatik yönlendirme
3. Hata durumlarında kullanıcıya net mesaj gösterme

**Test Edilen:**
- ✅ CORS çalışıyor
- ✅ Lobi oluşturma çalışıyor
- ✅ PostgreSQL'e kayıt yapılıyor
- ✅ "Lobiye Git" butonu çalışıyor

**Yapılacaklar:**
- Backend'de eski lobileri kapatma mantığı
- Lobi sayfası backend entegrasyonu
- SignalR real-time bağlantısı

**İlgili Dosyalar:**
- Backend: `Program.cs` (CORS ayarları)
- Frontend: `src/services/`, `src/components/GameReadyDialog/`, `src/components/CreateGameButton/`, `src/components/home/LandingPage.tsx`

