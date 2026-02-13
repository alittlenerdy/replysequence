import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { userOnboarding } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient';

// Force dynamic rendering - don't cache this layout
export const dynamic = 'force-dynamic';

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

  // Check onboarding status server-side with error handling
  let onboardingIncomplete = true;
  let currentStep = 1;

  try {
    const [onboarding] = await db
      .select({
        completedAt: userOnboarding.completedAt,
        currentStep: userOnboarding.currentStep,
      })
      .from(userOnboarding)
      .where(eq(userOnboarding.clerkId, userId))
      .limit(1);

    onboardingIncomplete = !onboarding || !onboarding.completedAt;
    currentStep = onboarding?.currentStep ?? 1;

    if (onboardingIncomplete) {
      console.log('[ONBOARDING-GATE] Onboarding incomplete, showing banner:', {
        userId,
        hasRecord: !!onboarding,
        currentStep,
      });
    } else {
      console.log('[ONBOARDING-GATE] User completed onboarding, showing dashboard:', userId);
    }
  } catch (error) {
    console.error('[ONBOARDING-GATE] Database error, defaulting to incomplete:', error);
    // Default to showing the dashboard with incomplete status on error
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
