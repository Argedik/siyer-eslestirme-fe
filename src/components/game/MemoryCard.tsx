"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import type { Term } from "@/lib/terms";
import styles from "./MemoryCard.module.scss";

export type MemoryCardData = {
  id: string;
  matchId: string;
  term: Term;
  isFlipped: boolean;
  isMatched: boolean;
  tilt?: number;
};

type MemoryCardProps = {
  card: MemoryCardData;
  disabled: boolean;
  onSelect: () => void;
};

function classNames(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export default function MemoryCard({ card, disabled, onSelect }: MemoryCardProps) {
  const { term, isFlipped, isMatched, tilt = 0 } = card;
  const style = { ["--tilt" as const]: `${tilt}deg` } as CSSProperties;

  return (
    <button
      type="button"
      className={classNames(styles.card, isFlipped && styles.flipped, isMatched && styles.matched)}
      onClick={onSelect}
      disabled={disabled || isMatched}
      aria-pressed={isFlipped}
      aria-label={isMatched ? `${term.title} eslesti` : `${term.title} kartini ac`}
      style={style}
    >
      <span className={styles.inner}>
        <span className={classNames(styles.face, styles.front)}>
          <span className={styles.gloss} />
          <span className={styles.question}>?</span>
        </span>
        <span className={classNames(styles.face, styles.back)}>
          <span className={styles.graphicWrap}>
            <span className={styles.imageWrap}>
              <Image src={term.image} alt={term.title} fill sizes="(max-width: 680px) 42vw, 260px" className={styles.termArt} />
            </span>
          </span>
          <span className={styles.termTitle}>{term.title}</span>
        </span>
      </span>
    </button>
  );
}

