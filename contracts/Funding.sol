// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CreatorCrowdfunding {
    
    struct PitchCard {
        address creator;
        string title;
        string description;
        uint256 targetAmount;
        uint256 totalShares;
        uint256 pricePerShare;
        uint256 revenueSharePercentage;
        uint256 totalRaised;
        uint256 sharesSold;
        bool isPublished;
    }
    
    uint256 private pitchIdCounter;
    mapping(uint256 => PitchCard) public pitchCards;
    mapping(uint256 => mapping(address => uint256)) public investorShares;
    mapping(uint256 => uint256) public totalRevenue;
    mapping(uint256 => mapping(address => uint256)) public claimedRevenue;
    uint256[] public publishedPitches;
    
    event PitchCreated(uint256 indexed pitchId, address indexed creator);
    event PitchPublished(uint256 indexed pitchId);
    event SharesPurchased(uint256 indexed pitchId, address indexed investor, uint256 shares);
    event RevenueDeposited(uint256 indexed pitchId, uint256 amount);
    event RevenueClaimed(uint256 indexed pitchId, address indexed investor, uint256 amount);
    
    // Creates a new pitch card
    function createPitchCard(
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 totalShares,
        uint256 revenueSharePercentage
    ) external {
        pitchIdCounter++;
        uint256 pricePerShare = targetAmount / totalShares;
        
        pitchCards[pitchIdCounter] = PitchCard({
            creator: msg.sender,
            title: title,
            description: description,
            targetAmount: targetAmount,
            totalShares: totalShares,
            pricePerShare: pricePerShare,
            revenueSharePercentage: revenueSharePercentage,
            totalRaised: 0,
            sharesSold: 0,
            isPublished: false
        });
        
        emit PitchCreated(pitchIdCounter, msg.sender);
    }
    
    // Publishes pitch to homepage
    function publishPitchCard(uint256 pitchId) external {
        pitchCards[pitchId].isPublished = true;
        publishedPitches.push(pitchId);
        emit PitchPublished(pitchId);
    }
    
    // Buy shares in a pitch
    function purchaseShares(uint256 pitchId, uint256 shares) external payable {
        uint256 totalCost = shares * pitchCards[pitchId].pricePerShare;
        
        pitchCards[pitchId].sharesSold += shares;
        pitchCards[pitchId].totalRaised += totalCost;
        investorShares[pitchId][msg.sender] += shares;
        
        payable(pitchCards[pitchId].creator).transfer(totalCost);
        
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit SharesPurchased(pitchId, msg.sender, shares);
    }
    
    // Creator deposits revenue to share
    function depositRevenue(uint256 pitchId) external payable {
        totalRevenue[pitchId] += msg.value;
        emit RevenueDeposited(pitchId, msg.value);
    }
    
    // Investor claims their revenue share
    function claimRevenue(uint256 pitchId) external {
        uint256 shares = investorShares[pitchId][msg.sender];
        uint256 totalSharedRevenue = (totalRevenue[pitchId] * pitchCards[pitchId].revenueSharePercentage) / 100;
        uint256 investorShare = (totalSharedRevenue * shares) / pitchCards[pitchId].sharesSold;
        uint256 claimableAmount = investorShare - claimedRevenue[pitchId][msg.sender];
        
        claimedRevenue[pitchId][msg.sender] += claimableAmount;
        payable(msg.sender).transfer(claimableAmount);
        
        emit RevenueClaimed(pitchId, msg.sender, claimableAmount);
    }
    
    // Get all published pitch IDs
    function getPublishedPitches() external view returns (uint256[] memory) {
        return publishedPitches;
    }
    
    // Get pitch details
    function getPitchCard(uint256 pitchId) external view returns (PitchCard memory) {
        return pitchCards[pitchId];
    }
    
    // Get investor's shares
    function getInvestorShares(uint256 pitchId, address investor) external view returns (uint256) {
        return investorShares[pitchId][investor];
    }
    
    // Calculate claimable revenue
    function getClaimableRevenue(uint256 pitchId, address investor) external view returns (uint256) {
        uint256 shares = investorShares[pitchId][investor];
        uint256 totalSharedRevenue = (totalRevenue[pitchId] * pitchCards[pitchId].revenueSharePercentage) / 100;
        uint256 investorShare = (totalSharedRevenue * shares) / pitchCards[pitchId].sharesSold;
        return investorShare - claimedRevenue[pitchId][investor];
    }
}