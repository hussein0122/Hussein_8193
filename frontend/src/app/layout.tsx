import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "منصة | منصة الامتحانات التعليمية",
  description: "منصة عربية للامتحانات والتقييم ومتابعة تقدم الطلاب"
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
