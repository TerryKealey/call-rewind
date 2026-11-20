# Call Rewind

**Status:** Hack Day prototype (Nov 20, 2026). Track E — Quick site + AI skill. Not production-ready.

## The B2B problem
After every discovery or demo, SEs still burn ~30 minutes on SE Next Steps, a merchant follow-up, next-meeting prep, and (when a gap shows up) a Scout draft — usually from memory. Shopify doesn’t provide that closeout path out of the box.

## What it does
- **CRM-first:** paste a Vault deal URL → pull *your* meeting transcript → fill four cards
- **SE Next Steps**, **merchant follow-up**, **next-meeting prep**, **product-gap / @Scout draft** (copy-ready; never auto-posts)
- **Fallbacks:** Drive Meet notes, Calendar, or paste a transcript
- **Local demo:** `demo.html` with sample deal `321741-demo` (no CRM)
- **The Button:** CTAs open `the-button.flint.shopify.io` with a sample deal ID

## Shape
Internal Quick site + AI skill (`call-rewind`). No Shopify admin extension. CRM via Vault CRM MCP (skill) / Connect CRM + local WARP proxy (site).

## Set it up
1. Open this folder in your AI assistant; install/link the `call-rewind` skill.
2. Deploy the site: `quick deploy . call-rewind --force` → https://call-rewind.quick.shopify.io
3. Paste a Vault deal URL → **Find in CRM**, or use **Local demo**.
4. For local CRM Connect: WARP on, `node scripts/crm-proxy.mjs`, paste Vault API token in-browser only.

## Known limits / what’s next
- Drafts only (no CRM/email/Scout writes)
- HTTPS Quick can’t use localhost CRM proxy — use HTTP local preview or paste
- Harden deal-ID → transcript matching; optional Gumloop push for SE Next Steps

## Project brief
See [`call-rewind-brief.md`](./call-rewind-brief.md) (Hack Day “Fill from a .md” format).
