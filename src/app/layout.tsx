import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motion Renderer",
  description: "Motion Canvas video rendering engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}  