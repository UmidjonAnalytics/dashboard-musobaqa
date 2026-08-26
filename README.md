# Dashboard Musobaqasi

Excel va Power BI dashboard musobaqasi sayti.

## Fayllar ro'yxati (38 ta fayl)

Use this list to check your GitHub repo matches. Every filename is unique
and nothing is deeper than two folders, on purpose.

```
.env.example
.gitignore
README.md
next-env.d.ts
next.config.js
package-lock.json
package.json
postcss.config.js
tailwind.config.js
tsconfig.json

lib/config.ts
lib/eligibility.ts
lib/getUser.ts
lib/loginFlow.ts
lib/phase.ts
lib/session.ts
lib/supabaseAdmin.ts
lib/telegramApi.ts
lib/ui.tsx
lib/uploadClient.ts
lib/uploadRules.ts
lib/uz.ts
lib/works.ts

pages/_app.tsx
pages/index.tsx
pages/ish.tsx
pages/ishlar.tsx
pages/kirish.tsx
pages/yuklash.tsx

pages/api/auth-logout.ts
pages/api/auth-poll.ts
pages/api/auth-start.ts
pages/api/download.ts
pages/api/health.ts
pages/api/submit.ts
pages/api/telegram.ts
pages/api/upload-url.ts

styles/globals.css
```

## Addresses

| Address | What it is |
| --- | --- |
| `/` | Home page |
| `/kirish` | Log in with Telegram |
| `/api/health` | Diagnostic - open in a browser to check the deploy |
| `/ishlar` | Gallery of all submissions (open to everyone) |
| `/ish?id=...` | One submission in detail |
| `/yuklash` | Upload a dashboard |
| `/api/telegram` | The bot's webhook |

## Changing the competition dates

The dates live at the top of `lib/phase.ts`, written as UTC. Tashkent is
UTC+5, so 00:00 in Tashkent is 19:00 UTC on the previous day.

To force a phase while testing, run this in the Supabase SQL editor:

    update phase_settings set forced_phase = 'upload' where id = 1;

and to go back to the real dates:

    update phase_settings set forced_phase = null where id = 1;

## Changing the Uzbek wording

Every word shown on the site lives in `lib/uz.ts`. Edit that one file.

## Environment variables (set these in Vercel)

See `.env.example` for the list. Note that the two names starting with
`NEXT_PUBLIC_` are baked in when the site is built, so after changing
either of them you must redeploy for the change to take effect.
