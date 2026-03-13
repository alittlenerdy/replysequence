/**
 * Auto CRM Field Population
 *
 * After each meeting, analyzes the transcript to infer deal stage, close probability,
 * and key deal fields, then syncs them to connected CRMs (HubSpot/Salesforce).
 * Fire-and-forget — called after draft generation completes.
 */

import { db } from '@/lib/db';
import { meetings, dealContexts, hubspotConnections, salesforceConnections } from '@/lib/db/schema';
import type { Participant, DealStage } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, encrypt } from '@/lib/encryption';
import { callClaudeAPI } from '@/lib/claude-api';
import { refreshHubSpotToken } from '@/lib/hubspot';
import { refreshSalesforceToken } from '@/lib/salesforce';

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, tag: '[CRM-AUTO]', message, ...data }));
}

interface InferredDealFields {
  dealStage: DealStage;
  closeProbability: number; // 0-100
  nextAction: string;
  decisionMaker: string | null;
  budgetMentioned: boolean;
  timelineMentioned: boolean;
  competitorsMentioned: string[];
  meetingSummary: string;
}

const DEAL_INFERENCE_PROMPT = `You are a sales deal analyst. Analyze this meeting transcript to infer CRM deal fields.

Output a JSON object with:
- "dealStage": One of "prospecting", "qualification", "discovery", "proposal", "negotiation", "closed_won", "closed_lost"
- "closeProbability": Number 0-100 representing likelihood of closing
- "nextAction": Brief description of the most important next step
- "decisionMaker": Name of the decision maker if identified (or null)
- "budgetMentioned": Boolean — was budget, pricing, or cost discussed?
- "timelineMentioned": Boolean — was a timeline or deadline discussed?
- "competitorsMentioned": Array of competitor names mentioned
- "meetingSummary": 2-3 sentence summary suitable for a CRM activity log

Inference rules for deal stage:
- "prospecting": First contact, exploring if there's a fit
- "qualification": Discussing needs, budget, authority, timeline (BANT)
- "discovery": Deep dive into requirements, demo, technical discussion
- "proposal": Pricing presented, proposal discussed, evaluation underway
- "negotiation": Terms being negotiated, contract review, legal involved
- "closed_won": Deal confirmed, verbal agreement, contract signed
- "closed_lost": Explicitly lost, went with competitor, no longer interested

Close probability guidelines:
- Prospecting: 5-15%
- Qualification: 15-30%
- Discovery: 30-50%
- Proposal: 50-70%
- Negotiation: 70-90%
- Adjust +/- 10% based on positive/negative signals in the transcript.`;

/**
 * Infer deal fields from a meeting transcript and sync to CRM.
 * Fire-and-forget — logs errors but never throws.
 */
export async function autoPopulateCRMFields(
  meetingId: string,
  userId: string,
  transcript: string
): Promise<void> {
  try {
    // Get meeting context
    const [meeting] = await db
      .select({
        topic: meetings.topic,
        startTime: meetings.startTime,
        hostEmail: meetings.hostEmail,
        participants: meetings.participants,
        dealContextId: meetings.dealContextId,
        summary: meetings.summary,
      })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) return;

    // Identify external contact
    const participants = (meeting.participants || []) as Participant[];
    const externalContact = participants.find((p) => p.email && p.email !== meeting.hostEmail);
    if (!externalContact?.email) {
      log('info', 'No external contact, skipping CRM auto-population', { meetingId });
      return;
    }

    // Truncate transcript
    const maxChars = 24000;
    const trimmedTranscript = transcript.length > maxChars
      ? transcript.slice(0, maxChars) + '\n[Truncated]'
      : transcript;

    // Infer deal fields via Claude
    const userPrompt = [
      `Meeting: ${meeting.topic || 'Untitled'}`,
      `Date: ${meeting.startTime ? new Date(meeting.startTime).toISOString() : 'Unknown'}`,
      `Host: ${meeting.hostEmail}`,
      `Contact: ${externalContact.user_name} (${externalContact.email})`,
      '',
      'Transcript:',
      trimmedTranscript,
    ].join('\n');

    const result = await callClaudeAPI({
      systemPrompt: DEAL_INFERENCE_PROMPT,
      userPrompt,
      maxTokens: 1024,
    });

    let inferred: InferredDealFields;
    try {
      let jsonStr = result.content.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      inferred = JSON.parse(jsonStr);
    } catch {
      log('warn', 'Failed to parse deal inference', { meetingId });
      return;
    }

    log('info', 'Deal fields inferred', {
      meetingId,
      stage: inferred.dealStage,
      probability: inferred.closeProbability,
    });

    // Update deal context if linked
    if (meeting.dealContextId) {
      await db
        .update(dealContexts)
        .set({
          dealStage: inferred.dealStage,
          dealHealthScore: inferred.closeProbability,
          lastMeetingId: meetingId,
          lastMeetingAt: meeting.startTime || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dealContexts.id, meeting.dealContextId));
    }

    // Sync to connected CRMs
    const [hsConnection, sfConnection] = await Promise.all([
      db.select().from(hubspotConnections).where(eq(hubspotConnections.userId, userId)).limit(1),
      db.select().from(salesforceConnections).where(eq(salesforceConnections.userId, userId)).limit(1),
    ]);

    const syncPromises: Promise<void>[] = [];

    if (hsConnection.length > 0) {
      syncPromises.push(
        syncDealFieldsToHubSpot(hsConnection[0], externalContact.email, inferred, meeting.topic || 'Meeting')
      );
    }

    if (sfConnection.length > 0) {
      syncPromises.push(
        syncDealFieldsToSalesforce(sfConnection[0], externalContact.email, inferred, meeting.topic || 'Meeting')
      );
    }

    await Promise.allSettled(syncPromises);

    log('info', 'CRM auto-population completed', {
      meetingId,
      hubspot: hsConnection.length > 0,
      salesforce: sfConnection.length > 0,
    });
  } catch (error) {
    log('error', 'CRM auto-population failed', {
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function syncDealFieldsToHubSpot(
  connection: typeof hubspotConnections.$inferSelect,
  contactEmail: string,
  fields: InferredDealFields,
  meetingTitle: string
): Promise<void> {
  try {
    let accessToken = decrypt(connection.accessTokenEncrypted);

    // Refresh if expired
    if (connection.accessTokenExpiresAt < new Date()) {
      try {
        const refreshed = await refreshHubSpotToken(decrypt(connection.refreshTokenEncrypted));
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
      } catch {
        log('error', 'HubSpot token refresh failed');
        return;
      }
    }

    // Log meeting as an engagement (note/activity)
    const noteBody = [
      `Meeting: ${meetingTitle}`,
      `Deal Stage: ${fields.dealStage}`,
      `Close Probability: ${fields.closeProbability}%`,
      `Next Action: ${fields.nextAction}`,
      fields.decisionMaker ? `Decision Maker: ${fields.decisionMaker}` : '',
      fields.competitorsMentioned.length ? `Competitors: ${fields.competitorsMentioned.join(', ')}` : '',
      '',
      fields.meetingSummary,
    ].filter(Boolean).join('\n');

    // Create a note engagement on the contact
    // First find the contact
    const searchRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/search`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: contactEmail }] }],
          limit: 1,
        }),
      }
    );

    if (!searchRes.ok) return;
    const searchData = await searchRes.json();
    if (!searchData.results?.length) return;

    const contactId = searchData.results[0].id;

    // Create note
    await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: new Date().toISOString(),
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
          },
        ],
      }),
    });

    log('info', 'HubSpot deal fields synced', { contactEmail });
  } catch (error) {
    log('error', 'HubSpot deal sync error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function syncDealFieldsToSalesforce(
  connection: typeof salesforceConnections.$inferSelect,
  contactEmail: string,
  fields: InferredDealFields,
  meetingTitle: string
): Promise<void> {
  try {
    let accessToken = decrypt(connection.accessTokenEncrypted);
    let instanceUrl = connection.instanceUrl;

    // Refresh if expired
    if (connection.accessTokenExpiresAt < new Date()) {
      try {
        const refreshed = await refreshSalesforceToken(decrypt(connection.refreshTokenEncrypted));
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
      } catch {
        log('error', 'Salesforce token refresh failed');
        return;
      }
    }

    // Log meeting as a Task with deal context
    const descriptionParts = [
      `Auto-generated from ReplySequence meeting analysis.`,
      `Meeting: ${meetingTitle}`,
      `Deal Stage: ${fields.dealStage}`,
      `Close Probability: ${fields.closeProbability}%`,
      `Next Action: ${fields.nextAction}`,
      fields.decisionMaker ? `Decision Maker: ${fields.decisionMaker}` : '',
      fields.competitorsMentioned.length ? `Competitors: ${fields.competitorsMentioned.join(', ')}` : '',
      '',
      fields.meetingSummary,
    ].filter(Boolean).join('\n');

    // Find contact in Salesforce
    const contactQuery = encodeURIComponent(
      `SELECT Id FROM Contact WHERE Email = '${contactEmail.replace(/'/g, "\\'")}' LIMIT 1`
    );
    const contactRes = await fetch(
      `${instanceUrl}/services/data/v66.0/query?q=${contactQuery}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    let whoId: string | undefined;
    if (contactRes.ok) {
      const contactData = await contactRes.json();
      whoId = contactData.records?.[0]?.Id;
    }

    // Create Task with deal context
    const taskBody: Record<string, unknown> = {
      Subject: `Meeting Analysis: ${meetingTitle}`,
      Description: descriptionParts,
      Status: 'Completed',
      Priority: 'Normal',
      Type: 'Meeting',
      ActivityDate: new Date().toISOString().split('T')[0],
    };
    if (whoId) taskBody.WhoId = whoId;

    await fetch(`${instanceUrl}/services/data/v66.0/sobjects/Task`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskBody),
    });

    log('info', 'Salesforce deal fields synced', { contactEmail });
  } catch (error) {
    log('error', 'Salesforce deal sync error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
