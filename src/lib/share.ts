/**
 * lib/share.ts — persistente, read-only deellinks voor onderzoeksvoorstellen.
 *
 * Elke link krijgt een unieke token. Het voorstel wordt opgeslagen in een
 * JSON-bestand op schijf (overleeft herstarts). De publieke pagina is read-only.
 */
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { ResearchPlan } from "@/lib/planner/types";

interface ShareRecord {
  token: string;
  plan: ResearchPlan;
  createdAt: string;
}

function storePath(): string {
  // data/ in de projectroot (naast package.json)
  return path.join(process.cwd(), "data", "shares.json");
}

async function readAll(): Promise<ShareRecord[]> {
  try {
    const raw = await fs.readFile(storePath(), "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(records: ShareRecord[]): Promise<void> {
  const dir = path.dirname(storePath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(storePath(), JSON.stringify(records, null, 2), "utf-8");
}

export function generateToken(): string {
  return randomBytes(12).toString("base64url"); // ~16 tekens, uniek
}

/** Bewaar een voorstel en geef de read-only share-gegevens terug. */
export async function createShare(
  plan: ResearchPlan
): Promise<{ token: string }> {
  const token = generateToken();
  const records = await readAll();
  // dedupe op bestaande token (praktisch onmogelijk, maar veilig)
  if (records.some((r) => r.token === token)) {
    return createShare(plan);
  }
  records.push({ token, plan, createdAt: new Date().toISOString() });
  await writeAll(records);
  return { token };
}

/** Haal een voorstel op via zijn token (read-only). */
export async function getShare(token: string): Promise<ShareRecord | null> {
  const records = await readAll();
  return records.find((r) => r.token === token) ?? null;
}

export function shareUrl(token: string): string {
  const base = (process.env.SHARE_BASE_URL || "http://localhost:3100").replace(/\/+$/, "");
  return `${base}/voorstel/${token}`;
}