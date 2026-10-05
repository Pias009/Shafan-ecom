// Append to src/lib/datalayer.ts (uses its existing pushToDataLayer helper)

export function trackSesiOnboardingShown(): void {
  pushToDataLayer({ event: 'sesi_onboarding_shown' });
}

export function trackSesiOnboardingChoice(choice: 'talk' | 'explore' | 'close'): void {
  pushToDataLayer({ event: 'sesi_onboarding_choice', choice });
}
