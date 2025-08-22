import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Contato | FitScheduler',
  description: 'Entre em contato com nossa equipe de suporte',
  openGraph: {
    title: 'Contato - FitScheduler',
    description: 'Fale conosco e tire suas dúvidas',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}