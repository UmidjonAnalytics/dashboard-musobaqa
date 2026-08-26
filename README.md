# Dashboard Musobaqasi

Excel va Power BI dashboard musobaqasi sayti.

## Fayllar ro'yxati (25 ta fayl)

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
lib/session.ts
lib/supabaseAdmin.ts
lib/telegramApi.ts
lib/uz.ts

pages/_app.tsx
pages/index.tsx
pages/kirish.tsx

pages/api/auth-logout.ts
pages/api/auth-poll.ts
pages/api/auth-start.ts
pages/api/health.ts
pages/api/telegram.ts

styles/globals.css
```

## Addresses

| Address | What it is |
| --- | --- |
| `/` | Home page |
| `/kirish` | Log in with Telegram |
| `/api/health` | Diagnostic - open in a browser to check the deploy |
| `/api/telegram` | The bot's webhook |

## Changing the Uzbek wording

Every word shown on the site lives in `lib/uz.ts`. Edit that one file.

## Environment variables (set these in Vercel)

See `.env.example` for the list. Note that the two names starting with
`NEXT_PUBLIC_` are baked in when the site is built, so after changing
either of them you must redeploy for the change to take effect.
