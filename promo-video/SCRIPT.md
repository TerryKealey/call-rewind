# Call Rewind — 2:15 promo script

**Tone:** dry SE humor · self-aware · never mean about merchants  
**Length:** 2 minutes 15 seconds · 30 fps · 4050 frames · 1920×1080  
**VO:** Edge neural `en-US-AvaMultilingualNeural` (human / jovial). OpenAI `coral` if you set a real `sk-…` key.  
**Bed:** Mixkit free upbeat track @ ~14% under VO (`public/music/bed-upbeat.mp3`)

Regenerate VO: `node scripts/generate-voiceover.mjs`

---

## Voiceover (full)

| Time | VO |
|------|----|
| 0:00–0:13 | “The call went great. Then you open the CRM… and your brain leaves the building.” |
| 0:13–0:29 | “SE Next Steps. Follow-up email. Next-meeting prep. And if there’s a product gap — please draft something Scout won’t roast you for. Congrats. You won the call. Now do homework.” |
| 0:29–0:38 | “Thirty minutes of unpaid emotional labor — after you already did the hard part. Call Rewind. Be kind. Rewind the call.” |
| 0:38–1:02 | “Paste a Vault deal URL. We pull your CRM transcript. Next steps, merchant follow-up, prep for the next call, Scout draft when a gap shows up. Deal URL in. Memory optional.” |
| 1:02–1:15 | “Prefer working in your AI assistant? Say call rewind for deal — same closeout, fewer browser tabs. Post-call guilt, handled… with your CRM.” |
| 1:15–1:27 | “Drafts only. No auto-email. No auto-Scout. Your judgment stays employed. We’re not monsters.” |
| 1:27–1:42 | “And when you need a demo — hit the button. the-button.flint.shopify.io. Sample deal ID already filled. Because I’ll spin up a demo later… is a lie we all tell.” |
| 1:42–1:56 | “Or try the local demo: Find deal, everything populates — then open The Button with that deal ready to go.” |
| 1:56–2:15 | “call-rewind.quick.shopify.io. Quick site, skill, or The Button. You’re welcome, future you.” |

---

## Preview / render

```bash
cd promo-video
./node_modules/.bin/remotion studio
./node_modules/.bin/remotion render CallRewindPromo out/call-rewind-promo.mp4
```
