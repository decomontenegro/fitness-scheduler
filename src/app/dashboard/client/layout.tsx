import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard Cliente | FitScheduler',
  description: 'Acompanhe seus treinos, agendamentos e evolução com seu personal trainer',
};

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}