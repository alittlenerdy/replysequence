/**
 * Mutual Action Plan — Persistence Layer
 *
 * CRUD operations for mutual_action_plans and map_steps tables.
 * Used by the MAP generation engine and the debug/review API.
 */

import { db } from '@/lib/db';
import { mutualActionPlans, mapSteps } from '@/lib/db/schema';
import type { NewMutualActionPlan, NewMapStep, MapStatus } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// ── Create MAP ───────────────────────────────────────────────────────

interface CreateMapParams {
  dealContextId?: string;
  meetingId: string;
  title: string;
  summary: string;
  steps: Omit<NewMapStep, 'mapId'>[];
}

/**
 * Create a MAP with its steps in a single operation.
 * Idempotent: deletes any existing MAP for the same meetingId first.
 */
export async function createMap(params: CreateMapParams) {
  const { dealContextId, meetingId, title, summary, steps } = params;

  // Idempotency: delete existing MAPs for this meeting
  const existing = await db
    .select({ id: mutualActionPlans.id })
    .from(mutualActionPlans)
    .where(eq(mutualActionPlans.meetingId, meetingId));

  for (const map of existing) {
    await db.delete(mapSteps).where(eq(mapSteps.mapId, map.id));
    await db.delete(mutualActionPlans).where(eq(mutualActionPlans.id, map.id));
  }

  // Create the MAP
  const [map] = await db
    .insert(mutualActionPlans)
    .values({
      dealContextId: dealContextId || null,
      meetingId,
      title,
      summary,
      stepCount: steps.length,
    } satisfies NewMutualActionPlan)
    .returning();

  // Create steps with sort order
  if (steps.length > 0) {
    const stepRows: NewMapStep[] = steps.map((s, i) => ({
      ...s,
      mapId: map.id,
      sortOrder: i,
    }));

    await db.insert(mapSteps).values(stepRows);
  }

  return map;
}

// ── Read MAP ─────────────────────────────────────────────────────────

/**
 * Get a MAP with all its steps, ordered by sortOrder.
 */
export async function getMapWithSteps(mapId: string) {
  const [map] = await db
    .select()
    .from(mutualActionPlans)
    .where(eq(mutualActionPlans.id, mapId))
    .limit(1);

  if (!map) return null;

  const steps = await db
    .select()
    .from(mapSteps)
    .where(eq(mapSteps.mapId, mapId))
    .orderBy(mapSteps.sortOrder);

  return { ...map, steps };
}

/**
 * Get the most recent MAP for a meeting.
 */
export async function getMapForMeeting(meetingId: string) {
  const [map] = await db
    .select()
    .from(mutualActionPlans)
    .where(eq(mutualActionPlans.meetingId, meetingId))
    .orderBy(desc(mutualActionPlans.createdAt))
    .limit(1);

  if (!map) return null;

  const steps = await db
    .select()
    .from(mapSteps)
    .where(eq(mapSteps.mapId, map.id))
    .orderBy(mapSteps.sortOrder);

  return { ...map, steps };
}

/**
 * List all MAPs for a deal context.
 */
export async function listMapsForDeal(dealContextId: string) {
  return db
    .select()
    .from(mutualActionPlans)
    .where(eq(mutualActionPlans.dealContextId, dealContextId))
    .orderBy(desc(mutualActionPlans.createdAt));
}

// ── Update MAP ───────────────────────────────────────────────────────

export async function updateMapStatus(mapId: string, status: MapStatus) {
  const [updated] = await db
    .update(mutualActionPlans)
    .set({ status, updatedAt: new Date() })
    .where(eq(mutualActionPlans.id, mapId))
    .returning();

  return updated;
}
