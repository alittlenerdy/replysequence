import { MeetingsListView } from '@/components/dashboard/MeetingsListView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Meetings | ReplySequence',
  description: 'View all your captured meetings and their follow-up drafts',
};

export default function MeetingsPage() {
  return <MeetingsListView />;
}
