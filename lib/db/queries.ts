import { asc, eq, gt, gte, sql } from "drizzle-orm";
import { getDb } from "./index";
import { stretches, type Stretch } from "./schema";

export async function getAllStretches(): Promise<Stretch[]> {
  const db = getDb();
  return db.select().from(stretches).orderBy(asc(stretches.sortOrder));
}

export async function getStretchById(id: number): Promise<Stretch | undefined> {
  const db = getDb();
  const rows = await db.select().from(stretches).where(eq(stretches.id, id)).limit(1);
  return rows[0];
}

export async function getRoutineSummary() {
  const all = await getAllStretches();
  return all.map((s) => ({
    id: s.id,
    title: s.title,
    phase: s.phase,
    bodyAreas: s.bodyAreas,
    sortOrder: s.sortOrder,
  }));
}

export async function insertStretchAtIndex(
  data: Omit<typeof stretches.$inferInsert, "sortOrder">,
  insertIndex: number
): Promise<Stretch> {
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx
      .update(stretches)
      .set({ sortOrder: sql`${stretches.sortOrder} + 1` })
      .where(gte(stretches.sortOrder, insertIndex));

    const [inserted] = await tx
      .insert(stretches)
      .values({ ...data, sortOrder: insertIndex })
      .returning();

    return inserted;
  });
}

export async function deleteStretch(id: number) {
  const db = getDb();
  const [deleted] = await db.delete(stretches).where(eq(stretches.id, id)).returning();
  if (!deleted) return;

  await db
    .update(stretches)
    .set({ sortOrder: sql`${stretches.sortOrder} - 1` })
    .where(gt(stretches.sortOrder, deleted.sortOrder));
}

export async function updateStretch(
  id: number,
  data: Partial<Pick<Stretch, "title" | "instructions">>
) {
  const db = getDb();
  const [updated] = await db
    .update(stretches)
    .set(data)
    .where(eq(stretches.id, id))
    .returning();
  return updated;
}

export async function getMaxSortOrder(): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ max: sql<number>`coalesce(max(${stretches.sortOrder}), -1)` })
    .from(stretches);
  return rows[0]?.max ?? -1;
}
