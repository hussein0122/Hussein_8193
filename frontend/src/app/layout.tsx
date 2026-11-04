import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quizora | التعليم والاختبارات",
  description: "منصة عربية لإدارة المواد والاختبارات الإلكترونية ومتابعة أداء الطلاب",
  applicationName: "Quizora",
  appleWebApp: { capable: true, title: "Quizora", statusBarStyle: "default" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
