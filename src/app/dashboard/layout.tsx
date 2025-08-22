import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: '%s | Dashboard FitScheduler',
    default: 'Dashboard | FitScheduler',
  },
  description: 'Gerencie seus treinos, agendamentos e clientes em um só lugar',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}