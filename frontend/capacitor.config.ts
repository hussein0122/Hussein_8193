import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.quizora.app",
  appName: "Quizora",
  webDir: "www",
  server: {
    url: "https://hussein-exam-platform.vercel.app",
    cleartext: false,
    androidScheme: "https"
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
