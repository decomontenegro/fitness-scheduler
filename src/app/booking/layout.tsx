import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Agendar Sessão | FitScheduler',
  description: 'Agende sua próxima sessão de treino com os melhores personal trainers',
  openGraph: {
    title: 'Agendar Sessão - FitScheduler',
    description: 'Sistema de agendamento fácil e rápido',
  },
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}