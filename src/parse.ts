export interface KiroUsage {
  plan: string | null;
  resetsOn: string | null;
  creditsUsed: number;
  creditsTotal: number;
  creditsRemaining: number;
  percentUsed: number;
  addOnCreditsAvailableForPurchase: boolean;
}

const ANSI = /\u001B\[[0-9;?]*[ -/]*[@-~]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI, "");
}

export function parseUsage(raw: string): KiroUsage {
  const text = stripAnsi(raw);

  const credits = /Credits\s*\(\s*([\d.,]+)\s+of\s+([\d.,]+)\s+covered in plan\s*\)/i.exec(text);
  if (!credits) {
    throw new Error(`Unrecognised /usage output: ${text.trim().slice(0, 300)}`);
  }

  const used = Number(credits[1]!.replace(/,/g, ""));
  const total = Number(credits[2]!.replace(/,/g, ""));
  const header = /Usage\s*\|\s*resets on\s+(\S+)\s*\|\s*(.+)/i.exec(text);

  return {
    plan: header?.[2]?.trim() ?? null,
    resetsOn: header?.[1] ?? null,
    creditsUsed: used,
    creditsTotal: total,
    creditsRemaining: Math.round((total - used) * 100) / 100,
    percentUsed: total > 0 ? Math.round((used / total) * 1000) / 10 : 0,
    addOnCreditsAvailableForPurchase: /add-on credits available for purchase/i.test(text),
  };
}
