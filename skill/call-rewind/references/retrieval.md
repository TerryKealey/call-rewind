# Call Rewind — retrieval notes

## Identity (no personal token paste)

| Surface | How the SE is identified |
|---------|--------------------------|
| **Cursor skill** | CRM MCP in **this** agent session (your Cursor MCP login / vault CRM auth). Never ask the SE to paste a Vault API token into chat. |
| **Quick site** | Logged-in Quick IAP user (`quick.id`) + Vault Minerva browser session via `quick.fetch` / `quick.http`. No token field. |

If CRM auth fails: point to `#crm-mcp` / open `vault.shopify.io` once — do **not** collect API tokens in the UI or chat.

## Priority order

1. **CRM MCP** — Vault deal/meeting URL → `crm_get_deal` → `crm_list_activities` (`meetings`) → `crm_get_meeting_transcript`
2. **Google Drive Meet notes** — only if CRM has no transcript
3. **Google Calendar** → linked notes
4. **Paste**

Do **not** use BigQuery `sales_calls` / CloudDo transcript-exception for SE workflows.

## CRM deal / Vault URL

1. Parse deal ID / account ID / meeting ID from Vault URL.
2. `crm_get_deal` → account id + merchant.
3. `crm_list_activities` on that account, `type: meetings`, newest first.
4. `crm_get_meeting_transcript` until one returns speaker text.
5. If CRM empty: Drive → Calendar → paste. Never invent a call. Never claim "no meetings" on an auth error.

## Choosing among meetings

1. Newest first  
2. Prefer merchant-facing titles  
3. Skip empty / tiny transcripts  
