import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Agendamentos | FitScheduler',
  description: 'Visualize e gerencie todos os seus agendamentos de treino em um só lugar',
  openGraph: {
    title: 'Agendamentos - FitScheduler',
    description: 'Sistema completo de agendamento para personal trainers',
  },
};

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}