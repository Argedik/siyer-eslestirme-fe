'use client';

/**
 * CreateGameButton - Oyun Oluşturma Butonu
 * 
 * DEĞİŞİKLİK:
 * - ESKİ: Senkron createGame() çağrısı
 * - YENİ: Asenkron await createGame() + loading/error state
 * 
 * SENARYO: MADDE 1
 * 1. Admin bu butona tıklar
 * 2. Loading gösterilir
 * 3. Backend'e istek gider
 * 4. Başarılıysa onGameCreated callback çağrılır
 * 5. Hata varsa hata mesajı gösterilir
 * 
 * BACKEND REFERANS:
 * - LobbyController.cs → CreateLobby()
 * - POST /api/lobby/create
 */

import { useState } from 'react';
import { createGame } from '@/application/usecases/CreateGame';
import styles from './index.module.scss';

interface CreateGameButtonProps {
  /** Oyun oluşturulduğunda çağrılır */
  onGameCreated: (code: string, joinUrl: string) => void;
  /** Hata durumunda çağrılır */
  onError?: (error: string) => void;
}

export default function CreateGameButton({ onGameCreated, onError }: CreateGameButtonProps) {
  // State: Loading durumu
  const [loading, setLoading] = useState(false);
  // State: Hata mesajı
  const [error, setError] = useState<string | null>(null);

  /**
   * Butona tıklandığında çalışır
   * 
   * AKIM:
   * 1. Loading = true
   * 2. Backend'e istek gönder
   * 3. Başarılıysa callback çağır
   * 4. Hata varsa error state'e yaz
   * 5. Loading = false
   */
  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      // Backend'e lobi oluşturma isteği
      const { code, joinUrl } = await createGame();
      
      // Başarılı - callback çağır
      onGameCreated(code, joinUrl);
    } catch (err) {
      // Hata - kullanıcıya göster
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Oyun oluşturulamadı. Lütfen tekrar deneyin.';
      
      setError(errorMessage);
      console.error('Oyun oluşturma hatası:', err);
      
      // Hata callback'ini çağır (dialog açmak için)
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        className={styles.button} 
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Oluşturuluyor...' : 'Oyunu Kur'}
      </button>
      
      {/* Hata mesajı */}
      {error && (
        <p style={{ 
          color: '#ff6b6b', 
          marginTop: '0.5rem', 
          fontSize: '0.875rem',
          textAlign: 'center' 
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
