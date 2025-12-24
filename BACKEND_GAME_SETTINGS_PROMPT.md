# Backend Geliştirme: Oyun Ayarları

## Problem
Frontend'de oyun ayarları eklendi. Bu ayarların backend'de saklanması ve tüm oyuncular için aynı ayarlarla oyun oynanması gerekiyor.

## Frontend'den Gelen Veri
Lobby oluşturulurken artık oyun ayarları da gönderiliyor:

```json
{
  "adminUsername": "Admin",
  "pairCount": 6,           // 4-18 arası
  "duplicateLevel": 2,      // 2: kolay, 3: orta, 4: zor
  "colorTheme": "su-yesili" // "su-yesili" | "mavi" | "kirmizi" | "pembe" | "turuncu"
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
    public string ColorTheme { get; set; } = "su-yesili"; // Renk teması
    
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
    // Mevcut kod...
    
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
    
    var validThemes = new[] { "su-yesili", "mavi", "kirmizi", "pembe", "turuncu" };
    if (!validThemes.Contains(lobby.ColorTheme))
    {
        throw new BadRequestException("Geçersiz renk teması");
    }
    
    // Mevcut kod devam eder...
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

### 6. DbContext - Migration
**Dosya:** `Infrastructure/Persistence/SiyerDbContext.cs`

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<Lobby>(entity =>
    {
        // Mevcut konfigürasyonlar...
        
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
   - `PairCount`: 4-18 arası olmalı
   - `DuplicateLevel`: 2, 3 veya 4 olmalı
   - `ColorTheme`: Geçerli tema isimlerinden biri olmalı

3. **Tüm Oyuncular İçin Aynı:** Lobby oluşturulduğunda ayarlar kaydedilir ve tüm oyuncular aynı ayarlarla oynar.

4. **Frontend Uyumu:** Frontend'den gelen `pairCount`, `duplicateLevel`, `colorTheme` field'larını kullanın.

## Test Senaryosu

1. **Lobby oluşturma:** Oyun ayarları ile lobby oluşturulur
2. **Lobby bilgisi getirme:** `GetLobbyByCode` veya `GetLobbyResponseAsync` oyun ayarlarını döner
3. **Varsayılan değerler:** Ayarlar gönderilmezse varsayılan değerler kullanılır
4. **Validasyon:** Geçersiz değerler hata döner

## Beklenen Sonuç

- Lobby oluşturulurken oyun ayarları kaydedilir
- Tüm oyuncular aynı ayarlarla oyun oynar
- Frontend lobby bilgisi alırken oyun ayarlarını da alır
- Geçersiz ayarlar reddedilir

