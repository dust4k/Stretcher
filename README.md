# Stretcher

A personal PWA for building a stretching routine from Instagram posts. Paste a reel link, the app downloads the video, AI generates instructions, and auto-places the stretch in your routine.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill in values:

```bash
cp .env.example .env.local
```

3. Create the database table (run against your Postgres):

```bash
psql $DATABASE_URL -f drizzle/0000_init.sql
# If upgrading an existing database:
psql $DATABASE_URL -f drizzle/0001_photo_carousel.sql
```

Or use Drizzle push:

```bash
npm run db:push
```

4. Run locally:

```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub and import in Vercel (or connect Git in project settings)
2. Create a **Neon Postgres** store in Vercel Storage and link it to the project
3. Create a **Blob** store and link it to the project
4. Add environment variables in Vercel → Settings → Environment Variables:
   - `APP_PASSWORD` — your login password
   - `AUTH_SECRET` — random 32+ character string
   - `OPENAI_API_KEY` — OpenAI API key
   - `INSTAGRAM_SESSION_ID` — optional, for reliable Reel downloads
5. Neon/Blob linking auto-injects `stretch_POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN`; the app resolves these automatically. You do **not** need to manually set `DATABASE_URL` unless you prefer to.
6. After first deploy, initialize the database (one time):

```bash
curl -X POST https://YOUR-APP.vercel.app/api/setup \
  -H "Content-Type: application/json" \
  -d '{"password":"YOUR_APP_PASSWORD"}'
```

7. Verify status: open `/api/health` — should show `"status":"ok"`
8. On iPhone: open the deployed URL in Safari → Share → Add to Home Screen

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_PASSWORD` | Yes | Login password |
| `AUTH_SECRET` | Yes | JWT signing secret (random string) |
| `DATABASE_URL` | Yes | Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `INSTAGRAM_SESSION_ID` | No | Browser `sessionid` cookie for reliable Reel downloads |

## Usage

1. Sign in with your password
2. Go to **Add** and paste an Instagram `/reel/` or `/p/` URL
3. The app downloads the video or photo(s), analyzes them, and inserts into your routine
4. Multi-photo carousels show a picker so you can choose which images to include
5. Use **Start** for guided playback through your routine

If auto-download fails, use the manual upload fallback on the Add page.
