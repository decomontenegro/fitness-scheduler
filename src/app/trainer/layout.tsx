import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: '%s | Área do Trainer',
    default: 'Área do Trainer | FitScheduler',
  },
  description: 'Ferramentas exclusivas para personal trainers gerenciarem sua carreira',
};

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}