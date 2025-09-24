"use server";

import { revalidatePath } from "next/cache";
import { deleteTerm, saveTerm, type Term } from "@/lib/terms";

export type ActionResponse = {
  ok: boolean;
  message: string;
  term?: Term;
  id?: string;
};

function requireField(value: string | null, label: string): string {
  if (!value || !value.trim()) {
    throw new Error(`${label} zorunludur`);
  }
  return value.trim();
}

export async function upsertTermAction(formData: FormData): Promise<ActionResponse> {
  try {
    const id = formData.get("id")?.toString().trim() || undefined;
    const title = requireField(formData.get("title")?.toString() ?? null, "Başlık");
    const description = requireField(formData.get("description")?.toString() ?? null, "Açıklama");
    const image = requireField(formData.get("image")?.toString() ?? null, "Görsel yolu");

    const term = await saveTerm({ id, title, description, image });
    revalidatePath("/");
    revalidatePath("/admin");

    return {
      ok: true,
      message: id ? "Kart güncellendi" : "Yeni kart eklendi",
      term,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu",
    };
  }
}

export async function removeTermAction(formData: FormData): Promise<ActionResponse> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) {
      throw new Error("Kart bulunamadı");
    }

    await deleteTerm(id);
    revalidatePath("/");
    revalidatePath("/admin");

    return {
      ok: true,
      message: "Kart silindi",
      id,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu",
    };
  }
}
