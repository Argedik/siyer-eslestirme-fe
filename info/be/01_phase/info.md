ADIM 1.2: Hangi endpoint'e ihtiyacımız var?
Frontend'de "Oyunu Kur" butonuna tıklandığında:
- Lobi oluşturulmalı
- PostgreSQL'de Lobbies tablosuna kayıt yapılmalı
Bunun için: LobbyController.cs → POST /api/lobby endpoint'ine ihtiyacımız var.

Şimdi yapılacaklar
Adım 1: LobbyController.cs dosyasını aç
Presentation/Controllers/LobbyController.cs dosyasını aç
İçeriği oku
[HttpPost] ile başlayan fonksiyonu bul