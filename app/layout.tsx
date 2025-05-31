import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/hooks/use-wallet"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "ZAAD - Creator Crowdfunding Platform",
  description: "A Web3 crowdfunding platform for creators on Monad",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${jetbrainsMono.variable} bg-background text-foreground`}>
        <WalletProvider>
          <Navigation />
          <main className="container mx-auto py-8 min-h-screen">{children}</main>
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  )
}
