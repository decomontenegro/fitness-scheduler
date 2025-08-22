import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitScheduler - Plataforma para Personal Trainers",
  description: "A plataforma completa para personal trainers modernos. Agende sessões, gerencie clientes e aumente seu faturamento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased h-full bg-background text-foreground`}
      >
        <ErrorBoundary>
          <LoadingProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
                <LoadingOverlay />
                <ToastProvider />
              </NotificationProvider>
            </AuthProvider>
          </LoadingProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
