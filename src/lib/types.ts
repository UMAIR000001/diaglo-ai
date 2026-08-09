/** Route path constants used across the app */
export const ROUTES = {
  AUTH: "/auth",
  ONBOARDING_STEP1: "/onboarding/step-1",
  ONBOARDING_STEP2: "/onboarding/step-2",
  ONBOARDING_STEP3: "/onboarding/step-3",
  ONBOARDING_STEP4: "/onboarding/step-4",
  DASHBOARD: "/dashboard",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];