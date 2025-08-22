import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Notificações | FitScheduler',
  description: 'Fique por dentro de todas as suas notificações e alertas importantes',
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}