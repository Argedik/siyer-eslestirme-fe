/**
 * Domain: Player Names - Oyuncu isimleri
 * 
 * 16 farklı oyuncu ismi listesi
 */

export const PLAYER_NAMES = [
	'Hatice bint Huveylid (r.a.)',
	'Aişe bint Ebû Bekir (r.a.)',
	'Fatıma bint Muhammed (r.a.)',
	'Sevde bint Zem‘a (r.a.)',
	'Hafsa bint Ömer (r.a.)',
	'Zeyneb bint Huzeyme (r.a.)',
	'Ümmü Seleme bint Ebû Ümeyye (r.a.)',
	'Zeyneb bint Cahş (r.a.)',
	'Cüveyriye bint Hâris (r.a.)',
	'Safiyye bint Huyey (r.a.)',
	'Ümmü Habîbe bint Ebû Süfyan (r.a.)',
	'Esmâ bint Ebû Bekir (r.a.)',
	'Bereke bint Tha‘laba (r.a.)',
	'Nuseybe bint Ka‘b (r.a.)',
	'Nusaybah bint Harith (r.a.)',
	'Rubeyyi‘ bint Muavviz (r.a.)',
] as const;

export type PlayerName = typeof PLAYER_NAMES[number];

/**
 * Rastgele bir oyuncu ismi döndürür
 */
export function getRandomPlayerName(): PlayerName {
	const randomIndex = Math.floor(Math.random() * PLAYER_NAMES.length);
	return PLAYER_NAMES[randomIndex];
}

/**
 * Belirli bir seed değerine göre oyuncu ismi döndürür
 * (Aynı seed her zaman aynı ismi döndürür)
 */
export function getPlayerNameBySeed(seed: number): PlayerName {
	const index = seed % PLAYER_NAMES.length;
	return PLAYER_NAMES[index];
}

