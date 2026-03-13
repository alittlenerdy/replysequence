/**
 * CRM Next Step Sync
 *
 * Orchestrates syncing completed next steps to connected CRMs (HubSpot, Salesforce).
 * Handles token retrieval, refresh, and fire-and-forget CRM calls.
 * Called when a next step is marked as completed via the PATCH endpoint.
 */

import { db } from '@/lib/db';
import { hubspotConnections, salesforceConnections, meetings, nextStepsTable, dealContexts } from '@/lib/db/schema';
import type { Participant } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, encrypt } from '@/lib/encryption';
import { syncNextStepToHubSpot, refreshHubSpotToken } from '@/lib/hubspot';
import { syncNextStepToSalesforce, refreshSalesforceToken } from '@/lib/salesforce';
import type { HubSpotNextStepData } from '@/lib/hubspot';
import type { SalesforceNextStepData } from '@/lib/salesforce';

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, tag: '[CRM-NEXT-STEP]', message, ...data }));
}

/**
 * Sync completed next steps to all connected CRMs for a user.
 * Fire-and-forget — logs errors but never throws.
 */
export async function syncCompletedNextStepsToCRM(
  userId: string,
  nextStepIds: string[]
): Promise<void> {
  try {
    // Fetch next steps with meeting and deal context
    const steps = await db
      .select({
        id: nextStepsTable.id,
        userId: nextStepsTable.userId,
        task: nextStepsTable.task,
        type: nextStepsTable.type,
        urgency: nextStepsTable.urgency,
        owner: nextStepsTable.owner,
        dueDate: nextStepsTable.dueDate,
        meetingId: nextStepsTable.meetingId,
        dealContextId: nextStepsTable.dealContextId,
        meetingTopic: meetings.topic,
        meetingParticipants: meetings.participants,
        companyName: dealContexts.companyName,
      })
      .from(nextStepsTable)
      .leftJoin(meetings, eq(nextStepsTable.meetingId, meetings.id))
      .leftJoin(dealContexts, eq(nextStepsTable.dealContextId, dealContexts.id))
      .where(eq(nextStepsTable.userId, userId));

    const matchingSteps = steps.filter((s) => nextStepIds.includes(s.id));
    if (matchingSteps.length === 0) return;

    // Check for HubSpot and Salesforce connections in parallel
    const [hsConnection, sfConnection] = await Promise.all([
      db.select().from(hubspotConnections).where(eq(hubspotConnections.userId, userId)).limit(1),
      db.select().from(salesforceConnections).where(eq(salesforceConnections.userId, userId)).limit(1),
    ]);

    const hasHubSpot = hsConnection.length > 0;
    const hasSalesforce = sfConnection.length > 0;

    if (!hasHubSpot && !hasSalesforce) {
      log('info', 'No CRM connections found, skipping sync', { userId });
      return;
    }

    // Sync each step to connected CRMs
    const syncPromises: Promise<void>[] = [];

    for (const step of matchingSteps) {
      // Extract first external participant email from meeting
      const participants = (step.meetingParticipants || []) as Participant[];
      const contactEmail = participants.find((p) => p.email)?.email;

      const baseData = {
        task: step.task,
        type: step.type as 'email' | 'call' | 'document' | 'internal' | 'meeting',
        urgency: step.urgency as 'immediate' | 'this_week' | 'next_week' | 'no_deadline',
        owner: step.owner,
        dueDate: step.dueDate || undefined,
        contactEmail: contactEmail || undefined,
        meetingTitle: step.meetingTopic || undefined,
        companyName: step.companyName || undefined,
      };

      if (hasHubSpot) {
        syncPromises.push(syncToHubSpot(hsConnection[0], baseData));
      }

      if (hasSalesforce) {
        syncPromises.push(syncToSalesforce(sfConnection[0], baseData));
      }
    }

    await Promise.allSettled(syncPromises);
    log('info', 'CRM sync completed', {
      userId,
      stepCount: matchingSteps.length,
      hubspot: hasHubSpot,
      salesforce: hasSalesforce,
    });
  } catch (error) {
    log('error', 'CRM next step sync failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function syncToHubSpot(
  connection: typeof hubspotConnections.$inferSelect,
  data: HubSpotNextStepData
): Promise<void> {
  try {
    let accessToken = decrypt(connection.accessTokenEncrypted);

    // Refresh token if expired
    if (connection.accessTokenExpiresAt < new Date()) {
      try {
        const refreshTokenDecrypted = decrypt(connection.refreshTokenEncrypted);
        const refreshed = await refreshHubSpotToken(refreshTokenDecrypted);
        accessToken = refreshed.accessToken;

        await db
          .update(hubspotConnections)
          .set({
            accessTokenEncrypted: encrypt(refreshed.accessToken),
            refreshTokenEncrypted: encrypt(refreshed.refreshToken),
            accessTokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
            lastRefreshedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(hubspotConnections.id, connection.id));
      } catch (refreshError) {
        log('error', 'HubSpot token refresh failed during next step sync', {
          error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        });
        return;
      }
    }

    const result = await syncNextStepToHubSpot(accessToken, data);
    if (result.success) {
      await db
        .update(hubspotConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(hubspotConnections.id, connection.id));
    }
  } catch (error) {
    log('error', 'HubSpot next step sync error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function syncToSalesforce(
  connection: typeof salesforceConnections.$inferSelect,
  data: SalesforceNextStepData
): Promise<void> {
  try {
    let accessToken = decrypt(connection.accessTokenEncrypted);
    let instanceUrl = connection.instanceUrl;

    // Refresh token if expired
    if (connection.accessTokenExpiresAt < new Date()) {
      try {
        const refreshTokenDecrypted = decrypt(connection.refreshTokenEncrypted);
        const refreshed = await refreshSalesforceToken(refreshTokenDecrypted);
        accessToken = refreshed.accessToken;
        instanceUrl = refreshed.instanceUrl;

        await db
          .update(salesforceConnections)
          .set({
            accessTokenEncrypted: encrypt(refreshed.accessToken),
            instanceUrl: refreshed.instanceUrl,
            lastRefreshedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(salesforceConnections.id, connection.id));
      } catch (refreshError) {
        log('error', 'Salesforce token refresh failed during next step sync', {
          error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        });
        return;
      }
    }

    const result = await syncNextStepToSalesforce(instanceUrl, accessToken, data);
    if (result.success) {
      await db
        .update(salesforceConnections)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(salesforceConnections.id, connection.id));
    }
  } catch (error) {
    log('error', 'Salesforce next step sync error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
