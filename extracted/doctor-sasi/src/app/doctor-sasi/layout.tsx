import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doctor Sasi — Clinical Skincare',
  description: 'Beneath lies your glow. Discover clinical skincare by Doctor Sasi.',
};

export default function DoctorSasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
