import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مِنصّة | التعليم والاختبارات",
  description: "منصة عربية لإدارة المواد والاختبارات الإلكترونية ومتابعة أداء الطلاب",
  applicationName: "مِنصّة",
  appleWebApp: { capable: true, title: "مِنصّة", statusBarStyle: "default" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
