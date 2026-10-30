# kiro-usage-mcp

An [MCP](https://modelcontextprotocol.io) server that reports your [Kiro](https://kiro.dev) credit usage: plan, credits used and remaining, and the reset date.

It reads the output of `kiro-cli chat --no-interactive "/usage"`, so it works with any account the Kiro CLI is logged into and needs no token of its own.

## Requirements

- Node.js 20 or later
- [Kiro CLI](https://kiro.dev/cli/), installed and logged in (`kiro-cli login`)
- pnpm, to build from source

## Install

```sh
git clone https://github.com/shaffe-fr/kiro-usage-mcp.git
cd kiro-usage-mcp
pnpm install
pnpm build
```

## Configure

Add the server to your MCP client. For Kiro, edit `~/.kiro/settings/mcp.json` (global) or `.kiro/settings/mcp.json` (workspace):

```json
{
  "mcpServers": {
    "kiro-usage": {
      "command": "node",
      "args": ["/absolute/path/to/kiro-usage-mcp/dist/index.js"],
      "autoApprove": ["get_kiro_usage"]
    }
  }
}
```

The tool is read-only, so auto-approving it is safe. Any other MCP client that launches stdio servers works the same way.

If `kiro-cli` is not on the `PATH` of the process that starts the server, set `KIRO_CLI_PATH` to the executable:

```json
"env": { "KIRO_CLI_PATH": "C:\\Users\\you\\AppData\\Local\\Kiro-Cli\\kiro-cli.exe" }
```

## Tool

### `get_kiro_usage`

| Argument  | Type      | Description                  |
|-----------|-----------|------------------------------|
| `refresh` | `boolean` | Optional. Bypass the 30 second cache. |

Returns a text summary:

```
KIRO POWER: 7483.87 of 10000 credits used (74.8%), 2516.13 remaining, resets 2026-11-01.
```

and the same data as `structuredContent`:

```json
{
  "plan": "KIRO POWER",
  "resetsOn": "2026-11-01",
  "creditsUsed": 7483.87,
  "creditsTotal": 10000,
  "creditsRemaining": 2516.13,
  "percentUsed": 74.8,
  "addOnCreditsAvailableForPurchase": true
}
```

## Limitations

- Each probe starts a Kiro CLI chat session, which may leave an empty session in the CLI history. Results are cached for 30 seconds and concurrent calls share a single probe.
- The server parses the CLI's human-readable output. If a Kiro release changes that format, the tool returns an error quoting the unexpected output rather than wrong numbers.
- Overage and organisation-level allowances are not reported, because `/usage` does not show them.

## Development

```sh
pnpm build   # compile to dist/
pnpm test    # compile and run the parser tests
```

## License

[MIT](LICENSE)
