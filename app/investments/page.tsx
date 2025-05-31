"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { getReadOnlyContract, getContract, formatEther, type PitchCard } from "@/lib/web3"
import { Loader2, TrendingUp, DollarSign } from "lucide-react"

interface Investment {
  pitchId: number
  pitch: PitchCard
  shares: bigint
  claimableRevenue: bigint
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<number | null>(null)
  const { toast } = useToast()
  const { account, isConnected } = useWallet()

  const loadInvestments = async () => {
    if (!account) return

    try {
      const contract = getReadOnlyContract()
      if (!contract) return

      const publishedIds = await contract.getPublishedPitches()
      const userInvestments: Investment[] = []

      for (const id of publishedIds) {
        try {
          const shares = await contract.getInvestorShares(id, account)
          if (shares && shares > 0n) {
            const pitch = await contract.getPitchCard(id)
            const claimableRevenue = await contract.getClaimableRevenue(id, account)

            if (pitch && pitch.creator) {
              userInvestments.push({
                pitchId: Number(id),
                pitch: {
                  ...pitch,
                  targetAmount: pitch.targetAmount || 0n,
                  totalShares: pitch.totalShares || 0n,
                  pricePerShare: pitch.pricePerShare || 0n,
                  revenueSharePercentage: pitch.revenueSharePercentage || 0n,
                  totalRaised: pitch.totalRaised || 0n,
                  sharesSold: pitch.sharesSold || 0n,
                },
                shares: shares || 0n,
                claimableRevenue: claimableRevenue || 0n,
              })
            }
          }
        } catch (error) {
          console.warn(`Failed to load investment for pitch ${id}:`, error)
          continue
        }
      }

      setInvestments(userInvestments)
    } catch (error) {
      console.error("Failed to load investments:", error)
      toast({
        title: "Error",
        description: "Failed to load your investments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const claimRevenue = async (pitchId: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to claim revenue",
        variant: "destructive",
      })
      return
    }

    try {
      setClaiming(pitchId)
      const contract = await getContract()

      const tx = await contract.claimRevenue(pitchId)

      toast({
        title: "Transaction submitted",
        description: "Your revenue claim is being processed...",
      })

      await tx.wait()

      toast({
        title: "Success!",
        description: "Revenue claimed successfully",
      })

      loadInvestments()
    } catch (error: any) {
      console.error("Failed to claim revenue:", error)
      toast({
        title: "Claim failed",
        description: error.message || "Failed to claim revenue",
        variant: "destructive",
      })
    } finally {
      setClaiming(null)
    }
  }

  useEffect(() => {
    if (isConnected && account) {
      loadInvestments()
    } else {
      setLoading(false)
    }
  }, [account, isConnected])

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground text-center">Please connect your wallet to view your investments</p>
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

  const totalInvested = investments.reduce((sum, inv) => {
    const shares = inv.shares || 0n
    const pricePerShare = inv.pitch.pricePerShare || 0n
    return sum + shares * pricePerShare
  }, 0n)

  const totalClaimable = investments.reduce((sum, inv) => {
    return sum + (inv.claimableRevenue || 0n)
  }, 0n)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">My Investments</h1>
        <p className="text-muted-foreground">Track your portfolio and claim revenue</p>
      </div>

      {investments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatEther(totalInvested)} MON</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claimable Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatEther(totalClaimable)} MON</div>
            </CardContent>
          </Card>
        </div>
      )}

      {investments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start investing in creator projects to build your portfolio
            </p>
            <Button asChild>
              <a href="/">Browse Marketplace</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {investments.map((investment) => {
            const investmentValue = (investment.shares || 0n) * (investment.pitch.pricePerShare || 0n)
            const hasClaimableRevenue = investment.claimableRevenue && investment.claimableRevenue > 0n

            return (
              <Card key={investment.pitchId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{investment.pitch.title}</CardTitle>
                      <Badge variant="outline">Pitch ID: {investment.pitchId}</Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">{investment.pitch.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{investment.shares.toString()}</p>
                      <p className="text-muted-foreground">Shares Owned</p>
                    </div>
                    <div>
                      <p className="font-medium">{formatEther(investmentValue)} MON</p>
                      <p className="text-muted-foreground">Investment Value</p>
                    </div>
                    <div>
                      <p className="font-medium">{investment.pitch.revenueSharePercentage.toString()}%</p>
                      <p className="text-muted-foreground">Revenue Share</p>
                    </div>
                    <div>
                      <p className="font-medium">{formatEther(investment.claimableRevenue)} MON</p>
                      <p className="text-muted-foreground">Claimable</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => claimRevenue(investment.pitchId)}
                    disabled={!hasClaimableRevenue || claiming === investment.pitchId}
                    className="w-full"
                    variant={hasClaimableRevenue ? "default" : "secondary"}
                  >
                    {claiming === investment.pitchId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : hasClaimableRevenue ? (
                      "Claim Revenue"
                    ) : (
                      "No Revenue Available"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
