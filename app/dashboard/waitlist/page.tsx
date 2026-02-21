import { WaitlistAdmin } from '@/components/dashboard/WaitlistAdmin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Waitlist | ReplySequence',
  description: 'Manage waitlist entries and send invites',
};

export default function WaitlistPage() {
  return <WaitlistAdmin />;
}
