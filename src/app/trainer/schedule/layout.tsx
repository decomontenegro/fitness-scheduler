import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Agenda | Área do Trainer',
  description: 'Visualize e gerencie sua agenda de treinos e compromissos',
};

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}