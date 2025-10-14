import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ConfettiProvider } from '@/hooks/use-confetti';

export const metadata: Metadata = {
  title: 'Game day',
  description: 'Test your emotional intelligence in match-day scenarios.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=TikTok+Sans:wght@400;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
        <ConfettiProvider>
            {children}
            <Toaster />
        </ConfettiProvider>
      </body>
    </html>
  );
}
