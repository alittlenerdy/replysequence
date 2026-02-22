/**
 * Sample meeting transcripts for the "Try a Sample" onboarding feature.
 * Users can generate a real AI draft from these to see ReplySequence in action
 * without waiting for a real meeting.
 */

export interface SampleMeeting {
  id: string;
  topic: string;
  attendees: string[];
  duration: number; // minutes
  transcript: string;
}

export const SAMPLE_MEETINGS: SampleMeeting[] = [
  {
    id: 'sample-sales-discovery',
    topic: 'Discovery Call - Acme Corp Partnership',
    attendees: ['You', 'Sarah Chen (VP Sales, Acme Corp)', 'Mike Torres (Solutions Architect, Acme Corp)'],
    duration: 28,
    transcript: `You: Thanks for taking the time today, Sarah and Mike. I know you're both busy, so I want to make sure we cover everything you need.

Sarah: Of course! We've been evaluating a few solutions and your platform came up in a conversation with a colleague at TechCrunch Disrupt last month.

You: That's great to hear. Before I dive into anything, I'd love to understand what's driving the evaluation on your end. What does the current workflow look like after your sales calls?

Sarah: Honestly, it's a mess. Our reps finish a call and then spend 20 to 30 minutes writing follow-up emails. By the time they send them, it's often the next day. We're losing momentum.

Mike: From my side, the CRM data is always stale. Reps forget to log notes, action items fall through the cracks. We tried recording tools before but they just give us transcripts. Nobody wants to read a 45-minute transcript to find the three things that matter.

You: That's exactly the problem we solve. ReplySequence connects to your Zoom, Teams, or Meet accounts. After every call, it generates a ready-to-send follow-up email in about 8 seconds. Not a summary — an actual email your rep can review, tweak if needed, and send.

Sarah: Eight seconds? What does the output actually look like?

You: It pulls out the key discussion points, any commitments made, action items with owners, and next steps. Then it drafts an email in the rep's voice. We also sync everything to your CRM automatically — HubSpot, Salesforce, whatever you're using.

Mike: We're on HubSpot. Does it update deal records or just create activity logs?

You: Both. It creates a detailed activity log with the meeting summary and action items, and it can update deal properties like next step date, deal stage notes, and custom fields. We also integrate with Google Sheets and Airtable if you need data flowing elsewhere.

Sarah: What about pricing? We have a team of 12 reps.

You: Our Team plan is $39 per user per month. For 12 reps, that's $468 per month. But if each rep saves even 30 minutes a day on follow-ups — which is conservative based on what you described — that's 60 hours a week back to selling.

Sarah: That math works. Mike, what do you think about a pilot?

Mike: I'd want to see it with our actual calls first. Can we do a trial with maybe 3 or 4 reps?

You: Absolutely. I'll set up a 14-day pilot for your team. I just need the email addresses of the reps who want to participate, and they can connect their Zoom accounts in about 2 minutes.

Sarah: Perfect. Let's plan on that. Can you send me a summary of what we discussed today and the next steps?

You: I'll have that in your inbox in about 30 seconds after we hang up. That's the product in action.

Sarah: Ha! I love it. Looking forward to seeing the pilot results.

You: Me too. I'll send over the pilot setup details along with the follow-up. Thanks again, Sarah and Mike. Talk soon.`,
  },
  {
    id: 'sample-team-standup',
    topic: 'Weekly Team Standup - Product & Engineering',
    attendees: ['You', 'Alex Rivera (Engineering Lead)', 'Jordan Park (Product Manager)', 'Priya Sharma (Designer)'],
    duration: 15,
    transcript: `You: Alright, let's keep this tight. Quick round — what shipped last week, what's on deck this week, any blockers?

Alex: Last week we shipped the new notification system and fixed the OAuth token refresh bug that was causing session drops. This week I'm focused on the API rate limiting work and the database migration for the analytics overhaul.

You: Nice. Any blockers on the migration?

Alex: One thing — I need Priya to finalize the analytics dashboard design by Wednesday so I know what queries we need to optimize for. If the layout changes after I build the indexes, we'll have to redo them.

Priya: I can have the final mocks ready by Tuesday evening. I'm almost done, just working through the mobile responsive version. I'll share a Figma link tomorrow for early feedback.

You: Perfect. Jordan, what about the product side?

Jordan: Three things. First, the beta feedback from last week's cohort was really positive — NPS of 47. Main request was better email template customization, which is already on the roadmap for next sprint. Second, I'm finalizing the pricing page copy with marketing. Third, we need to decide on the free tier limits before the public launch. I'm proposing 5 drafts per month.

You: Five feels right. Let's go with that unless anyone objects. What about the launch timeline?

Jordan: We're targeting March 15th for public beta. That gives us three more weeks. The critical path is Alex's analytics work and the onboarding flow improvements Priya is designing.

Priya: For onboarding, I'm redesigning the first-run experience. The current flow has too many steps. I want to get users to their first draft in under 3 minutes. I'll have wireframes by Thursday.

You: Love that goal. Alex, can you estimate the engineering effort once Priya shares the wireframes?

Alex: Yeah, I'll scope it Friday. Shouldn't be more than 2 to 3 days of work if we keep it simple.

You: Great. So action items: Priya shares analytics mocks by Tuesday, wireframes by Thursday. Alex scopes onboarding engineering on Friday. Jordan confirms free tier limits and pricing copy by end of week. Anything else?

Jordan: One more thing — the customer from Meridian Health wants a demo on Thursday. Can you join, Alex? They have technical questions about our security architecture.

Alex: Sure, send me the invite.

You: Good. Let's reconvene same time next week. Thanks everyone.`,
  },
];

/** Pick a random sample meeting */
export function getRandomSampleMeeting(): SampleMeeting {
  return SAMPLE_MEETINGS[Math.floor(Math.random() * SAMPLE_MEETINGS.length)];
}

/** Get a specific sample meeting by ID */
export function getSampleMeeting(id: string): SampleMeeting | undefined {
  return SAMPLE_MEETINGS.find(m => m.id === id);
}
