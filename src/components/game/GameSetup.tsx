"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import confetti from 'canvas-confetti';
import type { Term } from "@/lib/terms";
import PlayerList from "@/components/game/PlayerList";
import { getLobbyByCode } from "@/services/lobbyApi";
import type { PlayerResponse } from "@/types/lobby";
import { 
  colorPalettes, 
  type ColorTheme, 
  MIN_PAIR_COUNT, 
  MAX_PAIR_COUNT, 
  DEFAULT_PAIR_TARGET 
} from "./gameUtils";
import styles from "./GameSetup.module.scss";

type GameSetupProps = {
  terms: Term[];
};

function classNames(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export default function GameSetup({ terms }: GameSetupProps) {
  const router = useRouter();
  const maxPairs = useMemo(() => Math.min(terms.length, MAX_PAIR_COUNT), [terms.length]);
  const hasEnoughTerms = maxPairs >= MIN_PAIR_COUNT;
  const [pairCount, setPairCount] = useState(() => (hasEnoughTerms ? Math.min(maxPairs, DEFAULT_PAIR_TARGET) : MIN_PAIR_COUNT));
  const [duplicateLevel, setDuplicateLevel] = useState<2 | 3 | 4>(2);
  const [colorTheme, setColorTheme] = useState<ColorTheme>("su-yesili");
  const [showDuplicateDropdown, setShowDuplicateDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const currentPalette = useMemo(() => colorPalettes[colorTheme], [colorTheme]);

  // Admin kontrolü
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const lobbyCode = typeof window !== 'undefined' 
          ? localStorage.getItem('current_game_code') 
          : null;
        
        if (!lobbyCode) {
          setIsAdmin(false);
          return;
        }

        const lobby = await getLobbyByCode(lobbyCode);
        const adminUser = lobby.players.find((p: PlayerResponse) => p.isAdmin);
        setIsAdmin(!!adminUser);
      } catch (err) {
        console.error('Admin durumu kontrol edilemedi:', err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
    const interval = setInterval(checkAdminStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Dropdown menüleri dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.settingSelect}`)) {
        setShowDuplicateDropdown(false);
      }
      if (!target.closest(`.${styles.colorPickerWrapper}`)) {
        setShowColorPicker(false);
      }
    };

    if (showDuplicateDropdown || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDuplicateDropdown, showColorPicker]);

  useEffect(() => {
    setPairCount((prev) => {
      if (!hasEnoughTerms) {
        return MIN_PAIR_COUNT;
      }
      const nextDefault = Math.min(maxPairs, DEFAULT_PAIR_TARGET);
      if (prev < MIN_PAIR_COUNT) {
        return Math.max(MIN_PAIR_COUNT, nextDefault);
      }
      return Math.min(Math.max(prev, MIN_PAIR_COUNT), maxPairs);
    });
  }, [hasEnoughTerms, maxPairs]);

  const startGame = async () => {
    if (!hasEnoughTerms) {
      return;
    }

    // Konfeti animasyonu (0.7 saniye)
    const duration = 700;
    const end = Date.now() + duration;
    const colors = [currentPalette.primary, currentPalette.secondary, currentPalette.tertiary];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 90,
        spread: 45,
        origin: { x: 0.5, y: 0.5 },
        colors: colors,
        shapes: ['circle'],
        ticks: 100,
        gravity: 0.8,
        decay: 0.92,
        startVelocity: 25,
      });

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 40,
        origin: { x: 0.8, y: 0.6 },
        colors: colors,
        shapes: ['circle'],
        ticks: 100,
        gravity: 0.8,
        decay: 0.92,
        startVelocity: 20,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 40,
        origin: { x: 0.2, y: 0.6 },
        colors: colors,
        shapes: ['circle'],
        ticks: 100,
        gravity: 0.8,
        decay: 0.92,
        startVelocity: 20,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Oyun ayarlarını localStorage'a kaydet
    if (typeof window !== 'undefined') {
      localStorage.setItem('game_pairCount', pairCount.toString());
      localStorage.setItem('game_duplicateLevel', duplicateLevel.toString());
      localStorage.setItem('game_colorTheme', colorTheme);
    }

    // /game-play sayfasına yönlendir
    router.push('/game-play');
  };

  return (
    <div className={styles.gamePage}>
      <div className={styles.gameWrapper}>
        <header className={styles.gameHeader}>
          <div>
            <span className={styles.gameHeaderEyebrow}>Siyer kart arenası</span>
            <h1 className={styles.gameHeaderTitle}>
              Oyunu kur
            </h1>
            <p className={styles.gameHeaderSubtitle}>
              Tam ekran deneyim için kart çiftlerini seç, arkadaşlarına linki gönder ve rekabete başla.
            </p>
          </div>
          <div className={styles.gameHeaderActions}>
            <Link className={styles.secondaryButton} href="/">
              ← Ana sayfa
            </Link>
            {isAdmin && (
              <Link className={styles.secondaryButton} href="/admin" >
                Admin paneli
              </Link>
            )}
          </div>
        </header>

        <div className={styles.setupLayout}>
          {/* Üstte: Oyuncu listesi */}
          <aside className={styles.playerListSidebar}>
            <PlayerList />
          </aside>
          
          {/* Altta: Oyun ayarları */}
          {isAdmin && (
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Oyun ayarları</h2>
              <div className={styles.gameSettingsCompact}>
                {/* Kart Çifti + Renk Teması (Yan yana) */}
                <div className={styles.settingsRow}>
                  <div className={styles.settingItemCompact}>
                    <label className={styles.settingLabel}>Kart çifti</label>
                    {hasEnoughTerms ? (
                      <div className={styles.settingControlCompact}>
                        <input
                          className={styles.slider}
                          type="range"
                          min={MIN_PAIR_COUNT}
                          max={maxPairs}
                          value={pairCount}
                          onChange={(event) => setPairCount(Number(event.target.value))}
                        />
                        <div className={styles.settingDisplay}>
                          <span className={styles.settingNumber}>{pairCount}</span>
                          <span className={styles.settingUnit}>çift ({pairCount * duplicateLevel} kart)</span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.settingError}>
                        Admin panelinden en az {MIN_PAIR_COUNT} kart eklemelisin.
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.settingItemCompact}>
                    <label className={styles.settingLabel}>Renk teması</label>
                    <div className={styles.colorPickerWrapper}>
                      <button
                        type="button"
                        className={styles.colorPickerButton}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        style={{
                          background: `linear-gradient(135deg, ${currentPalette.primary} 0%, ${currentPalette.secondary} 50%, ${currentPalette.tertiary} 100%)`,
                        }}
                      >
                        <span className={styles.colorPickerDot} />
                      </button>
                      {showColorPicker && (
                        <div className={styles.colorPickerMenu}>
                          {(Object.keys(colorPalettes) as ColorTheme[]).map((theme) => {
                            const palette = colorPalettes[theme];
                            return (
                              <button
                                key={theme}
                                type="button"
                                className={classNames(styles.colorPickerOption, colorTheme === theme && styles.colorPickerOptionActive)}
                                onClick={() => {
                                  setColorTheme(theme);
                                  setShowColorPicker(false);
                                }}
                                style={{
                                  background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 50%, ${palette.tertiary} 100%)`,
                                }}
                                title={palette.name}
                              >
                                {colorTheme === theme && <span className={styles.colorPickerCheck}>✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mükerrer Kart Çifti (Altında) */}
                <div className={styles.settingItemCompact}>
                  <label className={styles.settingLabel}>Mükerrer kart çifti</label>
                  <div className={styles.settingSelect}>
                    <button
                      type="button"
                      className={styles.settingSelectButton}
                      onClick={() => setShowDuplicateDropdown(!showDuplicateDropdown)}
                    >
                      {duplicateLevel === 2 && "Kolay (2)"}
                      {duplicateLevel === 3 && "Orta (3)"}
                      {duplicateLevel === 4 && "Zor (4)"}
                      <span className={styles.settingSelectArrow}>▼</span>
                    </button>
                    {showDuplicateDropdown && (
                      <div className={styles.dropdownMenu}>
                        <button
                          type="button"
                          className={classNames(styles.dropdownItem, duplicateLevel === 2 && styles.dropdownItemActive)}
                          onClick={() => {
                            setDuplicateLevel(2);
                            setShowDuplicateDropdown(false);
                          }}
                        >
                          Kolay (2)
                        </button>
                        <button
                          type="button"
                          className={classNames(styles.dropdownItem, duplicateLevel === 3 && styles.dropdownItemActive)}
                          onClick={() => {
                            setDuplicateLevel(3);
                            setShowDuplicateDropdown(false);
                          }}
                        >
                          Orta (3)
                        </button>
                        <button
                          type="button"
                          className={classNames(styles.dropdownItem, duplicateLevel === 4 && styles.dropdownItemActive)}
                          onClick={() => {
                            setDuplicateLevel(4);
                            setShowDuplicateDropdown(false);
                          }}
                        >
                          Zor (4)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.panelControls}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={startGame}
                  disabled={!hasEnoughTerms}
                >
                  Oyunu Başlat
                </button>
              </div>
              {hasEnoughTerms ? (
                <p className={styles.tip}>Bağlantıyı paylaş; herkes tarayıcısından bağlanarak takma adını girebilir.</p>
              ) : (
                <p className={styles.validation}>En az {MIN_PAIR_COUNT} kart ekleyene kadar oyunu başlatamazsın. Admin panelinden kart ekle.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

