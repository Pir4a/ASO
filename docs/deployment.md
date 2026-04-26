# Deployment — free-tier stack for the school project

Goal: run the full app (Next + Nest + Postgres + Mongo + email + 2FA) on
free tiers with no real traffic, no manual ops, and no expiring credits.

## Recommended free-tier mapping

| Piece            | Provider                          | Free tier                                         | Notes                                                                                                  |
| ---------------- | --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Next.js frontend | **Vercel**                        | Hobby plan, persistent                            | Best DX for Next, no cold starts.                                                                      |
| NestJS API       | **Koyeb** (preferred) or Fly.io   | Koyeb: 1 web service, stays warm. Fly: 3 × 256 MB | Render's free tier works but cold-starts ~30 s after 15 min idle — bad for grading demos.              |
| Postgres         | **Neon**                          | 0.5 GB, forever free, ~3 s auto-resume from idle  | Best Postgres free tier. No 7-day expiry traps.                                                        |
| Mongo (GridFS)   | **MongoDB Atlas M0**              | 512 MB, persistent                                | Built for this. Enough for demo image uploads.                                                         |
| Transactional email | **Resend**                     | 3k emails/month free                              | Plug into the existing `NodemailerService` via SMTP. Brevo (300/day, EU residency) is the alternative. |
| Chat LLM         | **Groq** (free API)               | Llama 3 / Mixtral, generous RPM                   | Ollama can't run on free tiers — point the chat at Groq's URL or disable chat for the deployed build.  |
| Domain           | `*.vercel.app` + `*.koyeb.app`    | Free                                              | Or grab a `.xyz` for ~€1/year if a vanity URL matters.                                                 |

**Total cost: €0** (or ~€1/year with a custom domain).

## Trade-offs you should know about

- **Neon idle suspend.** After ~5 min of no queries the Postgres compute
  suspends; the next request takes ~3 s to wake it. Fine for demos, would
  hurt real traffic.
- **No free Ollama.** Either swap the LLM URL to Groq's endpoint (one env
  var change in `chat.service` / wherever `OLLAMA_URL` lives) or hide the
  chat widget for the deployed build.
- **Email deliverability.** Whatever provider you pick, you must add SPF +
  DKIM + DMARC on the sending domain or every mail goes to spam. Resend
  walks you through it in their console.
- **2FA needs HTTPS.** Authenticator apps will accept the QR over an
  insecure origin in dev, but production must be HTTPS for the QR
  enrollment to be trusted. Vercel + Koyeb both terminate TLS automatically.

## What does NOT need a third party

- **TOTP / 2FA** is fully self-hosted via `otplib` (ticket #7). Users scan
  the QR with Google Authenticator / Authy / 1Password — no Twilio, no
  Auth0, no SMS. Avoid SMS-based 2FA: Twilio costs add up, NIST has
  deprecated it, and CDC §XVI.9 calls for app-based MFA anyway.

## Rough deployment checklist

1. Push the repo to GitHub.
2. **Vercel** → import the repo, set the build root to `apps/web`, add the
   `NEXT_PUBLIC_API_URL` env var pointing at the Koyeb service URL.
3. **Koyeb** → new web service from the same repo, build root `apps/api`,
   `Dockerfile` build, health check on `/api/health` (or `/api`).
4. **Neon** → create a project, copy the connection string into Koyeb as
   `DATABASE_URL`.
5. **Atlas** → create an M0 cluster, allow `0.0.0.0/0`, copy the URI into
   Koyeb as `MONGO_URL`.
6. **Resend** → verify the sending domain (DKIM/SPF/DMARC), copy the SMTP
   creds into Koyeb (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`,
   `SMTP_FROM`).
7. **Groq** (optional, only if keeping chat) → API key into Koyeb, update
   the chat service to call Groq's OpenAI-compatible endpoint.
8. Generate a fresh `JWT_SECRET` (`openssl rand -hex 32`) and put it on
   Koyeb. Same for any signing/cookie secrets.
9. Smoke-test: register → verify-email → login → enroll MFA → place an
   order with Stripe test mode → check Resend dashboard for the receipt.

## Things easy to forget

- Don't ship `.env*` to the repo. Check `.gitignore` covers all of them.
- `JWT_SECRET` must be the same value across deploys, or every existing
  session is invalidated on each redeploy.
- Stripe in production needs **live** keys + the webhook URL pointed at the
  Koyeb service. For the school project, keep test mode keys.
- The `pir4a` git config is local — Vercel/Koyeb deploy bots commit
  nothing back to the repo, so that's irrelevant.
