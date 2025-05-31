"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { getContract, parseEther } from "@/lib/web3"
import { Loader2, Sparkles } from "lucide-react"

export default function CreatePitchPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetAmount: "",
    totalShares: "",
    revenueSharePercentage: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { isConnected } = useWallet()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const { title, description, targetAmount, totalShares, revenueSharePercentage } = formData

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      })
      return false
    }

    if (!description.trim()) {
      toast({
        title: "Validation Error",
        description: "Description is required",
        variant: "destructive",
      })
      return false
    }

    if (!targetAmount || Number.parseFloat(targetAmount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Target amount must be greater than 0",
        variant: "destructive",
      })
      return false
    }

    if (!totalShares || Number.parseInt(totalShares) <= 0) {
      toast({
        title: "Validation Error",
        description: "Total shares must be greater than 0",
        variant: "destructive",
      })
      return false
    }

    if (
      !revenueSharePercentage ||
      Number.parseInt(revenueSharePercentage) < 0 ||
      Number.parseInt(revenueSharePercentage) > 100
    ) {
      toast({
        title: "Validation Error",
        description: "Revenue share percentage must be between 0 and 100",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const createPitch = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a pitch",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      const contract = await getContract()

      const targetAmountWei = parseEther(formData.targetAmount)

      const tx = await contract.createPitchCard(
        formData.title,
        formData.description,
        targetAmountWei,
        formData.totalShares,
        formData.revenueSharePercentage,
      )

      toast({
        title: "Transaction submitted",
        description: "Your pitch is being created...",
      })

      const receipt = await tx.wait()

      // Extract pitch ID from events
      const pitchCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === "PitchCreated"
        } catch {
          return false
        }
      })

      let pitchId = "Unknown"
      if (pitchCreatedEvent) {
        const parsed = contract.interface.parseLog(pitchCreatedEvent)
        pitchId = parsed?.args[0].toString()
      }

      toast({
        title: "Success!",
        description: `Pitch created successfully! Pitch ID: ${pitchId}`,
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        targetAmount: "",
        totalShares: "",
        revenueSharePercentage: "",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Failed to create pitch:", error)
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create pitch",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const pricePerShare =
    formData.targetAmount && formData.totalShares
      ? (Number.parseFloat(formData.targetAmount) / Number.parseInt(formData.totalShares)).toFixed(6)
      : "0"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-lavender-400 to-neon-pink bg-clip-text text-transparent">
          Create New Pitch
        </h1>
        <p className="text-muted-foreground">Launch your crowdfunding campaign and connect with investors</p>
      </div>

      <Card className="neon-glow border-lavender-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lavender-200">
            <Sparkles className="h-5 w-5 text-lavender-400" />
            Pitch Details
          </CardTitle>
          <CardDescription>Provide information about your project to attract investors</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-lavender-200">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Enter your pitch title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="border-lavender-600 focus:border-lavender-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-lavender-200">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your project, goals, and how you plan to use the funds"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className="border-lavender-600 focus:border-lavender-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount" className="text-lavender-200">
                Target Amount (MON)
              </Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.001"
                placeholder="0.0"
                value={formData.targetAmount}
                onChange={(e) => handleInputChange("targetAmount", e.target.value)}
                className="border-lavender-600 focus:border-lavender-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalShares" className="text-lavender-200">
                Total Shares
              </Label>
              <Input
                id="totalShares"
                type="number"
                placeholder="1000"
                value={formData.totalShares}
                onChange={(e) => handleInputChange("totalShares", e.target.value)}
                className="border-lavender-600 focus:border-lavender-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenueShare" className="text-lavender-200">
              Revenue Share Percentage (%)
            </Label>
            <Input
              id="revenueShare"
              type="number"
              min="0"
              max="100"
              placeholder="10"
              value={formData.revenueSharePercentage}
              onChange={(e) => handleInputChange("revenueSharePercentage", e.target.value)}
              className="border-lavender-600 focus:border-lavender-400"
            />
            <p className="text-sm text-muted-foreground">Percentage of future revenue to share with investors</p>
          </div>

          {pricePerShare !== "0" && (
            <div className="p-4 bg-lavender-900/30 border border-lavender-700 rounded-lg">
              <p className="text-sm font-medium text-lavender-200">Price per share: {pricePerShare} MON</p>
              <p className="text-xs text-muted-foreground">Calculated as Target Amount ÷ Total Shares</p>
            </div>
          )}

          <Button
            onClick={createPitch}
            disabled={isSubmitting || !isConnected}
            className="w-full bg-gradient-to-r from-lavender-600 to-neon-pink hover:from-lavender-700 hover:to-neon-pink/90"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Pitch...
              </>
            ) : (
              "Create Pitch Card"
            )}
          </Button>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">Please connect your wallet to create a pitch</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
