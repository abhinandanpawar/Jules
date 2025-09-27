import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Jules Command Center | Your AI-Powered Task Board',
  description: 'A unified Kanban board for managing Jules, the AI software engineer, across all your projects.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-gray-900 text-gray-100 antialiased`}>
        {children}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#2d3748', // gray-700
              color: '#f7fafc', // gray-100
            },
          }}
        />
      </body>
    </html>
  );
}