import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProfiTest KZ — Узнай свою профессию",
  description: "Бесплатный тест профориентации для казахстанских школьников 9-11 класса. 62 специальности, реальные гранты МОН 2024, AI-анализ.",
  keywords: "профориентация, тест, Казахстан, школьник, ЕНТ, гранты, специальность, профессия",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
