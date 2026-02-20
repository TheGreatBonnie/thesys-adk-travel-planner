import type { Metadata } from "next";
import "@crayonai/react-ui/styles/index.css";
// import "@thesysai/genui-sdk/styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Planner",
  description: "ADK + Thesys travel planner assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
