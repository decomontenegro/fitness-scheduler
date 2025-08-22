import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Analytics | FitScheduler',
  description: 'Análises detalhadas e métricas de desempenho do seu negócio fitness',
  openGraph: {
    title: 'Analytics - FitScheduler',
    description: 'Insights e relatórios para personal trainers',
  },
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}