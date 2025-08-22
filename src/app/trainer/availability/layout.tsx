import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Disponibilidade | Área do Trainer',
  description: 'Configure seus horários disponíveis para agendamentos',
};

export default function AvailabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}