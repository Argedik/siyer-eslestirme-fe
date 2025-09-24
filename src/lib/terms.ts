import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type Term = {
  id: string;
  title: string;
  description: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TermInput = {
  id?: string;
  title: string;
  description: string;
  image: string;
};

const TERMS_PATH = path.join(process.cwd(), "data", "terms.json");

async function ensureFile(): Promise<void> {
  try {
    await readFile(TERMS_PATH, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writeFile(TERMS_PATH, "[]", "utf-8");
      return;
    }
    throw error;
  }
}

export async function listTerms(): Promise<Term[]> {
  await ensureFile();
  const raw = await readFile(TERMS_PATH, "utf-8");
  try {
    const terms = JSON.parse(raw) as Term[];
    return terms;
  } catch (error) {
    console.error("Failed to parse terms.json", error);
    return [];
  }
}

function stamp(term: Term): Term {
  const now = new Date().toISOString();
  return {
    ...term,
    createdAt: term.createdAt ?? now,
    updatedAt: now,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)+/g, "")
    .replace(/-{2,}/g, "-");
}

function withId(input: TermInput): Term {
  const baseId = input.id?.trim() || slugify(input.title);
  const id = baseId || crypto.randomUUID();
  return stamp({
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    image: input.image.trim(),
  });
}

export async function saveTerm(input: TermInput): Promise<Term> {
  const term = withId(input);
  const terms = await listTerms();
  const index = terms.findIndex((item) => item.id === term.id);
  if (index >= 0) {
    terms[index] = { ...terms[index], ...term };
  } else {
    terms.push(term);
  }
  await writeFile(TERMS_PATH, JSON.stringify(terms, null, 2), "utf-8");
  return term;
}

export async function deleteTerm(id: string): Promise<void> {
  const terms = await listTerms();
  const filtered = terms.filter((term) => term.id !== id);
  await writeFile(TERMS_PATH, JSON.stringify(filtered, null, 2), "utf-8");
}
