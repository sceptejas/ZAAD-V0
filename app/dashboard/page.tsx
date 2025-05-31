"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { getReadOnlyContract, getContract, formatEther, type PitchCard } from "@/lib/web3"
import { Loader2, Settings, Eye, EyeOff } from "lucide-react"

interface PitchWithId extends PitchCard {
  id: number
}

export default function DashboardPage() {
  const [pitches, setPitches] = useState<PitchWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<number | null>(null)
  const { toast } = useToast()
  const { account, isConnected } = useWallet()

  const loadUserPitches = async () => {
    if (!account) return

    try {
      const contract = getReadOnlyContract()
      if (!contract) return

      // Get all published pitches first
      const publishedIds = await contract.getPublishedPitches()
      const allPitches: PitchWithId[] = []

      // Check published pitches
      for (const id of publishedIds) {
        try {
          const pitch = await contract.getPitchCard(id)
          if (pitch && pitch.creator && pitch.creator.toLowerCase() === account.toLowerCase()) {
            allPitches.push({
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

      // For unpublished pitches, we need to check a range of IDs
      for (let i = 1; i <= 50; i++) {
        try {
          const pitch = await contract.getPitchCard(i)
          if (pitch && pitch.creator && pitch.creator.toLowerCase() === account.toLowerCase() && !pitch.isPublished) {
            allPitches.push({
              ...pitch,
              id: i,
              targetAmount: pitch.targetAmount || 0n,
              totalShares: pitch.totalShares || 0n,
              pricePerShare: pitch.pricePerShare || 0n,
              revenueSharePercentage: pitch.revenueSharePercentage || 0n,
              totalRaised: pitch.totalRaised || 0n,
              sharesSold: pitch.sharesSold || 0n,
            })
          }
        } catch (error) {
          continue
        }
      }

      setPitches(allPitches)
    } catch (error) {
      console.error("Failed to load user pitches:", error)
      toast({
        title: "Error",
        description: "Failed to load your pitches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const publishPitch = async (pitchId: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to publish",
        variant: "destructive",
      })
      return
    }

    try {
      setPublishing(pitchId)
      const contract = await getContract()

      const tx = await contract.publishPitchCard(pitchId)

      toast({
        title: "Transaction submitted",
        description: "Your pitch is being published...",
      })

      await tx.wait()

      toast({
        title: "Success!",
        description: "Pitch published successfully",
      })

      loadUserPitches()
    } catch (error: any) {
      console.error("Failed to publish pitch:", error)
      toast({
        title: "Publication failed",
        description: error.message || "Failed to publish pitch",
        variant: "destructive",
      })
    } finally {
      setPublishing(null)
    }
  }

  useEffect(() => {
    if (isConnected && account) {
      loadUserPitches()
    } else {
      setLoading(false)
    }
  }, [account, isConnected])

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground text-center">
            Please connect your wallet to view and manage your pitches
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">My Pitches</h1>
        <p className="text-muted-foreground">Manage your crowdfunding campaigns</p>
      </div>

      {pitches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pitches yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first pitch to start your crowdfunding journey
            </p>
            <Button asChild>
              <a href="/create">Create Pitch</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch) => {
            const progress =
              pitch.targetAmount && pitch.targetAmount > 0n
                ? Number((pitch.totalRaised * 100n) / pitch.targetAmount)
                : 0

            return (
              <Card key={pitch.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{pitch.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={pitch.isPublished ? "default" : "secondary"}>
                          {pitch.isPublished ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Draft
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline">ID: {pitch.id}</Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3">{pitch.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{formatEther(pitch.targetAmount)} MON</p>
                      <p className="text-muted-foreground">Target</p>
                    </div>
                    <div>
                      <p className="font-medium">{formatEther(pitch.totalRaised)} MON</p>
                      <p className="text-muted-foreground">Raised ({progress.toFixed(1)}%)</p>
                    </div>
                    <div>
                      <p className="font-medium">{pitch.totalShares.toString()}</p>
                      <p className="text-muted-foreground">Total Shares</p>
                    </div>
                    <div>
                      <p className="font-medium">{pitch.sharesSold.toString()}</p>
                      <p className="text-muted-foreground">Sold</p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium">Revenue Share: {pitch.revenueSharePercentage.toString()}%</p>
                    <p className="text-muted-foreground">Price per share: {formatEther(pitch.pricePerShare)} MON</p>
                  </div>

                  {!pitch.isPublished && (
                    <Button
                      onClick={() => publishPitch(pitch.id)}
                      disabled={publishing === pitch.id}
                      className="w-full"
                    >
                      {publishing === pitch.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        "Publish Pitch"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
