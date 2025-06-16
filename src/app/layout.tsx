import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RateLimitProvider } from "@/contexts/RateLimitContext";
import { UserNameProvider } from "@/contexts/UserNameContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SoulVerse - Conectando con la Biblia",
  description: "Un espacio para conectar con la Biblia, explorar tus emociones y recibir guía espiritual.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <LanguageProvider>
          <UserNameProvider>
            <RateLimitProvider>
              <Navbar />
              {children}
              <Footer />
            </RateLimitProvider>
          </UserNameProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
