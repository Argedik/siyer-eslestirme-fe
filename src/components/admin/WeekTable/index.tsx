'use client';

import styles from './index.module.scss';

function classNames(...values: Array<string | false | undefined>): string {
	return values.filter(Boolean).join(' ');
}

interface WeekTableProps {
	/** Backend'den gelen en büyük hafta numarası (null ise hiçbir satır vurgulanmaz) */
	maxWeekNumber?: number | null;
	/** Hafta seçildiğinde çağrılacak callback */
	onWeekSelect?: (weekNumber: number) => void;
}

/**
 * WeekTable Component
 * 
 * SOLID PRENSİPLERİ:
 * - S (Single Responsibility): Sadece hafta tablosunu gösterir ve yönetir
 * - O (Open/Closed): Props ile genişletilebilir, değiştirilemez
 * 
 * 6x6 grid (1-36 arası rakamlar) gösterir.
 * En büyük hafta numarasının bulunduğu satırı şerit efekti ile vurgular.
 */
export default function WeekTable({ maxWeekNumber = null, onWeekSelect }: WeekTableProps) {
	const handleWeekClick = (weekNumber: number) => {
		onWeekSelect?.(weekNumber);
	};

	return (
		<div className={styles.weekTableContainer}>
			<div className={styles.weekTable}>
				{Array.from({ length: 36 }, (_, i) => {
					const number = i + 1;
					const row = Math.floor(i / 6);
					const isHighlighted = maxWeekNumber !== null && Math.floor((maxWeekNumber - 1) / 6) === row;
					
					return (
						<button
							key={number}
							type="button"
							className={classNames(
								styles.weekCell,
								isHighlighted && styles.weekCellHighlighted
							)}
							onClick={() => handleWeekClick(number)}
							aria-label={`Hafta ${number}`}
						>
							{number}
						</button>
					);
				})}
			</div>
		</div>
	);
}

