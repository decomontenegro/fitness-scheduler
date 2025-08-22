import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: '%s | FitScheduler Auth',
    default: 'Autenticação | FitScheduler',
  },
  description: 'Acesse sua conta FitScheduler para gerenciar seus treinos e agendamentos',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}