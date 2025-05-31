"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { WalletConnect } from "./wallet-connect"
import { Button } from "@/components/ui/button"
import { Home, Plus, Settings, TrendingUp, DollarSign } from "lucide-react"

const navigation = [
  { name: "Marketplace", href: "/", icon: Home },
  { name: "Create Pitch", href: "/create", icon: Plus },
  { name: "My Pitches", href: "/dashboard", icon: Settings },
  { name: "My Investments", href: "/investments", icon: TrendingUp },
  { name: "Revenue", href: "/revenue", icon: DollarSign },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 gradient-bg">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono font-bold text-xl text-gray-300">ZAAD</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Button key={item.href} variant={pathname === item.href ? "default" : "ghost"} size="sm" asChild>
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>

        <WalletConnect />
      </div>
    </header>
  )
}
