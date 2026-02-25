/**
 * Shared test helpers
 *
 * Provides mock factories for NextRequest, database functions,
 * and other commonly needed test utilities.
 */

/**
 * Create a mock NextRequest-like object for API route testing.
 *
 * @param body - Request body (will be JSON-serialized)
 * @param headers - Optional headers to include
 * @param method - HTTP method (defaults to POST)
 * @returns A minimal Request-compatible object
 */
export function createMockRequest(
  body: unknown,
  headers: Record<string, string> = {},
  method = 'POST'
): Request {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);

  return new Request('http://localhost:3000/api/test', {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: method === 'GET' ? undefined : bodyStr,
  });
}

/**
 * Create a mock database with common query methods.
 * Returns chainable mock functions that mirror Drizzle ORM patterns.
 */
export function createMockDb() {
  const mockReturning = { returning: () => Promise.resolve([{ id: 'mock-id' }]) };

  const mockWhere = {
    where: () => ({
      ...mockReturning,
      orderBy: () => ({
        limit: () => Promise.resolve([]),
      }),
      limit: () => Promise.resolve([]),
      set: () => mockReturning,
    }),
  };

  const mockFrom = {
    from: () => ({
      ...mockWhere,
      orderBy: () => ({
        limit: () => Promise.resolve([]),
      }),
    }),
  };

  return {
    select: () => mockFrom,
    insert: () => ({
      values: () => mockReturning,
    }),
    update: () => ({
      set: () => mockWhere,
    }),
    delete: () => mockWhere,
  };
}

/**
 * Sample VTT content for transcript parser testing.
 */
export const SAMPLE_VTT = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
John Smith: Hello everyone, welcome to the meeting.

2
00:00:05.500 --> 00:00:10.000
Jane Doe: Thanks John, glad to be here.

3
00:00:10.500 --> 00:00:15.000
John Smith: Let's discuss the project timeline.

4
00:00:15.500 --> 00:00:22.000
Jane Doe: Sure, I think we need to review the budget and pricing first.
`;

/**
 * Sample VTT without speaker names.
 */
export const SAMPLE_VTT_NO_SPEAKERS = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
Hello everyone, welcome to the meeting.

2
00:00:05.500 --> 00:00:10.000
Thanks, glad to be here.
`;

/**
 * Sample sales call transcript for meeting type detection.
 */
export const SAMPLE_SALES_TRANSCRIPT = `
John Smith: Thanks for taking the time for this demo today.
Jane Doe: Of course, we've been looking at various alternatives.
John Smith: Let me show you our pricing. The proposal includes a trial period.
Jane Doe: What's the budget for the proof of concept?
John Smith: We can discuss the timeline to purchase. Who are the decision makers on your end?
Jane Doe: I'll loop in our stakeholders. Can you send over the contract terms?
`;

/**
 * Sample internal sync transcript for meeting type detection.
 */
export const SAMPLE_INTERNAL_TRANSCRIPT = `
Alice: Good morning, let's do our standup.
Bob: I'm working on the sprint backlog, velocity is looking good.
Alice: Any blockers?
Bob: Blocked on the API review. Story points are at 13.
Alice: Let's check in on that in the team meeting next week.
`;

/**
 * Sample technical discussion transcript.
 */
export const SAMPLE_TECHNICAL_TRANSCRIPT = `
Dev A: We need to redesign the architecture for the API endpoint.
Dev B: I agree. The database schema migration is overdue.
Dev A: Let's focus on the deployment pipeline and CI/CD improvements.
Dev B: I found a bug in the authentication flow. Need to do some debugging.
Dev A: Should we submit a pull request for the performance optimization?
`;
