import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Mensagens | FitScheduler',
  description: 'Chat e comunicação direta com seus trainers e clientes',
  openGraph: {
    title: 'Mensagens - FitScheduler',
    description: 'Comunicação em tempo real na plataforma',
  },
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}