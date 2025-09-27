"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./LandingPage.module.scss";

const mascots = ["/terms/bedir.svg", "/terms/hudeybiye.svg", "/terms/hicret.svg"];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.glowBackdrop} aria-hidden>
        <span className={`${styles.orb} ${styles.orbOne}`} />
        <span className={`${styles.orb} ${styles.orbTwo}`} />
        <span className={`${styles.orb} ${styles.orbThree}`} />
      </div>

      <header className={styles.hero}>
        <span className={styles.moodTag}>Yeni etkinlik</span>
        <h1 className={styles.heroTitle}>
          3D <span className={styles.heroHighlight}>Siyer Eşleştirme</span> arenasına hoş geldin!
        </h1>
        <p className={styles.heroCopy}>
          Lise kulübünle birlikte oynayabileceğin bu kart oyunu, sevimli animasyonları ve takım skor takibiyle
          turnuvaları çok daha eğlenceli hale getiriyor. Tüm oyuncular tarayıcılarından bağlanıp takma adlarını seçsin,
          kartları çevirsin ve tarihi kavramları keşfetsin.
        </p>
        <div className={styles.actionRow}>
          <Link className={styles.primaryButton} href="/oyun">
            Oyunu Kur
          </Link>
          <Link className={styles.secondaryButton} href="/admin">
            Admin Paneline Git
          </Link>
        </div>
      </header>

      <section className={styles.preview}>
        <div className={styles.previewCards}>
          {mascots.map((src, index) => (
            <figure key={src} className={styles.previewCard} style={{ rotate: `${(index - 1) * 10}deg` }}>
              <Image src={src} alt="Ön izleme kartı" width={120} height={120} />
              <figcaption className={styles.previewCaption}>Sürükleyici eşleşmeler</figcaption>
            </figure>
          ))}
        </div>
        <p className={styles.previewText}>
          Oyun ekranı tam ekran arka planla açılır, oyuncu yüzleri popup ile duyurulur ve finalde dereceler yıldızlarla
          kutlanır. 10 kartlık özel modda <code>/resimler/kartlar</code> klasöründeki PNG görselleri otomatik olarak
          kullanılır.
        </p>
      </section>
    </div>
  );
}
