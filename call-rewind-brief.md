# Call Rewind

<!--
B2B SE Hack Day project brief.
Uploaded to https://b2b-se-hackday.quick.shopify.io
Keep the ## headings exactly as written.
-->

## One-line pitch
Paste a Vault deal URL, pull the CRM transcript, and get next steps, a follow-up email, next-meeting prep, and a Scout-ready gap draft — so SEs stop burning 30 minutes after every call.

## The problem
Every discovery or demo ends, and the SE still has to write notes, update CRM, draft the follow-up, and invent next-meeting prep — often from memory, inconsistently, under time pressure. That post-call tax is the lowest-leverage work attached to the highest-leverage conversations. Shopify doesn’t ship a “rewind this call into CRM + email + prep + Scout” closeout for SEs out of the box.

## What we'll build
A Quick site plus an AI skill (`call-rewind`). CRM-first: Vault deal → meeting transcript → four cards (SE Next Steps, merchant follow-up, next-meeting prep, product-gap / @Scout draft when needed). Drive/Calendar/paste are fallbacks. Drafts only — you paste; nothing auto-posts to CRM, email, or Scout.

Demo in 3 steps:
1. Open the Quick site (or run the skill).
2. Paste a Vault deal URL → Find in CRM (or use the local demo deal).
3. Copy Next Steps / follow-up / prep / Scout draft.

## Shelf
Misc

## Type
Internal tool / site

## Stage
Building

## Max team size
4

## Tools / stack
Quick site, AI skill (`call-rewind`), Quick AI proxy, Vault CRM MCP, Google Drive/Calendar fallback, local CRM proxy for WARP

## Looking for
SEs who want to pressure-test deal-ID lookup and the follow-up voice

## Open to teammates
Yes

## Setup
1. Clone or unzip this project. Open the folder in Cursor (or your AI assistant with the skill installed).
2. Skill: copy/link `call-rewind` into your skills folder (or use the packaged skill instructions). Prompt: `call rewind for deal [ID]`.
3. Site: from the project folder run `quick deploy . call-rewind --force`, then open https://call-rewind.quick.shopify.io (Shopify login).
4. For CRM Find in CRM on local HTTP preview: Cloudflare WARP on, `node scripts/crm-proxy.mjs` running, Connect CRM with your Vault API token (browser-local only).
5. Optional local demo (no CRM): open `demo.html` — sample deal `321741-demo` → Find deal → cards populate. Need a demo store? Hit The Button (`the-button.flint.shopify.io` with deal ID).

Env var names only (never commit values): none required for paste path; Vault token is stored in the browser for Connect CRM, not in `.env`.

## Prompt
call rewind for deal [ID]
# or
call rewind
# then paste transcript / merchant

## Known limits
- Drafts only — no CRM write, email send, or Scout auto-post.
- HTTPS Quick deploy can’t reach localhost CRM proxy (WARP); use local HTTP preview for Connect CRM, or paste a transcript.
- Drive/Calendar/paste remain fallbacks if CRM has no transcript.
- Scout de-dup via `product-gap-tracker` on the skill path.
- Local demo is fictional (Northstar Ceramics); not a real CRM deal.
