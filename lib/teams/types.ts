/**
 * Microsoft Teams / Graph API Types
 *
 * Types for Teams change notifications and transcript handling.
 */

/**
 * Graph API change notification payload
 * Received when a transcript or recording is created
 */
export interface GraphChangeNotification {
  value: ChangeNotificationItem[];
  validationTokens?: string[];
}

/**
 * Individual notification item in the change notification
 */
export interface ChangeNotificationItem {
  subscriptionId: string;
  subscriptionExpirationDateTime: string;
  changeType: 'created' | 'updated' | 'deleted';
  resource: string;
  resourceData: ResourceData;
  clientState?: string;
  tenantId: string;
  encryptedContent?: EncryptedContent;
}

/**
 * Resource data included in notification
 */
export interface ResourceData {
  id: string;
  '@odata.type': string;
  '@odata.id': string;
}

/**
 * Encrypted content when includeResourceData is true
 */
export interface EncryptedContent {
  data: string;
  dataKey: string;
  encryptionCertificateId: string;
  encryptionCertificateThumbprint: string;
}

/**
 * Decrypted transcript notification payload
 */
export interface TranscriptNotificationPayload {
  id: string;
  meetingId: string;
  callId?: string;
  transcriptContentUrl: string;
  createdDateTime: string | null;
  endDateTime?: string;
  contentCorrelationId?: string;
  meetingOrganizer?: {
    user: {
      userIdentityType: string;
      id: string;
      tenantId: string;
      displayName?: string;
    };
  };
}

/**
 * Transcript metadata from Graph API
 */
export interface TranscriptMetadata {
  id: string;
  meetingId: string;
  callId?: string;
  createdDateTime: string;
  contentCorrelationId?: string;
  transcriptContentUrl: string;
  meetingOrganizer?: {
    user: {
      id: string;
      displayName?: string;
      tenantId?: string;
    };
  };
}

/**
 * Online meeting details from Graph API
 */
export interface OnlineMeeting {
  id: string;
  subject?: string;
  startDateTime?: string;
  endDateTime?: string;
  joinWebUrl?: string;
  participants?: {
    organizer?: {
      identity?: {
        user?: {
          id: string;
          displayName?: string;
        };
      };
    };
    attendees?: Array<{
      identity?: {
        user?: {
          id: string;
          displayName?: string;
        };
      };
    }>;
  };
  chatInfo?: {
    threadId: string;
  };
}

/**
 * Subscription validation request
 * Microsoft sends this to validate webhook URL
 */
export interface SubscriptionValidationRequest {
  validationToken: string;
}

/**
 * Graph API error response
 */
export interface GraphApiError {
  error: {
    code: string;
    message: string;
    innerError?: {
      'request-id': string;
      date: string;
    };
  };
}

/**
 * OAuth2 token response from Azure AD
 */
export interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  ext_expires_in?: number;
}

/**
 * Processed Teams event for internal use
 */
export interface ProcessedTeamsEvent {
  eventType: 'transcript.created' | 'recording.created';
  subscriptionId: string;
  tenantId: string;
  resource: string;
  resourceId: string;
  meetingId?: string;
  organizerId?: string;
  timestamp: Date;
}
