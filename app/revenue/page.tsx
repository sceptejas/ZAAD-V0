"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { getReadOnlyContract, getContract, parseEther, type PitchCard } from "@/lib/web3"
import { Loader2, DollarSign } from "lucide-react"

interface PitchWithId extends PitchCard {
  id: number
}

export default function RevenuePage() {
  const [userPitches, setUserPitches] = useState<PitchWithId[]>([])
  const [selectedPitchId, setSelectedPitchId] = useState<string>("")
  const [revenueAmount, setRevenueAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [depositing, setDepositing] = useState(false)
  const { toast } = useToast()
  const { account, isConnected } = useWallet()

  const loadUserPitches = async () => {
    if (!account) return

    try {
      const contract = getReadOnlyContract()
      if (!contract) return

      const publishedIds = await contract.getPublishedPitches()
      const creatorPitches: PitchWithId[] = []

      for (const id of publishedIds) {
        try {
          const pitch = await contract.getPitchCard(id)
          if (pitch && pitch.creator && pitch.creator.toLowerCase() === account.toLowerCase()) {
            creatorPitches.push({
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

      setUserPitches(creatorPitches)
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

  const depositRevenue = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to deposit revenue",
        variant: "destructive",
      })
      return
    }

    if (!selectedPitchId) {
      toast({
        title: "No pitch selected",
        description: "Please select a pitch to deposit revenue for",
        variant: "destructive",
      })
      return
    }

    if (!revenueAmount || Number.parseFloat(revenueAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid revenue amount",
        variant: "destructive",
      })
      return
    }

    try {
      setDepositing(true)
      const contract = await getContract()

      const revenueWei = parseEther(revenueAmount)

      const tx = await contract.depositRevenue(selectedPitchId, {
        value: revenueWei,
      })

      toast({
        title: "Transaction submitted",
        description: "Your revenue deposit is being processed...",
      })

      await tx.wait()

      toast({
        title: "Success!",
        description: `Successfully deposited ${revenueAmount} MON as revenue`,
      })

      setRevenueAmount("")
      setSelectedPitchId("")
      loadUserPitches()
    } catch (error: any) {
      console.error("Failed to deposit revenue:", error)
      toast({
        title: "Deposit failed",
        description: error.message || "Failed to deposit revenue",
        variant: "destructive",
      })
    } finally {
      setDepositing(false)
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
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground text-center">Please connect your wallet to deposit revenue</p>
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Revenue Deposit</h1>
        <p className="text-muted-foreground">Share revenue with your investors</p>
      </div>

      {userPitches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No published pitches</h3>
            <p className="text-muted-foreground text-center mb-4">
              You need to have published pitches to deposit revenue
            </p>
            <Button asChild>
              <a href="/create">Create Pitch</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Deposit Revenue
            </CardTitle>
            <CardDescription>
              Deposit revenue to be shared with your investors based on their share percentage
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pitch">Select Pitch</Label>
              <Select value={selectedPitchId} onValueChange={setSelectedPitchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pitch to deposit revenue for" />
                </SelectTrigger>
                <SelectContent>
                  {userPitches.map((pitch) => (
                    <SelectItem key={pitch.id} value={pitch.id.toString()}>
                      {pitch.title} (ID: {pitch.id}) - {pitch.revenueSharePercentage.toString()}% share
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Revenue Amount (MON)</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                placeholder="0.0"
                value={revenueAmount}
                onChange={(e) => setRevenueAmount(e.target.value)}
              />
            </div>

            {selectedPitchId && revenueAmount && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Revenue Distribution Preview</h4>
                {(() => {
                  const selectedPitch = userPitches.find((p) => p.id.toString() === selectedPitchId)
                  if (!selectedPitch) return null

                  const totalRevenue = Number.parseFloat(revenueAmount)
                  const sharePercentage = Number(selectedPitch.revenueSharePercentage)
                  const investorShare = (totalRevenue * sharePercentage) / 100
                  const creatorShare = totalRevenue - investorShare

                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Total Revenue:</span>
                        <span className="font-medium">{totalRevenue} MON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Investor Share ({sharePercentage}%):</span>
                        <span className="font-medium">{investorShare.toFixed(6)} MON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Creator Keeps:</span>
                        <span className="font-medium">{creatorShare.toFixed(6)} MON</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            <Button
              onClick={depositRevenue}
              disabled={depositing || !selectedPitchId || !revenueAmount}
              className="w-full"
              size="lg"
            >
              {depositing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Depositing Revenue...
                </>
              ) : (
                "Deposit Revenue"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {userPitches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Published Pitches</h3>
          <div className="grid gap-4">
            {userPitches.map((pitch) => (
              <Card key={pitch.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{pitch.title}</h4>
                      <p className="text-sm text-muted-foreground">ID: {pitch.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{pitch.revenueSharePercentage.toString()}% Revenue Share</p>
                      <p className="text-sm text-muted-foreground">
                        {pitch.sharesSold.toString()} / {pitch.totalShares.toString()} shares sold
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
