'use client';

import { createGame } from '@/application/usecases/CreateGame';
import styles from './index.module.scss';

interface CreateGameButtonProps {
	onGameCreated: (code: string, joinUrl: string) => void;
}

export default function CreateGameButton({ onGameCreated }: CreateGameButtonProps) {
	const handleClick = () => {
		const { code, joinUrl } = createGame();
		onGameCreated(code, joinUrl);
	};

	return (
		<button className={styles.button} onClick={handleClick}>
			Oyunu Kur
		</button>
	);
}

