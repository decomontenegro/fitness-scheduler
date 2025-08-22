import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Agenda | FitScheduler',
  description: 'Visualize sua agenda completa de treinos e compromissos',
};

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}