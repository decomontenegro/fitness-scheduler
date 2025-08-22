import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard Trainer | FitScheduler',
  description: 'Painel de controle completo para personal trainers - gerencie clientes, agendamentos e receitas',
};

export default function TrainerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}