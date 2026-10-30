#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseUsage, type KiroUsage } from "./parse.js";

const run = promisify(execFile);
const CLI = process.env.KIRO_CLI_PATH ?? "kiro-cli";
const CACHE_TTL_MS = 30_000;

let cache: { at: number; value: KiroUsage } | null = null;
let inflight: Promise<KiroUsage> | null = null;

async function fetchUsage(): Promise<KiroUsage> {
  const { stdout } = await run(CLI, ["chat", "--no-interactive", "/usage"], {
    timeout: 30_000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });
  return parseUsage(stdout);
}

// Each probe starts a CLI chat session, so concurrent and repeated calls share one result.
async function getUsage(refresh: boolean): Promise<KiroUsage> {
  if (!refresh && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }
  inflight ??= fetchUsage()
    .then((value) => {
      cache = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

const server = new McpServer({ name: "kiro-usage", version: "0.1.0" });

server.registerTool(
  "get_kiro_usage",
  {
    title: "Kiro credit usage",
    description:
      "Returns the Kiro plan credits used, remaining and the reset date, read from kiro-cli /usage.",
    inputSchema: {
      refresh: z.boolean().optional().describe("Bypass the 30 second cache"),
    },
    outputSchema: {
      plan: z.string().nullable(),
      resetsOn: z.string().nullable(),
      creditsUsed: z.number(),
      creditsTotal: z.number(),
      creditsRemaining: z.number(),
      percentUsed: z.number(),
      addOnCreditsAvailableForPurchase: z.boolean(),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ refresh }) => {
    try {
      const usage = await getUsage(refresh ?? false);
      const summary =
        `${usage.plan ?? "Kiro"}: ${usage.creditsUsed} of ${usage.creditsTotal} credits used ` +
        `(${usage.percentUsed}%), ${usage.creditsRemaining} remaining, resets ${usage.resetsOn ?? "unknown"}.`;
      return {
        content: [{ type: "text", text: summary }],
        structuredContent: { ...usage },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Could not read Kiro usage: ${message}` }] };
    }
  },
);

await server.connect(new StdioServerTransport());
