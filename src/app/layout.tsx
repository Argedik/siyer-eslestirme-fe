import type { Metadata } from 'next';
import './globals.scss';

const bodyFontClass = 'font-sans-root';
const displayFontClass = 'font-display-root';

export const metadata: Metadata = {
	title: 'Siyer Kart Eşleştirme',
	description:
		'Lise öğrencileri için tasarlanan, sevimli animasyonlarla dolu 3D kart eşleştirme oyunu ve yönetim paneli.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="tr" suppressHydrationWarning>
			<body
				className={`${bodyFontClass} ${displayFontClass}`}
				suppressHydrationWarning
			>
				{children}
			</body>
		</html>
	);
}
