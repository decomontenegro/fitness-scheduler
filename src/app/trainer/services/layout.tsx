import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Serviços | Área do Trainer',
  description: 'Configure seus serviços, preços e modalidades de treino',
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}