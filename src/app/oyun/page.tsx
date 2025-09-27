import path from "node:path";
import { promises as fs } from "node:fs";
import GameArena from "@/components/game/GameArena";
import { listTerms } from "@/lib/terms";

async function readImageFiles(relativeDir: string): Promise<string[]> {
  try {
    const dirPath = path.join(process.cwd(), "public", relativeDir);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => name.toLowerCase().endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, "tr"));
  } catch (error) {
    console.warn(`Klasör okunamadı: ${relativeDir}`, error);
    return [];
  }
}

export default async function GamePage() {
  const [terms, backgroundFiles, specialFiles] = await Promise.all([
    listTerms(),
    readImageFiles(path.join("resimler", "arkaplan")),
    readImageFiles(path.join("resimler", "kartlar")),
  ]);

  const defaultBackground = '/resimler/arkaplan/siyer%20eşleştirme.png';
  const backgroundImage = backgroundFiles[0]
    ? `/resimler/arkaplan/${backgroundFiles[0]}`
    : defaultBackground;
  const specialImages = specialFiles.map((file) => `/resimler/kartlar/${file}`);

  return (
    <GameArena
      terms={terms}
      backgroundImage={backgroundImage}
      specialImages={specialImages}
    />
  );
}
