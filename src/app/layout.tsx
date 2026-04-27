import type { Metadata } from "next";
import Providers from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Response | AI Booking Automation Assistant",
  description:
    "First Response helps appointment-based businesses convert chats into confirmed bookings and repeat customers.",
  icons: {
    icon: "/logo2.png",
    shortcut: "/logo2.png",
    apple: "/logo2.png",
  },
  other: {
    "facebook-domain-verification": "s31yilk4kf7csov93uu2q32ymiys6q",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
