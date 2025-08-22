import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Relatórios | FitScheduler',
  description: 'Relatórios completos sobre treinos, clientes e faturamento',
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}