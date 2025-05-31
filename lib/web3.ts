import { ethers } from "ethers"

export const CONTRACT_ADDRESS = "0x8657e407089a6c89913857030a41520890ec2076"

export const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pitchId",
        type: "uint256",
      },
    ],
    name: "claimRevenue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "title",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "targetAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalShares",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "revenueSharePercentage",
        type: "uint256",
      },
    ],
    name: "createPitchCard",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pitchId",
        type: "uint256",
      },
    ],
    name: "depositRevenue",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pitchId",
        type: "uint256",
      },
    ],
    name: "publishPitchCard",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pitchId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "purchaseShares",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pitchId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "investor",
        type: "address",
      },
    ],
    name: "getClaimableRevenue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pitchId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "investor",
        type: "address",
      },
    ],
    name: "getInvestorShares",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pitchId",
        type: "uint256",
      },
    ],
    name: "getPitchCard",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "targetAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalShares",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "pricePerShare",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "revenueSharePercentage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalRaised",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "sharesSold",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isPublished",
            type: "bool",
          },
        ],
        internalType: "struct CreatorCrowdfunding.PitchCard",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPublishedPitches",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export interface PitchCard {
  creator: string
  title: string
  description: string
  targetAmount: bigint
  totalShares: bigint
  pricePerShare: bigint
  revenueSharePercentage: bigint
  totalRaised: bigint
  sharesSold: bigint
  isPublished: boolean
}

export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  return null
}

export const getContract = async () => {
  const provider = getProvider()
  if (!provider) throw new Error("No wallet provider found")

  const signer = await provider.getSigner()
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}

export const getReadOnlyContract = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum)
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
  }
  return null
}

export const formatEther = (value: bigint) => {
  return ethers.formatEther(value)
}

export const parseEther = (value: string) => {
  return ethers.parseEther(value)
}

export const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
