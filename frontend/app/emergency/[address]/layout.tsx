export default function EmergencyLayout({ children }: { children: React.ReactNode }) {
  // This layout intentionally has NO FloatingNav, NO AuthGate, NO OnboardingSheet.
  // Emergency pages are publicly accessible by paramedics and first responders
  // who scan a QR code — they must NEVER be required to connect a wallet.
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#1a0000', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
