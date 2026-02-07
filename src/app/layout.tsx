import "./globals.css";
import { theme } from "./theme";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import {
  MantineProvider,
  mantineHtmlProps,
  ColorSchemeScript,
} from "@mantine/core";
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OctoPush CRM Solutions",
  description: "OctoPush CRM Solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={`${openSans.variable} antialiased`}>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  );
}
