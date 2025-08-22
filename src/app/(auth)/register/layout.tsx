import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Cadastro | FitScheduler',
  description: 'Crie sua conta gratuita no FitScheduler e comece a gerenciar seus treinos hoje mesmo',
  openGraph: {
    title: 'Cadastre-se - FitScheduler',
    description: 'Plataforma completa para personal trainers e clientes',
    type: 'website',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}