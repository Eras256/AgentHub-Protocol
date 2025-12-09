import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChatbot from "@/components/chatbot/AIChatbot";
import { ClientProviders } from "@/components/providers/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "AgentHub Protocol | Autonomous AI on Avalanche",
  description:
    "First complete infrastructure where AI agents can pay, operate, and build reputation autonomously",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white`}>
        <ClientProviders>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <AIChatbot />
        </ClientProviders>
      </body>
    </html>
  );
}

