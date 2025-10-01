'use client';

import {
	useMemo,
	useState,
	useTransition,
	useRef,
	useCallback,
	type ChangeEvent,
	type FormEvent,
	type DragEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Term } from '@/lib/terms';
import { removeTermAction, upsertTermAction } from './actions';
import styles from './AdminDashboard.module.scss';

type AdminDashboardProps = {
	terms: Term[];
};

type FormState = {
	id: string;
	title: string;
	description: string;
	image: string;
};

type Feedback = {
	type: 'success' | 'error';
	message: string;
} | null;

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const EMPTY_FORM: FormState = {
	id: '',
	title: '',
	description: '',
	image: '',
};

function classNames(...values: Array<string | false | undefined>): string {
	return values.filter(Boolean).join(' ');
}

export default function AdminDashboard({ terms }: AdminDashboardProps) {
	const [items, setItems] = useState<Term[]>(terms);
	const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
	const [feedback, setFeedback] = useState<Feedback>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [isPending, startTransition] = useTransition();
	const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const filtered = useMemo(() => {
		if (!searchTerm.trim()) {
			return [...items].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
		}
		const needle = searchTerm.toLowerCase();
		return items
			.filter(
				(term) =>
					term.title.toLowerCase().includes(needle) ||
					term.description.toLowerCase().includes(needle)
			)
			.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
	}, [items, searchTerm]);

	const isEditing = Boolean(formState.id);

	const handleFieldChange =
		(field: keyof FormState) =>
		(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setFormState((prev) => ({ ...prev, [field]: event.target.value }));
		};

	const handleEdit = (term: Term) => {
		setFormState({
			id: term.id,
			title: term.title,
			description: term.description,
			image: term.image,
		});
		setFeedback(null);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleClear = () => {
		setFormState(EMPTY_FORM);
		setFeedback(null);
		setUploadStatus('idle');
	};

	const generateFileName = (originalName: string): string => {
		const timestamp = Date.now();
		const randomSuffix = Math.random().toString(36).substring(2, 8);
		const extension = originalName.split('.').pop()?.toLowerCase() || 'png';
		return `siyer${timestamp}_${randomSuffix}.${extension}`;
	};

	const handleFileUpload = async (file: File) => {
		if (!file.type.startsWith('image/')) {
			setFeedback({
				type: 'error',
				message: 'Lütfen sadece resim dosyası seçin.',
			});
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			// 5MB limit
			setFeedback({
				type: 'error',
				message: "Dosya boyutu 5MB'dan küçük olmalı.",
			});
			return;
		}

		setUploadStatus('uploading');
		setFeedback(null);

		try {
			const formData = new FormData();
			const fileName = generateFileName(file.name);
			formData.append('file', file);
			formData.append('fileName', fileName);

			const response = await fetch('/api/upload-image', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Dosya yüklenirken hata oluştu');
			}

			const result = await response.json();
			const imagePath = `/resimler/kartlar/${fileName}`;

			setFormState((prev) => ({ ...prev, image: imagePath }));
			setUploadStatus('success');
			setFeedback({ type: 'success', message: 'Resim başarıyla yüklendi!' });
		} catch (error) {
			setUploadStatus('error');
			setFeedback({
				type: 'error',
				message:
					error instanceof Error
						? error.message
						: 'Resim yüklenirken hata oluştu',
			});
		}
	};

	const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);

		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			handleFileUpload(files[0]);
		}
	}, []);

	const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileUpload(files[0]);
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startTransition(() => {
			upsertTermAction(formData).then((result) => {
				if (result.ok && result.term) {
					setItems((prev) => {
						const exists = prev.some((item) => item.id === result.term!.id);
						if (exists) {
							return prev.map((item) =>
								item.id === result.term!.id ? result.term! : item
							);
						}
						return [...prev, result.term!];
					});
					setFeedback({ type: 'success', message: result.message });
					setFormState(EMPTY_FORM);
				} else if (!result.ok) {
					setFeedback({ type: 'error', message: result.message });
				}
			});
		});
	};

	const handleDelete = (id: string, title: string) => {
		const confirmation = window.confirm(
			`"${title}" kartını silmek istediğine emin misin?`
		);
		if (!confirmation) {
			return;
		}
		const formData = new FormData();
		formData.append('id', id);
		startTransition(() => {
			removeTermAction(formData).then((result) => {
				if (result.ok && result.id) {
					setItems((prev) => prev.filter((item) => item.id !== result.id));
					setFeedback({ type: 'success', message: result.message });
					if (formState.id === id) {
						setFormState(EMPTY_FORM);
					}
				} else if (!result.ok) {
					setFeedback({ type: 'error', message: result.message });
				}
			});
		});
	};

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<div>
					<h1>Admin Paneli</h1>
					<p>
						Siyer kartlarını güncelle, yenilerini ekle ve oyunda hangi
						görsellerin çıkacağını düzenle.
					</p>
				</div>
				<Link className={styles.backLink} href="/">
					← Oyuna dön
				</Link>
			</header>

			<section className={styles.formCard}>
				<div className={styles.formHeader}>
					<h2>{isEditing ? 'Kartı güncelle' : 'Yeni kart ekle'}</h2>
					<span className={styles.badge}>{items.length} kart</span>
				</div>
				{feedback && (
					<p
						className={classNames(
							styles.feedback,
							feedback.type === 'success'
								? styles.feedbackSuccess
								: styles.feedbackError
						)}
					>
						{feedback.message}
					</p>
				)}
				<form className={styles.form} onSubmit={handleSubmit}>
					<input type="hidden" name="id" value={formState.id} />
					<div className={styles.formGrid}>
						<div className={styles.field}>
							<label htmlFor="title">Başlık</label>
							<input
								id="title"
								name="title"
								value={formState.title}
								onChange={handleFieldChange('title')}
								placeholder="Örneğin: Bedir Zaferi"
								required
							/>
						</div>
						<div className={styles.field}>
							<label htmlFor="image">Görsel yolu</label>
							<input
								id="image"
								name="image"
								value={formState.image}
								onChange={handleFieldChange('image')}
								placeholder="Örn: /resimler/kartlar/siyer001.png"
								required
							/>
						</div>
					</div>
					<div className={classNames(styles.field, styles.fullWidth)}>
						<label>Resim Yükle</label>
						<div
							className={classNames(
								styles.uploadArea,
								isDragOver && styles.uploadAreaDragOver,
								uploadStatus === 'uploading' && styles.uploadAreaUploading
							)}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={handleUploadClick}
						>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileInputChange}
								className={styles.hiddenFileInput}
							/>
							{uploadStatus === 'uploading' ? (
								<div className={styles.uploadContent}>
									<div className={styles.uploadSpinner}></div>
									<p>Resim yükleniyor...</p>
								</div>
							) : (
								<div className={styles.uploadContent}>
									<div className={styles.uploadIcon}>📁</div>
									<p>
										{isDragOver
											? 'Resmi buraya bırak'
											: 'Resmi sürükleyip bırak veya tıklayarak seç'}
									</p>
									<small>PNG, JPG, GIF (Max 5MB)</small>
								</div>
							)}
						</div>
					</div>
					<div className={classNames(styles.field, styles.fullWidth)}>
						<label htmlFor="description">Açıklama</label>
						<textarea
							id="description"
							name="description"
							value={formState.description}
							onChange={handleFieldChange('description')}
							rows={3}
							placeholder="Kart açıldığında bilgi olarak gösterilecek kısa açıklama"
							required
						/>
					</div>
					<div className={styles.previewRow}>
						<div className={styles.previewCard}>
							{formState.image ? (
								<Image
									className={styles.previewImage}
									src={formState.image}
									alt="Önizleme"
									width={120}
									height={120}
								/>
							) : (
								<span className={styles.previewPlaceholder}>
									Kart görseli burada görünecek
								</span>
							)}
							<strong>{formState.title || 'Kart başlığı'}</strong>
							<p>
								{formState.description ||
									'Açıklama eklediğinde burada önizlenir.'}
							</p>
						</div>
						<div className={styles.formButtons}>
							<button
								type="button"
								className={styles.ghostButton}
								onClick={handleClear}
								disabled={isPending}
							>
								Formu temizle
							</button>
							<button
								type="submit"
								className={styles.primaryButton}
								disabled={isPending}
							>
								{isEditing ? 'Kartı güncelle' : 'Kartı kaydet'}
							</button>
						</div>
					</div>
				</form>
			</section>

			<section className={styles.listSection}>
				<div className={styles.listHeader}>
					<h3>Mevcut kartlar</h3>
					<input
						className={styles.searchInput}
						type="search"
						placeholder="Kart ara..."
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
					/>
				</div>
				{filtered.length === 0 ? (
					<p className={styles.emptyState}>
						Henüz kart yok. Yeni kart ekleyerek başlayabilirsin.
					</p>
				) : (
					<div className={styles.grid}>
						{filtered.map((term) => (
							<article key={term.id} className={styles.card}>
								<div className={styles.cardImage}>
									<Image
										className={styles.cardImg}
										src={term.image}
										alt={term.title}
										fill
										sizes="(max-width: 800px) 45vw, 220px"
									/>
								</div>
								<div className={styles.cardBody}>
									<h4>{term.title}</h4>
									<p>{term.description}</p>
								</div>
								<div className={styles.cardActions}>
									<button
										type="button"
										className={styles.linkButton}
										onClick={() => handleEdit(term)}
										disabled={isPending}
									>
										Düzenle
									</button>
									<button
										type="button"
										className={styles.dangerButton}
										onClick={() => handleDelete(term.id, term.title)}
										disabled={isPending}
									>
										Sil
									</button>
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
