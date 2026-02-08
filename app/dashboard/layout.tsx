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

  // Determine if onboarding is incomplete (show banner instead of redirecting)
  const onboardingIncomplete = !onboarding || !onboarding.completedAt;
  const currentStep = onboarding?.currentStep ?? 1;

  if (onboardingIncomplete) {
    console.log('[ONBOARDING-GATE] Onboarding incomplete, showing banner:', {
      userId,
      hasRecord: !!onboarding,
      currentStep,
    });
  } else {
    console.log('[ONBOARDING-GATE] User completed onboarding, showing dashboard:', userId);
  }

  return (
    <DashboardLayoutClient
      onboardingIncomplete={onboardingIncomplete}
      onboardingStep={currentStep}
    >
      {children}
    </DashboardLayoutClient>
  );
}
