import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { userOnboarding } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getDraftStats } from '@/lib/dashboard-queries';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    console.log('[ONBOARDING-GATE] No user, redirecting to sign-in');
    redirect('/sign-in');
  }

  // Fetch user info, onboarding status, and draft stats in parallel
  const [user, onboardingResult, stats] = await Promise.all([
    currentUser(),
    db
      .select({
        completedAt: userOnboarding.completedAt,
        currentStep: userOnboarding.currentStep,
      })
      .from(userOnboarding)
      .where(eq(userOnboarding.clerkId, userId))
      .limit(1)
      .catch((error) => {
        console.error('[ONBOARDING-GATE] Database error:', error);
        return [] as { completedAt: Date | null; currentStep: number }[];
      }),
    getDraftStats().catch(() => ({ total: 0, generated: 0, sent: 0, failed: 0, avgCost: 0, avgLatency: 0 })),
  ]);

  const firstName = user?.firstName || 'there';
  const pendingDrafts = stats.generated;

  const onboarding = onboardingResult[0];
  const onboardingIncomplete = !onboarding || !onboarding.completedAt;
  const currentStep = onboarding?.currentStep ?? 1;

  return (
    <DashboardLayoutClient
      onboardingIncomplete={onboardingIncomplete}
      onboardingStep={currentStep}
    >
      <DashboardShell firstName={firstName} pendingDrafts={pendingDrafts}>
        {children}
      </DashboardShell>
    </DashboardLayoutClient>
  );
}
