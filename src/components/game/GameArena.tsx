"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Term } from "@/lib/terms";
import MemoryCard, { type MemoryCardData } from "@/components/game/MemoryCard";
import styles from "../home/LandingPage.module.scss";

const pastelPalette = ["#776bff", "#ff82b0", "#5ed1ff", "#ffe36e"];
const aliasAdjectives = [
  "Galaktik",
  "Parildayan",
  "Cesur",
  "Neon",
  "Isiltili",
  "Mistik",
  "Turbo",
  "Sirli",
  "Ucan",
  "Ritmik",
];
const aliasNouns = [
  "Meteor",
  "Gezgin",
  "Samur",
  "Panter",
  "Komutan",
  "Yildirim",
  "Sihirbaz",
  "Kartal",
  "Ruzgar",
  "Astronot",
];

const SPECIAL_PAIR_TARGET = 5;

type Step = "setup" | "play";
type GameStatus = "idle" | "playing" | "complete";

type Player = {
  id: string;
  name: string;
  score: number;
  color: string;
};

type RankedPlayer = Player & { originalIndex: number };

type TurnPopup = {
  name: string;
  color: string;
};

type TurnPopupOptions = {
  lockBoard?: boolean;
  unlockAfter?: boolean;
  onComplete?: () => void;
};

type GameArenaProps = {
  terms: Term[];
  backgroundImage?: string;
  specialImages?: string[];
};

function classNames(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function generateAlias(seed?: number): string {
  const value = seed ?? Math.floor(Math.random() * 1000);
  const adjective = aliasAdjectives[value % aliasAdjectives.length];
  const noun = aliasNouns[(Math.floor(value / aliasAdjectives.length) + value) % aliasNouns.length];
  return `${adjective} ${noun}`;
}

function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createDeck(pool: Term[], pairCount: number): MemoryCardData[] {
  const source = shuffle(pool).slice(0, pairCount);
  const doubled = source.flatMap((term) => {
    const base = {
      matchId: term.id,
      term,
      isFlipped: false,
      isMatched: false,
    } as const;
    return [
      {
        ...base,
        id: `${term.id}-a-${Math.random().toString(16).slice(2, 8)}`,
        tilt: (Math.random() - 0.5) * 6,
      },
      {
        ...base,
        id: `${term.id}-b-${Math.random().toString(16).slice(2, 8)}`,
        tilt: (Math.random() - 0.5) * 6,
      },
    ];
  });
  return shuffle(doubled);
}

export default function GameArena({ terms, backgroundImage, specialImages = [] }: GameArenaProps) {
  const maxPairs = useMemo(() => Math.max(2, Math.min(terms.length, 12)), [terms.length]);
  const [step, setStep] = useState<Step>("setup");
  const [playerCount, setPlayerCount] = useState(2);
  const [pairCount, setPairCount] = useState(Math.min(maxPairs, SPECIAL_PAIR_TARGET));
  const [players, setPlayers] = useState<Player[]>(() =>
    Array.from({ length: 2 }, (_, index) => ({
      id: `player-${index}`,
      name: generateAlias(index * 13 + 5),
      score: 0,
      color: pastelPalette[index % pastelPalette.length],
    }))
  );
  const [cards, setCards] = useState<MemoryCardData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [matches, setMatches] = useState(0);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [showValidation, setShowValidation] = useState(false);
  const [turnPopup, setTurnPopup] = useState<TurnPopup | null>(null);

  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playersRef = useRef<Player[]>(players);
  const pendingMismatchRef = useRef<{ ids: string[]; nextIndex: number } | null>(null);

  const specialDeck = useMemo<Term[]>(
    () =>
      specialImages
        .slice(0, SPECIAL_PAIR_TARGET)
        .map((src, index) => ({
          id: `special-${index}`,
          title: `Özel Kart ${index + 1}`,
          description: "Oyuncular için özel kart görseli.",
          image: src,
        })),
    [specialImages]
  );

  const shouldUseSpecialDeck = pairCount === SPECIAL_PAIR_TARGET && specialDeck.length >= SPECIAL_PAIR_TARGET;

  const ranking = useMemo<RankedPlayer[]>(() => {
    return players
      .map((player, index) => ({ ...player, originalIndex: index }))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.originalIndex - b.originalIndex;
      });
  }, [players]);

  const totalCards = cards.length > 0 ? cards.length : pairCount * 2;
  const boardColumns = useMemo(() => {
    if (totalCards <= 4) return 2;
    if (totalCards <= 6) return 3;
    if (totalCards <= 12) return 4;
    return 5;
  }, [totalCards]);
  const boardStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${boardColumns}, minmax(0, 1fr))`,
  }), [boardColumns]);

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
  }, [setCards, setSelectedIds, setLocked]);

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
    setPlayers((prev) => {
      const next = prev.slice(0, playerCount).map((player, index) => ({
        ...player,
        id: `player-${index}`,
        color: pastelPalette[index % pastelPalette.length],
      }));
      if (next.length < playerCount) {
        const extras = Array.from({ length: playerCount - next.length }, (_, offset) => {
          const index = next.length + offset;
          return {
            id: `player-${index}`,
            name: generateAlias(index * 19 + Date.now()),
            score: 0,
            color: pastelPalette[index % pastelPalette.length],
          } satisfies Player;
        });
        return [...next, ...extras];
      }
      return next;
    });
  }, [playerCount]);

  useEffect(() => {
    if (pairCount > maxPairs) {
      setPairCount(maxPairs);
    }
  }, [maxPairs, pairCount]);

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
    }
  }, [matches, pairCount, status, clearTurnPopup]);

  const canStart = players.every((player) => player.name.trim().length > 0);
  const progress = pairCount > 0 ? Math.min(100, Math.round((matches / pairCount) * 100)) : 0;
  const activePlayer = players[activeIndex];

  const statusLine = (() => {
    if (status === "complete") {
      return "Tebrikler! Tüm kartlar açıldı.";
    }
    if (turnPopup) {
      return `${turnPopup.name} sahneye çıkıyor!`;
    }
    if (status === "playing") {
      return `${activePlayer?.name ?? "Oyuncu"} sırada. İki kart seç!`;
    }
    return "Kartları çevirmek için oyunu başlat.";
  })();

  const handleNameChange = (index: number, value: string) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      return next;
    });
    setShowValidation(false);
  };

  const handleRandomAlias = (index: number) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: generateAlias() };
      return next;
    });
  };

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

  const clearBoardState = () => {
    clearTurnPopup();
    pendingMismatchRef.current = null;
    setCards([]);
    setMatches(0);
    setSelectedIds([]);
    setLocked(false);
    setActiveIndex(0);
  };

  const resetToSetup = () => {
    clearBoardState();
    setStatus("idle");
    setStep("setup");
  };

  const startGame = () => {
    if (!canStart) {
      setShowValidation(true);
      return;
    }
    const preparedPlayers = players.map((player, index) => ({
      ...player,
      id: `player-${index}`,
      score: 0,
    }));

    const pool = shouldUseSpecialDeck ? specialDeck : terms;
    const deck = createDeck(pool, pairCount);

    clearBoardState();
    setShowValidation(false);
    setPlayers(preparedPlayers);
    setCards(deck);
    setStatus("playing");
    setStep("play");

    if (preparedPlayers[0]) {
      displayTurnPopup(preparedPlayers[0], { lockBoard: false, unlockAfter: false });
    }
  };

  const rankingClass = (position: number) => {
    if (position === 0) return styles.rankFirst;
    if (position === 1) return styles.rankSecond;
    if (position === 2) return styles.rankThird;
    return styles.rankOther;
  };

  return (
    <div
      className={styles.gamePage}
      style={backgroundImage ? ({ ["--arena-bg-desktop" as const]: `url(${backgroundImage})` } as CSSProperties) : undefined}
    >
      <div className={styles.gamePageMask} />
      <div className={styles.gameWrapper}>
        {step === "setup" && (
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
            <Link className={styles.secondaryButton} href="/admin">
              Admin paneli
            </Link>
          </div>
        </header>
      )}

        {step === "setup" ? (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Oyun ayarları</h2>
            <div className={styles.panelGrid}>
              <div>
                <span className={styles.label}>Oyuncu sayısı</span>
                <div className={styles.pillRow}>
                  {[1, 2, 3, 4].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={classNames(styles.pill, value === playerCount && styles.pillActive)}
                      onClick={() => setPlayerCount(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={styles.label}>Kart çifti ({pairCount})</span>
                <div className={styles.sliderRow}>
                  <input
                    className={styles.slider}
                    type="range"
                    min={2}
                    max={maxPairs}
                    value={pairCount}
                    onChange={(event) => setPairCount(Number(event.target.value))}
                  />
                  <div className={styles.sliderInfo}>
                    <span>{pairCount * 2} kart</span>
                    <span>Maks. {maxPairs * 2} kart</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.playerList}>
              {players.map((player, index) => (
                <div key={player.id} className={styles.playerRow}>
                  <span className={styles.playerBadge} style={{ backgroundColor: player.color }}>
                    {index + 1}
                  </span>
                  <input
                    className={styles.playerInput}
                    value={player.name}
                    placeholder="Takma ad"
                    onChange={(event) => handleNameChange(index, event.target.value)}
                  />
                  <button type="button" className={styles.aliasButton} onClick={() => handleRandomAlias(index)}>
                    Rastgele
                  </button>
                </div>
              ))}
            </div>
            {showValidation && (
              <p className={styles.validation}>Başlamak için tüm oyuncular bir takma ad seçmeli.</p>
            )}
            {shouldUseSpecialDeck && (
              <p className={styles.specialNote}>
                10 kart seçildiğinde oyun <strong>/resimler/kartlar</strong> klasöründeki özel görselleri kullanır.
              </p>
            )}
            <div className={styles.panelControls}>
              <button type="button" className={styles.ghostButton} onClick={() => setPairCount(Math.min(maxPairs, SPECIAL_PAIR_TARGET))}>
                Kartları sıfırla
              </button>
              <button type="button" className={styles.primaryButton} onClick={startGame}>
                Oyunu Başlat
              </button>
            </div>
            <p className={styles.tip}>Bağlantıyı paylaş; herkes tarayıcısından bağlanarak takma adını girebilir.</p>
          </section>
        ) : (
          
<section className={styles.gameShell}>
          <div className={styles.playHeader}>
            <button type="button" className={styles.backButton} onClick={resetToSetup}>
              ←
            </button>
          </div>

          <div className={styles.scorePanel}>
            <div className={styles.scoreHeader}>
              <h3>Skor sıralaması</h3>
            </div>
            <ol className={styles.scoreList}>
              {ranking.map((player, position) => (
                <li
                  key={player.id}
                  className={classNames(
                    styles.scoreItem,
                    rankingClass(position),
                    player.originalIndex === activeIndex && styles.scoreActive,
                    turnPopup?.name === player.name && styles.scoreIncoming
                  )}
                >
                  <span className={styles.rankIcon} aria-hidden>
                    {position < 3 ? "★" : ""}
                  </span>
                  <div className={styles.scoreInfo}>
                    <span className={styles.playerName}>{player.name}</span>
                    <span className={styles.playerScore}>{player.score} eşleşme</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.gameArea}>
            <div className={styles.boardContainer}>
              <div className={styles.board} style={boardStyle}>
              {cards.map((card) => (
                <MemoryCard
                  key={card.id}
                  card={card}
                  disabled={locked || status !== "playing"}
                  onSelect={() => handleCardClick(card.id)}
                />
              ))}
            </div>
            </div>
          </div>

          <p className={styles.statusLine}>{statusLine}</p>

          <div className={styles.gameControls}>
            <button type="button" className={styles.ghostButton} onClick={resetToSetup}>
              Ayarları değiştir
            </button>
            <button type="button" className={styles.primaryButton} onClick={startGame}>
              Tekrar oynat
            </button>
          </div>

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

          {status === "complete" && (
            <div className={styles.overlay}>
              <div className={styles.overlayCard}>
                <h3>🎉 Tüm kartlar açıldı!</h3>
                <p>İşte final sıralaması:</p>
                <ol className={classNames(styles.finalRanking, styles.scoreList)}>
                  {ranking.map((player, position) => (
                    <li
                      key={`final-${player.id}`}
                      className={classNames(styles.finalRankItem, rankingClass(position))}
                    >
                      <span className={styles.rankIcon} aria-hidden>
                        {position < 3 ? "★" : ""}
                      </span>
                      <span className={styles.finalRankName}>{player.name}</span>
                      <span className={styles.finalRankScore}>{player.score} eşleşme</span>
                    </li>
                  ))}
                </ol>
                <button type="button" className={styles.primaryButton} onClick={startGame}>
                  Yeni tur başlat
                </button>
              </div>
            </div>
          )}
        </section>

        )}
      </div>
    </div>
  );
}
