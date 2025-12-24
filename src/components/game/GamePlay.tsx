"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Term } from "@/lib/terms";
import MemoryCard, { type MemoryCardData } from "@/components/game/MemoryCard";
import PlayerList from "@/components/game/PlayerList";
import { getLobbyByCode } from "@/services/lobbyApi";
import { 
  colorPalettes, 
  type ColorTheme,
  type GameStatus,
  type Player,
  type TurnPopup,
  createDeck
} from "./gameUtils";
import styles from "./GamePlay.module.scss";

type GamePlayProps = {
  terms: Term[];
};

type TurnPopupOptions = {
  lockBoard?: boolean;
  unlockAfter?: boolean;
  onComplete?: () => void;
};

export default function GamePlay({ terms }: GamePlayProps) {
  
  // localStorage'dan oyun ayarlarını al
  const [pairCount, setPairCount] = useState(() => {
    if (typeof window === 'undefined') return 6;
    const saved = localStorage.getItem('game_pairCount');
    return saved ? parseInt(saved, 10) : 6;
  });
  
  const [duplicateLevel, setDuplicateLevel] = useState<2 | 3 | 4>(() => {
    if (typeof window === 'undefined') return 2;
    const saved = localStorage.getItem('game_duplicateLevel');
    return saved ? parseInt(saved, 10) as 2 | 3 | 4 : 2;
  });
  
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    if (typeof window === 'undefined') return "su-yesili";
    const saved = localStorage.getItem('game_colorTheme');
    return (saved as ColorTheme) || "su-yesili";
  });
  
  const currentPalette = useMemo(() => colorPalettes[colorTheme], [colorTheme]);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [cards, setCards] = useState<MemoryCardData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [matches, setMatches] = useState(0);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [turnPopup, setTurnPopup] = useState<TurnPopup | null>(null);

  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playersRef = useRef<Player[]>(players);
  const pendingMismatchRef = useRef<{ ids: string[]; nextIndex: number } | null>(null);

  // Oyunu başlat
  useEffect(() => {
    const initializeGame = async () => {
      // Backend'den oyuncuları al
      let gamePlayers: Player[] = [];
      try {
        const lobbyCode = typeof window !== 'undefined' 
          ? localStorage.getItem('current_game_code') 
          : null;
        
        if (lobbyCode) {
          const lobby = await getLobbyByCode(lobbyCode);
          const palette = [currentPalette.primary, currentPalette.secondary, currentPalette.tertiary, currentPalette.quaternary];
          gamePlayers = lobby.players.map((p, index) => ({
            id: `player-${p.id}`,
            name: p.username,
            score: p.score || 0,
            color: palette[index % palette.length],
          }));
          setPlayers(gamePlayers);
        }
      } catch (err) {
        console.error('Oyuncular yüklenemedi:', err);
      }

      const deck = createDeck(terms, pairCount, duplicateLevel);
      setCards(deck);
      setStatus("playing");

      if (gamePlayers[0]) {
        displayTurnPopup(gamePlayers[0], { lockBoard: false, unlockAfter: false });
      }
    };

    initializeGame();
  }, [terms, pairCount, duplicateLevel, currentPalette]);


  // Web için sabit kart boyutları: 100px x 150px
  // Responsive hesaplamalar kaldırıldı - CSS'te grid ile yönetiliyor

  const resolvePendingMismatch = useCallback(() => {
    const pending = pendingMismatchRef.current;
    if (!pending) {
      return;
    }
    setCards((prev) =>
      prev.map((card) =>
        pending.ids.includes(card.id) ? { ...card, isFlipped: false } : card
      )
    );
    setSelectedIds([]);
    setActiveIndex(pending.nextIndex);
    setLocked(false);
    pendingMismatchRef.current = null;
  }, []);

  const clearTurnPopup = useCallback(() => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
    setTurnPopup(null);
  }, []);

  const displayTurnPopup = useCallback(
    (player: Player | null | undefined, options?: TurnPopupOptions) => {
      if (!player) {
        return;
      }
      const { lockBoard = true, unlockAfter = true, onComplete } = options ?? {};
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
      if (lockBoard) {
        setLocked(true);
      }
      setTurnPopup({ name: player.name, color: player.color });
      popupTimerRef.current = setTimeout(() => {
        onComplete?.();
        setTurnPopup(null);
        if (lockBoard && unlockAfter) {
          setLocked(false);
        }
        popupTimerRef.current = null;
      }, 3000);
    },
    []
  );

  useEffect(() => {
    return () => {
      clearTurnPopup();
    };
  }, [clearTurnPopup]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    if (selectedIds.length !== 2 || status !== "playing") {
      return;
    }
    setLocked(true);
    const [firstId, secondId] = selectedIds;
    const firstCard = cards.find((card) => card.id === firstId);
    const secondCard = cards.find((card) => card.id === secondId);
    if (!firstCard || !secondCard) {
      setSelectedIds([]);
      setLocked(false);
      return;
    }
    if (firstCard.isMatched && secondCard.isMatched) {
      setSelectedIds([]);
      setLocked(false);
      return;
    }

    const isMatch = firstCard.matchId === secondCard.matchId;
    const playersSnapshot = playersRef.current;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (isMatch) {
      setCards((prev) =>
        prev.map((card) =>
          selectedIds.includes(card.id)
            ? { ...card, isMatched: true }
            : card
        )
      );
      setPlayers((prev) =>
        prev.map((player, index) =>
          index === activeIndex
            ? { ...player, score: player.score + 1 }
            : player
        )
      );
      setMatches((prev) => prev + 1);
      pendingMismatchRef.current = null;
      timeout = setTimeout(() => {
        setSelectedIds([]);
        setLocked(false);
      }, 750);
    } else {
      const mismatchIds = [...selectedIds];
      const totalPlayers = playersSnapshot.length;
      if (totalPlayers === 0) {
        pendingMismatchRef.current = { ids: mismatchIds, nextIndex: activeIndex };
        timeout = setTimeout(() => {
          resolvePendingMismatch();
        }, 3000);
      } else {
        const nextIndex = (activeIndex + 1) % totalPlayers;
        const nextPlayer = playersSnapshot[nextIndex];
        pendingMismatchRef.current = { ids: mismatchIds, nextIndex };
        displayTurnPopup(nextPlayer, {
          onComplete: resolvePendingMismatch,
        });
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [selectedIds, cards, activeIndex, players.length, status, displayTurnPopup, resolvePendingMismatch]);

  useEffect(() => {
    if (status === "playing" && pairCount > 0 && matches >= pairCount) {
      clearTurnPopup();
      setStatus("complete");
      setLocked(true);
      // Oyun tamamlandı - sadece kartları kilitle, overlay yok
    }
  }, [matches, pairCount, status, clearTurnPopup]);


  const handleCardClick = (cardId: string) => {
    if (locked || status !== "playing") {
      return;
    }
    if (pendingMismatchRef.current) {
      resolvePendingMismatch();
    }
    if (turnPopup) {
      clearTurnPopup();
    }
    setCards((prev) => {
      const target = prev.find((card) => card.id === cardId);
      if (!target || target.isMatched || target.isFlipped) {
        return prev;
      }
      return prev.map((card) =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      );
    });
    setSelectedIds((prev) =>
      prev.includes(cardId) ? prev : [...prev, cardId].slice(-2)
    );
  };


  const colorThemeStyle = useMemo(() => ({
    "--color-primary": currentPalette.primary,
    "--color-secondary": currentPalette.secondary,
    "--color-tertiary": currentPalette.tertiary,
    "--color-quaternary": currentPalette.quaternary,
  } as CSSProperties), [currentPalette]);

  return (
    <div className={styles.gamePage} style={colorThemeStyle}>
      <div className={styles.gameWrapper}>
        <section className={styles.gameShell}>
          <div className={styles.gameLayoutWeb}>
            {/* Sol: Oyun tahtası */}
            <div className={styles.gameBoardColumn}>
              {/* Üst popup alanı (her zaman sabit boş) */}
              <div className={styles.turnStripFixed}>
                {turnPopup && status === "playing" && (
                  <div className={styles.turnPopup}>
                    <div
                      className={styles.turnPopupCard}
                      style={{ borderColor: turnPopup.color, boxShadow: `0 18px 48px ${turnPopup.color}44` }}
                    >
                      <span className={styles.turnLabel}>Sıradaki oyuncu</span>
                      <strong>{turnPopup.name}</strong>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Oyun tahtası */}
              <div className={styles.gameBoardWeb}>
                <div className={styles.chessBoard}>
                  <div className={styles.boardGrid}>
                    {cards.map((card) => (
                      <div key={card.id} className={styles.boardCell}>
                        <MemoryCard
                          card={card}
                          disabled={locked || status !== "playing"}
                          onSelect={() => handleCardClick(card.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ: Oyuncular listesi */}
            <aside className={styles.playerListSidebarWeb}>
              <PlayerList />
            </aside>
          </div>

        </section>
      </div>
    </div>
  );
}

