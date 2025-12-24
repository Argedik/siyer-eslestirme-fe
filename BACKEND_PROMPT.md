# Backend Geliştirme: DeviceId ile Kullanıcı Güncelleme

## Problem
Aynı cihazdan tekrar "Oyuna Katıl" yapıldığında, backend yeni bir kullanıcı oluşturuyor. Bunun yerine mevcut kullanıcıyı bulup sadece isim ve avatar'ını güncellemeli.

## Frontend'den Gelen Veri
Frontend artık `deviceId` gönderiyor (aynı browser'da her zaman aynı ID):
```json
{
  "lobbyCode": "AB",
  "username": "Esma bint Ebû Bekir (r.a.)",
  "avatarUrl": "Esma bint Ebû Bekir (r.a.)",
  "deviceId": "1735123456789-a3f5b2c1"
}
```

## Yapılması Gerekenler

### 1. User Entity - DeviceId Ekleme
**Dosya:** `Domain/Entities/User.cs`

```csharp
public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string? AvatarUrl { get; set; }
    public string? DeviceId { get; set; } // ← YENİ: Cihaz tanımlayıcısı
    public bool IsAdmin { get; set; }
    public int LobbyId { get; set; }
    public Lobby Lobby { get; set; }
    public DateTime JoinedAt { get; set; }
    public int Score { get; set; }
}
```

### 2. JoinLobbyRequest DTO - DeviceId Ekleme
**Dosya:** `Application/DTOs/Requests/JoinLobbyRequest.cs`

```csharp
public class JoinLobbyRequest
{
    public string LobbyCode { get; set; }
    public string Username { get; set; }
    public string? AvatarUrl { get; set; }
    public string? DeviceId { get; set; } // ← YENİ: Frontend'den gelecek
}
```

**NOT:** Eğer `clientId` field'ı varsa, onu kaldırıp `deviceId` kullanın.

### 3. UserRepository - GetByDeviceIdAsync Metodu
**Dosya:** `Infrastructure/Repositories/UserRepository.cs` veya `Application/Repositories/IUserRepository.cs`

**Interface'e ekle:**
```csharp
public interface IUserRepository
{
    Task<User?> GetByDeviceIdAsync(string deviceId, int lobbyId);
    // ... diğer metodlar
}
```

**Implementation:**
```csharp
public async Task<User?> GetByDeviceIdAsync(string deviceId, int lobbyId)
{
    return await _context.Users
        .FirstOrDefaultAsync(u => u.DeviceId == deviceId && u.LobbyId == lobbyId);
}
```

### 4. LobbyService - Güncelleme Mantığı
**Dosya:** `Application/Services/LobbyService.cs` veya `Application/UseCases/JoinLobby.cs`

**Mevcut `JoinLobbyAsync` metodunu şu şekilde güncelle:**

```csharp
public async Task<LobbyResponse> JoinLobbyAsync(JoinLobbyRequest request)
{
    // 1. Lobi bul
    var lobby = await _lobbyRepository.GetByCodeAsync(request.LobbyCode);
    if (lobby == null)
    {
        throw new NotFoundException("Lobi bulunamadı");
    }

    // 2. DeviceId ile mevcut kullanıcıyı ara (aynı cihazdan aynı lobiye)
    User? existingUser = null;
    if (!string.IsNullOrEmpty(request.DeviceId))
    {
        existingUser = await _userRepository.GetByDeviceIdAsync(
            request.DeviceId, 
            lobby.Id
        );
    }

    // 3. Mevcut kullanıcı varsa GÜNCELLE, yoksa YENİ OLUŞTUR
    if (existingUser != null)
    {
        // MEVCUT KULLANICI: Sadece isim ve avatar'ı güncelle
        existingUser.Username = request.Username;
        existingUser.AvatarUrl = request.AvatarUrl;
        // DeviceId zaten var, güncellemeye gerek yok
        // JoinedAt ve Score değişmez
        
        await _context.SaveChangesAsync();
        
        return await GetLobbyResponseAsync(lobby.Id);
    }
    else
    {
        // YENİ KULLANICI: Oluştur
        var newUser = new User
        {
            Username = request.Username,
            AvatarUrl = request.AvatarUrl,
            DeviceId = request.DeviceId, // ← YENİ: DeviceId kaydet
            IsAdmin = false,
            LobbyId = lobby.Id,
            JoinedAt = DateTime.UtcNow,
            Score = 0
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();
        
        return await GetLobbyResponseAsync(lobby.Id);
    }
}
```

### 5. DbContext - DeviceId Unique Index
**Dosya:** `Infrastructure/Persistence/SiyerDbContext.cs` veya `Infrastructure/Data/ApplicationDbContext.cs`

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // User Entity konfigürasyonu
    modelBuilder.Entity<User>(entity =>
    {
        // DeviceId + LobbyId kombinasyonu unique olsun
        // (Aynı cihazdan aynı lobiye sadece 1 kullanıcı)
        entity.HasIndex(u => new { u.DeviceId, u.LobbyId })
            .IsUnique()
            .HasFilter("[DeviceId] IS NOT NULL");
        
        // DeviceId nullable ama unique olmalı (null değerler hariç)
        entity.Property(u => u.DeviceId)
            .HasMaxLength(100);
    });
}
```

### 6. Migration Oluşturma
Terminal'de:

```bash
# Migration oluştur
dotnet ef migrations add AddDeviceIdToUser

# Veritabanına uygula
dotnet ef database update
```

## Önemli Notlar

1. **Unique Index:** `DeviceId + LobbyId` kombinasyonu unique olmalı (aynı cihazdan aynı lobiye sadece 1 kullanıcı)
2. **Null Kontrolü:** `DeviceId` null olabilir (eski kayıtlar için), ama yeni kayıtlarda dolu olmalı
3. **Güncelleme Mantığı:** DeviceId ile bulunan kullanıcı varsa sadece `Username` ve `AvatarUrl` güncellenir, yeni kayıt oluşturulmaz
4. **Frontend Uyumu:** Frontend'den gelen `deviceId` field'ını kullanın (eski `clientId` varsa kaldırın)

## Test Senaryosu

1. **İlk giriş:** DeviceId ile yeni kullanıcı oluşturulur
2. **İkinci giriş (aynı cihaz, aynı lobi):** DeviceId ile mevcut kullanıcı bulunur, sadece isim/avatar güncellenir
3. **Farklı cihaz:** Yeni DeviceId ile yeni kullanıcı oluşturulur
4. **Aynı cihaz, farklı lobi:** Yeni kullanıcı oluşturulur (DeviceId + LobbyId unique kombinasyonu)

## Beklenen Sonuç

- Aynı cihazdan tekrar giriş yapıldığında oyuncu sayısı artmaz
- Sadece kullanıcının ismi ve avatar'ı güncellenir
- Her cihaz için benzersiz bir kullanıcı kaydı tutulur

