import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";

import { TRPCReactProvider } from "~/trpc/react";
import { Providers } from "./providers";
import DynamicTitle from "./Utils/Header";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const iranSans = localFont({
  src: [
    {
      path: "../../public/fonts/IRANSansXFaNum-Thin.woff",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-UltraLight.woff",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-DemiBold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-ExtraBold.woff",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Black.woff",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-iransans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${iranSans.variable}`}>
      <body className="bg-[#F9FAFB]">
        <Providers>
          <TRPCReactProvider>
            <DynamicTitle />
            {children}
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
