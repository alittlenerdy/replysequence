# Email Account Connection - Design Document

**Date:** 2026-02-16
**Status:** Approved
**ClickUp Task:** 86aff6qx0

## Problem

Currently, all emails sent through ReplySequence use Resend's `noreply@resend.dev` sender address. Recipients see a generic sender instead of the user's real email, which:
- Reduces open rates and trust
- Prevents replies from going to the user directly
- Looks unprofessional for sales follow-ups

## Solution

Allow users to connect their Gmail or Outlook/Microsoft 365 account so emails are sent **from their real email address** using the Gmail API or Microsoft Graph API.

## Architecture

### Approach: Direct OAuth + Provider API

Send emails through Gmail API (`gmail.send` scope) or Microsoft Graph API (`Mail.Send` scope). This follows the existing OAuth pattern used for meeting platforms and calendars.

**Why this approach:**
- Reuses existing OAuth infrastructure (encryption, token storage, refresh logic)
- Same Google/Microsoft client IDs already configured
- No additional third-party dependencies
- Most reliable delivery (emails go through user's own mail server)

### Database: `email_connections` table

Follows the same pattern as `zoom_connections`, `teams_connections`, etc.

```
email_connections
├── id (uuid PK)
├── userId (FK → users.id)
├── provider ('gmail' | 'outlook')
├── email (connected email address)
├── displayName (user's display name)
├── accessTokenEncrypted (AES-256-GCM)
├── refreshTokenEncrypted (AES-256-GCM)
├── accessTokenExpiresAt (timestamp)
├── scopes (space-separated)
├── isDefault (boolean, default true)
├── connectedAt, createdAt, updatedAt
```

### OAuth Flows

**Gmail:**
- Auth URL: `https://accounts.google.com/o/oauth2/v2/auth`
- Token URL: `https://oauth2.googleapis.com/token`
- Scopes: `openid profile email https://www.googleapis.com/auth/gmail.send`
- Reuses `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- Redirect URI: `/api/auth/gmail/callback`

**Outlook:**
- Auth URL: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- Token URL: `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- Scopes: `openid profile email Mail.Send offline_access`
- Reuses `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`
- Redirect URI: `/api/auth/outlook/callback`

### Email Sending Flow

```
User clicks "Send" on draft
  → app/api/drafts/send/route.ts
    → Look up user's email connection (if any)
    → If connected:
        → Decrypt access token
        → Refresh if expired
        → Send via Gmail API or Microsoft Graph
    → If not connected:
        → Fall back to Resend (current behavior)
    → Track event, sync to CRM (unchanged)
```

### Gmail API Sending

```
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "raw": base64url(RFC 2822 message)
}
```

### Microsoft Graph Sending

```
POST https://graph.microsoft.com/v1.0/me/sendMail
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "message": {
    "subject": "...",
    "body": { "contentType": "HTML", "content": "..." },
    "toRecipients": [{ "emailAddress": { "address": "..." } }]
  }
}
```

### Settings UI

Add "Email Accounts" section to IntegrationSettings between Calendar and CRM sections. Same card pattern as existing platforms.

### Files to Create/Modify

**New files:**
- `lib/email-sender.ts` - Gmail/Outlook API sending + token refresh
- `app/api/auth/gmail/route.ts` - Gmail OAuth initiation
- `app/api/auth/gmail/callback/route.ts` - Gmail OAuth callback
- `app/api/auth/outlook/route.ts` - Outlook OAuth initiation
- `app/api/auth/outlook/callback/route.ts` - Outlook OAuth callback
- `app/api/integrations/gmail/disconnect/route.ts` - Disconnect Gmail
- `app/api/integrations/outlook/disconnect/route.ts` - Disconnect Outlook

**Modified files:**
- `lib/db/schema.ts` - Add emailConnections table
- `app/api/drafts/send/route.ts` - Check for connected email
- `components/dashboard/IntegrationSettings.tsx` - Add email category
- `app/actions/checkPlatformConnections.ts` - Add email status checks
