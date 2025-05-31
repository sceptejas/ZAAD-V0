"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { getReadOnlyContract, getContract, formatEther, type PitchCard } from "@/lib/web3"
import { Loader2, Users, Target, Sparkles } from "lucide-react"

interface PitchWithId extends PitchCard {
  id: number
}

export default function MarketplacePage() {
  const [pitches, setPitches] = useState<PitchWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<number | null>(null)
  const [shareAmounts, setShareAmounts] = useState<{ [key: number]: string }>({})
  const { toast } = useToast()
  const { isConnected } = useWallet()

  const loadPitches = async () => {
    try {
      const contract = getReadOnlyContract()
      if (!contract) {
        setLoading(false)
        return
      }

      // First check if we can call the contract
      const publishedIds = await contract.getPublishedPitches()

      if (!publishedIds || publishedIds.length === 0) {
        setPitches([])
        setLoading(false)
        return
      }

      const pitchesData = []

      // Load pitches one by one with individual error handling
      for (const id of publishedIds) {
        try {
          const pitch = await contract.getPitchCard(id)
          if (pitch && pitch.creator) {
            pitchesData.push({
              ...pitch,
              id: Number(id),
              targetAmount: pitch.targetAmount || 0n,
              totalShares: pitch.totalShares || 0n,
              pricePerShare: pitch.pricePerShare || 0n,
              revenueSharePercentage: pitch.revenueSharePercentage || 0n,
              totalRaised: pitch.totalRaised || 0n,
              sharesSold: pitch.sharesSold || 0n,
            })
          }
        } catch (error) {
          console.warn(`Failed to load pitch ${id}:`, error)
          continue
        }
      }

      setPitches(pitchesData)
    } catch (error) {
      console.error("Failed to load pitches:", error)
      setPitches([]) // Set empty array instead of showing error
    } finally {
      setLoading(false)
    }
  }

  const purchaseShares = async (pitchId: number, shares: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to purchase shares",
        variant: "destructive",
      })
      return
    }

    if (!shares || Number.parseInt(shares) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number of shares",
        variant: "destructive",
      })
      return
    }

    try {
      setPurchasing(pitchId)
      const contract = await getContract()
      const pitch = pitches.find((p) => p.id === pitchId)
      if (!pitch) return

      const totalCost = BigInt(shares) * pitch.pricePerShare

      const tx = await contract.purchaseShares(pitchId, shares, {
        value: totalCost,
      })

      toast({
        title: "Transaction submitted",
        description: "Your purchase is being processed...",
      })

      await tx.wait()

      toast({
        title: "Success!",
        description: `Successfully purchased ${shares} shares`,
      })

      setShareAmounts((prev) => ({ ...prev, [pitchId]: "" }))
      loadPitches()
    } catch (error: any) {
      console.error("Purchase failed:", error)
      toast({
        title: "Purchase failed",
        description: error.message || "Transaction failed",
        variant: "destructive",
      })
    } finally {
      setPurchasing(null)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 10000) // 10 second timeout

    loadPitches().finally(() => {
      clearTimeout(timeoutId)
    })

    return () => clearTimeout(timeoutId)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-lavender-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-lavender-400 to-neon-pink bg-clip-text text-transparent">
          Investment Marketplace
        </h1>
        <p className="text-muted-foreground">Discover and invest in exciting creator projects</p>
      </div>

      {pitches.length === 0 ? (
        <Card className="neon-glow border-lavender-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-lavender-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-lavender-200">No pitches available</h3>
            <p className="text-muted-foreground text-center">
              Be the first to create a pitch and start your crowdfunding journey!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch) => {
            const progress =
              pitch.targetAmount && pitch.targetAmount > 0n
                ? Number((pitch.totalRaised * 100n) / pitch.targetAmount)
                : 0

            const sharesAvailable = Number(pitch.totalShares - pitch.sharesSold)
            const shareAmount = shareAmounts[pitch.id] || ""
            const totalCost =
              shareAmount && pitch.pricePerShare ? formatEther(BigInt(shareAmount) * pitch.pricePerShare) : "0"

            return (
              <Card
                key={pitch.id}
                className="flex flex-col border-lavender-700 hover:border-lavender-500 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-lavender-200">{pitch.title}</CardTitle>
                      <Badge variant="secondary" className="bg-neon-pink/20 text-neon-pink border-neon-pink/30">
                        {pitch.revenueSharePercentage.toString()}% Revenue Share
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3">{pitch.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="text-lavender-300">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-gradient-to-r from-lavender-600 to-neon-pink h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatEther(pitch.totalRaised)} MON raised</span>
                      <span>{formatEther(pitch.targetAmount)} MON target</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-lavender-400" />
                      <div>
                        <p className="font-medium text-lavender-200">{formatEther(pitch.pricePerShare)} MON</p>
                        <p className="text-muted-foreground">per share</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-lavender-400" />
                      <div>
                        <p className="font-medium text-lavender-200">{sharesAvailable}</p>
                        <p className="text-muted-foreground">available</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-lavender-700">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-lavender-200">Shares to buy</label>
                      <Input
                        type="number"
                        placeholder="Enter number of shares"
                        value={shareAmount}
                        onChange={(e) =>
                          setShareAmounts((prev) => ({
                            ...prev,
                            [pitch.id]: e.target.value,
                          }))
                        }
                        max={sharesAvailable}
                        min="1"
                        className="border-lavender-600 focus:border-lavender-400"
                      />
                      {shareAmount && <p className="text-sm text-muted-foreground">Total cost: {totalCost} MON</p>}
                    </div>

                    <Button
                      onClick={() => purchaseShares(pitch.id, shareAmount)}
                      disabled={!shareAmount || purchasing === pitch.id || !isConnected}
                      className="w-full bg-gradient-to-r from-lavender-600 to-neon-pink hover:from-lavender-700 hover:to-neon-pink/90"
                    >
                      {purchasing === pitch.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Purchasing...
                        </>
                      ) : (
                        "Buy Shares"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
