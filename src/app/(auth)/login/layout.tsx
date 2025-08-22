import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Login | FitScheduler',
  description: 'Faça login em sua conta FitScheduler para acessar seus treinos e agendamentos',
  openGraph: {
    title: 'Login - FitScheduler',
    description: 'Acesse sua conta de personal trainer ou cliente',
    type: 'website',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}