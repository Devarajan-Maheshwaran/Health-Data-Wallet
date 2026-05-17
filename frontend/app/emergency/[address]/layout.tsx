/**
 * Emergency QR scan layout — intentionally minimal.
 * NO FloatingNav, NO AuthGate, NO OnboardingSheet, NO wallet required.
 * Paramedics and first responders open this page directly via QR scan.
 *
 * IMPORTANT: Do NOT add <html> or <body> here — only the root layout.tsx
 * can have those tags in Next.js App Router. Adding them here causes 404s.
 */
export default function EmergencyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
