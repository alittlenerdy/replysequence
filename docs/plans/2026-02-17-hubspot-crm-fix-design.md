# HubSpot CRM Integration Fix - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make HubSpot CRM sync visible to users with inline status feedback, scope migration warning, and last sync timestamp.

**Architecture:** Three independent changes: (1) expand send API response + render sync status in DraftPreviewModal, (2) add `needsReconnect` + `lastSyncAt` fields to checkPlatformConnections and render in IntegrationSettings, (3) return contact name from sync function for richer UI feedback.

**Tech Stack:** Next.js, React, Drizzle ORM, TypeScript

---

### Task 1: Add contactName to HubSpotSyncResult

**Files:**
- Modify: `lib/hubspot.ts:235-241` (HubSpotSyncResult interface)
- Modify: `lib/hubspot.ts:439-468` (syncSentEmailToHubSpot return)

**Step 1: Add contactName to the HubSpotSyncResult interface**

In `lib/hubspot.ts`, update the interface at lines 235-241:

```typescript
export interface HubSpotSyncResult {
  success: boolean;
  contactFound: boolean;
  contactId?: string;
  contactName?: string;
  engagementId?: string;
  error?: string;
}
```

**Step 2: Return contactName from syncSentEmailToHubSpot**

In `lib/hubspot.ts`, update the result construction around line 456:

```typescript
    const result: HubSpotSyncResult = {
      success: !!engagementId,
      contactFound: !!contact,
      contactId: contact?.id,
      contactName: contact ? [contact.firstName, contact.lastName].filter(Boolean).join(' ') || undefined : undefined,
      engagementId: engagementId || undefined,
    };
```

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to HubSpotSyncResult

**Step 4: Commit**

```
git add lib/hubspot.ts
git commit -m "feat: add contactName to HubSpotSyncResult for UI feedback"
```

---

### Task 2: Expand send API response with hubspotDetails

**Files:**
- Modify: `app/api/drafts/send/route.ts:260-370`

**Step 1: Replace hubspotSynced boolean with hubspotDetails object**

Change the variable declaration at line 261 from:
```typescript
let hubspotSynced = false;
```
to:
```typescript
let hubspotDetails: {
  synced: boolean;
  contactFound: boolean;
  contactName?: string;
  error?: string;
} | null = null;
```

**Step 2: Update the sync result capture**

Replace lines 330 (`hubspotSynced = hubspotResult.success;`) with:
```typescript
              hubspotDetails = {
                synced: hubspotResult.success,
                contactFound: hubspotResult.contactFound,
                contactName: hubspotResult.contactName,
                error: hubspotResult.error,
              };
```

**Step 3: Update the API response**

Replace line 369 (`hubspotSynced,`) with:
```typescript
      hubspotDetails,
```

**Step 4: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 5: Commit**

```
git add app/api/drafts/send/route.ts
git commit -m "feat: expand send API response with hubspotDetails object"
```

---

### Task 3: Show CRM sync status in DraftPreviewModal

**Files:**
- Modify: `components/DraftPreviewModal.tsx:64,252-281,786-792`

**Step 1: Add state for hubspot sync details**

After line 64 (`const [sendSuccess, setSendSuccess] = useState(false);`), add:
```typescript
  const [hubspotDetails, setHubspotDetails] = useState<{
    synced: boolean;
    contactFound: boolean;
    contactName?: string;
    error?: string;
  } | null>(null);
```

**Step 2: Capture hubspotDetails from the send response**

In the `confirmSend` function, after line 271 (`console.log('[SEND-2]...`), add:
```typescript
      if (data.hubspotDetails) {
        setHubspotDetails(data.hubspotDetails);
      }
```

**Step 3: Show CRM sync status line below "Email sent successfully!"**

Replace the sendSuccess block (lines 786-792):
```typescript
                  {sendSuccess ? (
                    <div className="flex items-center justify-center gap-2 text-green-400 py-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Email sent successfully!</span>
                    </div>
```

With:
```typescript
                  {sendSuccess ? (
                    <div className="space-y-1 py-2">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Email sent successfully!</span>
                      </div>
                      {hubspotDetails && (
                        <div className={`flex items-center justify-center gap-1.5 text-xs ${
                          hubspotDetails.synced ? 'text-gray-400' : 'text-yellow-400'
                        }`}>
                          {hubspotDetails.synced ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>
                                {hubspotDetails.contactFound
                                  ? `Synced to HubSpot${hubspotDetails.contactName ? ` (${hubspotDetails.contactName})` : ''}`
                                  : 'Logged to HubSpot (contact not found)'}
                              </span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>HubSpot sync failed</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
```

**Step 4: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 5: Commit**

```
git add components/DraftPreviewModal.tsx
git commit -m "feat: show CRM sync status inline after email send"
```

---

### Task 4: Add needsReconnect and lastSyncAt to checkPlatformConnections

**Files:**
- Modify: `app/actions/checkPlatformConnections.ts:7-14,279-306`

**Step 1: Extend PlatformConnectionDetails interface**

At line 7, add two optional fields to the interface:
```typescript
export interface PlatformConnectionDetails {
  connected: boolean;
  email?: string;
  connectedAt?: Date;
  expiresAt?: Date;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  needsReconnect?: boolean;
  lastSyncAt?: Date;
}
```

**Step 2: Update HubSpot connection query to include scopes and lastSyncAt**

Replace the HubSpot select query at lines 282-291:
```typescript
    const [hubspotConnection] = await db
      .select({
        hubspotPortalId: hubspotConnections.hubspotPortalId,
        connectedAt: hubspotConnections.connectedAt,
        expiresAt: hubspotConnections.accessTokenExpiresAt,
        hasRefreshToken: hubspotConnections.refreshTokenEncrypted,
        scopes: hubspotConnections.scopes,
        lastSyncAt: hubspotConnections.lastSyncAt,
      })
      .from(hubspotConnections)
      .where(eq(hubspotConnections.userId, existingUser.id))
      .limit(1);
```

**Step 3: Set needsReconnect and lastSyncAt in hubspotDetails**

Replace the hubspotDetails construction (lines 297-304):
```typescript
      const hasRefreshToken = !!hubspotConnection.hasRefreshToken;
      const needsReconnect = !hubspotConnection.scopes.includes('crm.objects.meetings.write');
      hubspotDetails = {
        connected: true,
        email: `Portal ${hubspotConnection.hubspotPortalId}`,
        connectedAt: hubspotConnection.connectedAt,
        expiresAt: hubspotConnection.expiresAt,
        isExpired: !hasRefreshToken,
        isExpiringSoon: false,
        needsReconnect,
        lastSyncAt: hubspotConnection.lastSyncAt ?? undefined,
      };
```

**Step 4: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 5: Commit**

```
git add app/actions/checkPlatformConnections.ts
git commit -m "feat: add needsReconnect and lastSyncAt to HubSpot connection details"
```

---

### Task 5: Render reconnect banner and last sync in IntegrationSettings

**Files:**
- Modify: `components/dashboard/IntegrationSettings.tsx:900-921`

**Step 1: Add reconnect warning and last sync below the existing connection info**

After the connected email/portal display (after line 908, the `</div>` closing the connectedAt block), and before the existing expired/expiring warning (line 913), add a reconnect banner for HubSpot:

Replace lines 913-921:
```typescript
                  {isConnected && details?.needsReconnect && (
                    <p className="text-xs mt-1 text-yellow-400">
                      Your HubSpot connection needs to be updated to sync meeting data. Please disconnect and reconnect.
                    </p>
                  )}
                  {isConnected && !details?.needsReconnect && !details?.isExpired && details?.lastSyncAt && (
                    <p className="text-xs mt-1 text-gray-500">
                      Last synced {formatRelativeTime(details.lastSyncAt, nowMs)}
                    </p>
                  )}
                  {isConnected && (details?.isExpired || details?.isExpiringSoon) && !details?.needsReconnect && (
                    <p className={`text-xs mt-1 ${
                      details.isExpired ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {details.isExpired
                        ? 'Token expired. Reconnect to continue syncing to your CRM.'
                        : 'Token expiring soon. Consider reconnecting to avoid interruptions.'}
                    </p>
                  )}
```

**Step 2: Show reconnect button when needsReconnect is true**

In the action buttons section (line 929), update the condition that shows the Reconnect button:

Replace `{(details?.isExpired || details?.isExpiringSoon) && (` at line 929 with:
```typescript
                    {(details?.isExpired || details?.isExpiringSoon || details?.needsReconnect) && (
```

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 4: Commit**

```
git add components/dashboard/IntegrationSettings.tsx
git commit -m "feat: add reconnect banner and last sync time for HubSpot"
```

---

### Task 6: Final verification and ClickUp update

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Update ClickUp task status**

Update task `86aff6jgy`:
- Status: `dev` (in progress)
- Phase: `Dev`

**Step 3: Commit all together if any stragglers**

Final commit with all changes if needed.
