# Backend Geliştirme: Oyun Ayarları - Final Versiyon

## Problem
Frontend'de oyun ayarları eklendi ve kullanılıyor. Bu ayarların backend'de saklanması, validasyonu ve tüm oyuncular için aynı ayarlarla oyun oynanması gerekiyor.

## Frontend'den Gelen Veri

### 1. Lobby Oluşturulurken (POST /api/lobby/create)
**NOT:** Şu anda frontend'de `CreateGame` use case'i sadece `adminUsername` gönderiyor. İleride oyun ayarları da gönderilecek:

```json
{
  "adminUsername": "Admin",
  "pairCount": 6,           // 4-18 arası (opsiyonel, varsayılan: 6)
  "duplicateLevel": 2,      // 2: kolay, 3: orta, 4: zor (opsiyonel, varsayılan: 2)
  "colorTheme": "su-yesili" // 6 renk seçeneği (opsiyonel, varsayılan: "su-yesili")
}
```

**Geçerli Renk Temaları:**
- `"su-yesili"` (Su Yeşili)
- `"mavi"` (Mavi)
- `"kirmizi"` (Kırmızı)
- `"pembe"` (Pembe)
- `"turuncu"` (Turuncu)
- `"mor"` (Mor) ← YENİ EKLENEN

### 2. Lobby Bilgisi Alınırken (GET /api/lobby/{code})
Backend'den dönen `LobbyResponse` içinde oyun ayarları da olmalı:

```json
{
  "id": 1,
  "code": "AB",
  "status": 0,
  "createdAt": "2025-01-20T10:00:00Z",
  "players": [...],
  "pairCount": 6,
  "duplicateLevel": 2,
  "colorTheme": "su-yesili"
}
```

## Yapılması Gerekenler

### 1. Lobby Entity - Oyun Ayarları Ekleme
**Dosya:** `Domain/Entities/Lobby.cs`

```csharp
public class Lobby
{
    public int Id { get; set; }
    public string Code { get; set; }
    public LobbyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // ← YENİ: Oyun ayarları
    public int PairCount { get; set; } = 6;              // 4-18 arası
    public int DuplicateLevel { get; set; } = 2;         // 2: kolay, 3: orta, 4: zor
    public string ColorTheme { get; set; } = "su-yesili"; // Renk teması (6 seçenek)
    
    public ICollection<User> Users { get; set; } = new List<User>();
}
```

### 2. CreateLobbyRequest DTO - Oyun Ayarları Ekleme
**Dosya:** `Application/DTOs/Requests/CreateLobbyRequest.cs`

```csharp
public class CreateLobbyRequest
{
    public string AdminUsername { get; set; }
    
    // ← YENİ: Oyun ayarları (opsiyonel, varsayılan değerler kullanılabilir)
    public int? PairCount { get; set; }           // 4-18 arası, varsayılan: 6
    public int? DuplicateLevel { get; set; }      // 2, 3 veya 4, varsayılan: 2
    public string? ColorTheme { get; set; }        // Renk teması, varsayılan: "su-yesili"
}
```

### 3. LobbyResponse DTO - Oyun Ayarları Ekleme
**Dosya:** `Application/DTOs/Responses/LobbyResponse.cs`

```csharp
public class LobbyResponse
{
    public int Id { get; set; }
    public string Code { get; set; }
    public LobbyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PlayerResponse> Players { get; set; } = new();
    
    // ← YENİ: Oyun ayarları
    public int PairCount { get; set; }
    public int DuplicateLevel { get; set; }
    public string ColorTheme { get; set; }
}
```

### 4. LobbyService - CreateLobbyAsync Güncelleme
**Dosya:** `Application/Services/LobbyService.cs` veya `Application/UseCases/CreateLobby.cs`

```csharp
public async Task<LobbyResponse> CreateLobbyAsync(CreateLobbyRequest request)
{
    // Mevcut kod (lobi kodu oluşturma, admin kullanıcı oluşturma vb.)...
    
    var lobby = new Lobby
    {
        Code = generatedCode,
        Status = LobbyStatus.Waiting,
        CreatedAt = DateTime.UtcNow,
        
        // ← YENİ: Oyun ayarları (varsayılan değerler ile)
        PairCount = request.PairCount ?? 6,
        DuplicateLevel = request.DuplicateLevel ?? 2,
        ColorTheme = request.ColorTheme ?? "su-yesili",
    };
    
    // Validasyon
    if (lobby.PairCount < 4 || lobby.PairCount > 18)
    {
        throw new BadRequestException("Kart çifti sayısı 4-18 arası olmalıdır");
    }
    
    if (lobby.DuplicateLevel < 2 || lobby.DuplicateLevel > 4)
    {
        throw new BadRequestException("Mükerrer seviyesi 2, 3 veya 4 olmalıdır");
    }
    
    // Geçerli renk temaları (6 adet)
    var validThemes = new[] { "su-yesili", "mavi", "kirmizi", "pembe", "turuncu", "mor" };
    if (!validThemes.Contains(lobby.ColorTheme))
    {
        throw new BadRequestException("Geçersiz renk teması. Geçerli temalar: su-yesili, mavi, kirmizi, pembe, turuncu, mor");
    }
    
    // Mevcut kod devam eder (admin kullanıcı oluşturma, kaydetme vb.)...
    _context.Lobbies.Add(lobby);
    await _context.SaveChangesAsync();
    
    return await GetLobbyResponseAsync(lobby.Id);
}
```

### 5. LobbyService - GetLobbyResponseAsync Güncelleme
**Dosya:** `Application/Services/LobbyService.cs`

```csharp
private async Task<LobbyResponse> GetLobbyResponseAsync(int lobbyId)
{
    var lobby = await _lobbyRepository.GetByIdAsync(lobbyId);
    if (lobby == null)
    {
        throw new NotFoundException("Lobi bulunamadı");
    }

    var players = await _userRepository.GetByLobbyIdAsync(lobbyId);

    return new LobbyResponse
    {
        Id = lobby.Id,
        Code = lobby.Code,
        Status = lobby.Status,
        CreatedAt = lobby.CreatedAt,
        Players = players.Select(u => new PlayerResponse
        {
            Id = u.Id,
            Username = u.Username,
            IsAdmin = u.IsAdmin,
            AvatarUrl = u.AvatarUrl,
            Score = u.Score,
            JoinedAt = u.JoinedAt,
        }).ToList(),
        
        // ← YENİ: Oyun ayarları
        PairCount = lobby.PairCount,
        DuplicateLevel = lobby.DuplicateLevel,
        ColorTheme = lobby.ColorTheme,
    };
}
```

**NOT:** `GetLobbyByCodeAsync` veya benzeri metodlar da aynı şekilde güncellenmeli.

### 6. DbContext - Migration Konfigürasyonu
**Dosya:** `Infrastructure/Persistence/SiyerDbContext.cs` veya `Infrastructure/Data/ApplicationDbContext.cs`

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<Lobby>(entity =>
    {
        // Mevcut konfigürasyonlar (Code unique, vb.)...
        
        // ← YENİ: Oyun ayarları
        entity.Property(l => l.PairCount)
            .IsRequired()
            .HasDefaultValue(6);
            
        entity.Property(l => l.DuplicateLevel)
            .IsRequired()
            .HasDefaultValue(2);
            
        entity.Property(l => l.ColorTheme)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("su-yesili");
    });
}
```

### 7. Migration Oluşturma
Terminal'de:

```bash
# Migration oluştur
dotnet ef migrations add AddGameSettingsToLobby

# Veritabanına uygula
dotnet ef database update
```

## Önemli Notlar

1. **Varsayılan Değerler:** Eğer frontend'den ayarlar gelmezse, varsayılan değerler kullanılmalı:
   - `PairCount`: 6
   - `DuplicateLevel`: 2 (kolay)
   - `ColorTheme`: "su-yesili"

2. **Validasyon:** 
   - `PairCount`: 4-18 arası olmalı (dahil)
   - `DuplicateLevel`: 2, 3 veya 4 olmalı
   - `ColorTheme`: 6 geçerli tema isimlerinden biri olmalı: "su-yesili", "mavi", "kirmizi", "pembe", "turuncu", "mor"

3. **Tüm Oyuncular İçin Aynı:** Lobby oluşturulduğunda ayarlar kaydedilir ve tüm oyuncular aynı ayarlarla oyun oynar. Frontend'de `GetLobbyByCode` çağrıldığında bu ayarlar döner.

4. **Frontend Uyumu:** Frontend'den gelen `pairCount`, `duplicateLevel`, `colorTheme` field'larını kullanın. Şu anda frontend'de bu ayarlar tanımlı ama lobby oluşturulurken gönderilmiyor (ileride gönderilecek).

5. **Backward Compatibility:** Eski lobiler için varsayılan değerler kullanılacak (migration'da default değerler set edildiği için).

## Test Senaryosu

1. **Lobby oluşturma (ayarlar ile):**
   ```json
   POST /api/lobby/create
   {
     "adminUsername": "Admin",
     "pairCount": 8,
     "duplicateLevel": 3,
     "colorTheme": "mavi"
   }
   ```
   → Lobby oluşturulur, ayarlar kaydedilir

2. **Lobby oluşturma (ayarlar olmadan):**
   ```json
   POST /api/lobby/create
   {
     "adminUsername": "Admin"
   }
   ```
   → Lobby oluşturulur, varsayılan ayarlar kullanılır (6, 2, "su-yesili")

3. **Lobby bilgisi getirme:**
   ```
   GET /api/lobby/AB
   ```
   → Oyun ayarları da döner

4. **Validasyon testleri:**
   - `pairCount: 3` → Hata: "Kart çifti sayısı 4-18 arası olmalıdır"
   - `pairCount: 20` → Hata: "Kart çifti sayısı 4-18 arası olmalıdır"
   - `duplicateLevel: 5` → Hata: "Mükerrer seviyesi 2, 3 veya 4 olmalıdır"
   - `colorTheme: "gecersiz"` → Hata: "Geçersiz renk teması"

## Beklenen Sonuç

- ✅ Lobby oluşturulurken oyun ayarları kaydedilir (varsayılan veya gönderilen değerler)
- ✅ Tüm oyuncular aynı ayarlarla oyun oynar
- ✅ Frontend lobby bilgisi alırken oyun ayarlarını da alır
- ✅ Geçersiz ayarlar reddedilir
- ✅ Eski lobiler için varsayılan değerler kullanılır

## Frontend Notu

**ÖNEMLİ:** Şu anda frontend'de `CreateGame` use case'i sadece `adminUsername` gönderiyor. İleride oyun ayarları da gönderilecek. Backend şimdiden hazır olmalı, ayarlar gönderilmezse varsayılan değerleri kullanmalı.

