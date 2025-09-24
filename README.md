# Siyer Kart Eşleştirme Oyunu

Lise öğrencilerinin severek oynayacağı, 3D animasyonlarla zenginleştirilmiş bir kart eşleştirme oyunu. Oyuncular takma adlarını seçerek web tarayıcılarından oyuna katılabilir, tur ayarlarını yapabilir ve tarihî kavramları öğrenirken eğlenebilir. Yöneticiler ise admin panelinden kart havuzunu kolayca güncelleyebilir.

## Özellikler

- 🪐 **3D kart animasyonları** ve neon temalı arayüz
- 👥 Oyuncu sayısı ve kart çifti seçimi içeren esnek oyun kurulumu
- 🏆 Canlı skor tablosu, eşleşme ilerleme çubuğu ve kazanan bildirimleri
- ✨ Takma ad üretici ile hızlı oyuncu girişleri
- 📚 JSON tabanlı veri deposu: kart başlıkları, açıklamalar ve görsel yolları
- 🛠️ Admin paneli üzerinden kart ekleme, düzenleme ve silme işlemleri

## Teknoloji

- [Next.js 15 (App Router)](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Sass (CSS Modülleri)](https://sass-lang.com/)
- Yerel JSON dosyasıyla basit veri depolama (`data/terms.json`)

## Geliştirme Ortamı

```bash
pnpm install
pnpm dev
```

Varsayılan olarak uygulama `http://localhost:3000` adresinde çalışır. Üretim öncesi doğrulama için:

```bash
pnpm build
pnpm start
```

## Admin Paneli

- `http://localhost:3000/admin` adresinden erişilir.
- Formu kullanarak yeni kartlar ekleyebilir veya mevcut kartları düzenleyebilirsin.
- Görsel alanına `public` klasöründeki SVG/PNG yollarını (/terms/... gibi) veya harici görsel adreslerini girebilirsin.
- Kart silme işlemi onay diyaloğu içerir.
- Admin aksiyonları hem oyun ana sayfasını hem de paneli otomatik olarak yeniden valide eder.

## Veri Yapısı

Kart verileri `data/terms.json` dosyasında tutulur. Her kayıt şu alanları içerir:

```json
{
  "id": "hicret",
  "title": "Hicret",
  "description": "Müslümanların Medineye göçü yeni bir başlangıçtı.",
  "image": "/terms/hicret.svg"
}
```

Admin paneli üzerinden yapılan değişiklikler bu dosyaya yazılır ve yeni oyun turlarında otomatik olarak kullanılır.

## Tasarım Notları

- Neon renk paleti, cam etkili yüzeyler ve yumuşak gölgeler genç kitleye hitap edecek şekilde seçildi.
- Kart bileşenleri `transform-style: preserve-3d` ve Sass modülleriyle oluşturulan ışık efektleri sayesinde 3D hissi verir.
- Tamamen responsive yapı sayesinde masaüstü, tablet ve mobil tarayıcılarda sorunsuz deneyim sunar.

İyi eğlenceler! 🎮
