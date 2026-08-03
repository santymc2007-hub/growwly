import type { Json } from "@/lib/supabase/database.types";

type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "twitter"
  | "youtube"
  | "linkedin";

const PLATFORM_INFO: Record<
  SocialPlatform,
  { label: string; buildUrl: (handle: string) => string }
> = {
  instagram: {
    label: "Instagram",
    buildUrl: (h) => `https://instagram.com/${h.replace(/^@/, "")}`,
  },
  facebook: {
    label: "Facebook",
    buildUrl: (h) => `https://facebook.com/${h}`,
  },
  tiktok: {
    label: "TikTok",
    buildUrl: (h) => `https://tiktok.com/@${h.replace(/^@/, "")}`,
  },
  twitter: {
    label: "X (Twitter)",
    buildUrl: (h) => `https://x.com/${h.replace(/^@/, "")}`,
  },
  youtube: { label: "YouTube", buildUrl: (h) => `https://youtube.com/${h}` },
  linkedin: { label: "LinkedIn", buildUrl: (h) => `https://linkedin.com/${h}` },
};

export type SocialLink = { label: string; url: string };

/**
 * Devuelve el valor guardado tal cual (el handle, no la URL construida),
 * para precargar los inputs del formulario de edición.
 */
export function getRawSocialValue(redesSociales: Json, key: string): string {
  if (
    !redesSociales ||
    typeof redesSociales !== "object" ||
    Array.isArray(redesSociales)
  ) {
    return "";
  }
  const value = (redesSociales as Record<string, Json>)[key];
  return typeof value === "string" ? value : "";
}

/**
 * `redes_sociales` se guarda como jsonb, p. ej.
 * {"instagram": "raizcapilarmadrid", "facebook": "raizcapilarmadrid"}.
 * Esta función lo convierte en enlaces listos para pintar, sin asumir
 * ninguna forma concreta (por si algún día se guardan URLs completas
 * en vez de solo el handle).
 */
export function getSocialLinks(redesSociales: Json): SocialLink[] {
  if (
    !redesSociales ||
    typeof redesSociales !== "object" ||
    Array.isArray(redesSociales)
  ) {
    return [];
  }

  return Object.entries(redesSociales)
    .filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].length > 0,
    )
    .map(([key, value]) => {
      const info = PLATFORM_INFO[key as SocialPlatform];
      const looksLikeUrl = value.startsWith("http");
      return info
        ? { label: info.label, url: looksLikeUrl ? value : info.buildUrl(value) }
        : { label: key, url: value };
    });
}
