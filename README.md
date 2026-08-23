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

1. Push to GitHub and import in Vercel
2. Add environment variables (see `.env.example`)
3. Enable Vercel Blob and Postgres (or use Neon)
4. On iPhone: open the deployed URL in Safari → Share → Add to Home Screen

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
