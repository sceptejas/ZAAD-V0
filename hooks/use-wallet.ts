"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { ethers } from "ethers"

interface WalletContextType {
  account: string | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  balance: string
}

const WalletContext = createContext<WalletContextType | null>(null)

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState("0")

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask!")
      return
    }

    try {
      setIsConnecting(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])

      if (accounts.length > 0) {
        setAccount(accounts[0])
        const balance = await provider.getBalance(accounts[0])
        setBalance(ethers.formatEther(balance))
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
    setBalance("0")
  }

  const updateBalance = async () => {
    if (account && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const balance = await provider.getBalance(account)
        setBalance(ethers.formatEther(balance))
      } catch (error) {
        console.error("Failed to update balance:", error)
      }
    }
  }

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()
          if (accounts.length > 0) {
            setAccount(accounts[0].address)
            const balance = await provider.getBalance(accounts[0].address)
            setBalance(ethers.formatEther(balance))
          }
        } catch (error) {
          console.error("Failed to check connection:", error)
        }
      }
    }

    checkConnection()

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          updateBalance()
        } else {
          disconnect()
        }
      })

      window.ethereum.on("chainChanged", () => {
        window.location.reload()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [account])

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnected: !!account,
        isConnecting,
        connect,
        disconnect,
        balance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
