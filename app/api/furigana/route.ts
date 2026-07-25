import { buildFuriganaSegmentsWithKuromoji } from "@/lib/furigana-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = payload?.text?.trim() ?? "";

  if (!text) {
    return Response.json({ segments: [] });
  }

  const segments = await buildFuriganaSegmentsWithKuromoji(text);

  return Response.json({ segments });
}
