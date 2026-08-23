/**
 * Resolve Postgres URL from Vercel/Neon injected env vars.
 * Neon integration often prefixes vars (e.g. stretch_POSTGRES_URL).
 */
export function getDatabaseUrl(): string {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    // Vercel Neon store named "stretch"
    process.env.stretch_POSTGRES_URL,
    process.env.stretch_DATABASE_URL,
    process.env["stretch_POSTGRES_URL_NON_POOLING"],
    process.env["stretch_POSTGRES_PRISMA_URL"],
  ];

  for (const url of candidates) {
    if (url && url.startsWith("postgres")) {
      return url;
    }
  }

  throw new Error(
    "No Postgres URL found. Set DATABASE_URL or connect a Vercel Postgres/Neon store to this project."
  );
}
