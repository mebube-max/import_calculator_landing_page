import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "China Import Profit Calculator | Zolan", description: "Know what your China order will really cost before you pay. Estimate landed costs, contribution and cash recovery.", icons: { icon: "/mark.png" } };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}