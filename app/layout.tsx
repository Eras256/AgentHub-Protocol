import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { AvalancheFuji } from "@thirdweb-dev/chains";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChatbot from "@/components/chatbot/AIChatbot";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

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
        <ThirdwebProvider
          activeChain={AvalancheFuji}
          clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
          supportedChains={[AvalancheFuji]}
        >
          <Providers>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <AIChatbot />
          </Providers>
        </ThirdwebProvider>
      </body>
    </html>
  );
}

