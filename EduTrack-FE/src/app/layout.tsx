import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/lib/query/app-providers";

export const metadata: Metadata = {
  title: "EduTrack",
  description: "Quản lý lớp học, điểm danh và học phí",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
