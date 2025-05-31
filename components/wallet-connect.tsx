"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/hooks/use-wallet"
import { truncateAddress } from "@/lib/web3"
import { Wallet, LogOut } from "lucide-react"

export function WalletConnect() {
  const { account, isConnected, isConnecting, connect, disconnect, balance } = useWallet()

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="flex items-center gap-2 bg-lavender-900/50 text-lavender-200 border-lavender-700"
        >
          <Wallet className="h-3 w-3" />
          {truncateAddress(account)}
        </Badge>
        <Badge variant="outline" className="border-lavender-600 text-lavender-300">
          {Number.parseFloat(balance).toFixed(4)} MON
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="flex items-center gap-2 border-lavender-600 text-lavender-300 hover:bg-lavender-800/50"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 bg-gradient-to-r from-lavender-600 to-neon-pink hover:from-lavender-700 hover:to-neon-pink/90"
    >
      <Wallet className="h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
