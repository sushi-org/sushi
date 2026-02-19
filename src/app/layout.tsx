import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clink | AI Booking Automation Assistant",
  description:
    "Clink helps appointment-based businesses convert chats into confirmed bookings and repeat customers.",
  icons: {
    icon: "/logo2.png",
    shortcut: "/logo2.png",
    apple: "/logo2.png",
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
        {children}
      </body>
    </html>
  );
}
