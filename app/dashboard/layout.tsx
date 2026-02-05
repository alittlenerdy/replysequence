import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { userOnboarding } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient';

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

  // Check onboarding status server-side
  const [onboarding] = await db
    .select({
      completedAt: userOnboarding.completedAt,
      currentStep: userOnboarding.currentStep,
    })
    .from(userOnboarding)
    .where(eq(userOnboarding.clerkId, userId))
    .limit(1);

  // If no record or not completed, redirect to onboarding
  if (!onboarding || !onboarding.completedAt) {
    console.log('[ONBOARDING-GATE] Redirecting to onboarding:', {
      userId,
      hasRecord: !!onboarding,
      completedAt: onboarding?.completedAt,
      currentStep: onboarding?.currentStep,
    });
    redirect('/onboarding');
  }

  console.log('[ONBOARDING-GATE] User completed onboarding, showing dashboard:', userId);

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
