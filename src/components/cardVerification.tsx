import React from 'react'
import { useAppSelector } from '@/store/hooks'
import { Button } from '@/components/ui/button'
import {
  RiVerifiedBadgeFill,
  RiShieldStarFill,
  RiVipCrownFill,
} from 'react-icons/ri'
import { MdCardMembership, MdOutlineCardMembership } from 'react-icons/md'

const CardVerification: React.FC = () => {
  const { cardTier, isVerifyingCard, userEvmAddress } = useAppSelector(
    (state) => state.connect,
  )

  if (!userEvmAddress) {
    return null
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'elite':
        return <RiVipCrownFill className="text-yellow-500" size={24} />
      case 'premium':
        return <RiShieldStarFill className="text-purple-500" size={24} />
      case 'basic':
        return <RiVerifiedBadgeFill className="text-blue-500" size={24} />
      default:
        return <MdOutlineCardMembership className="text-gray-400" size={24} />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite':
        return 'border-yellow-500 bg-yellow-50'
      case 'premium':
        return 'border-purple-500 bg-purple-50'
      case 'basic':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'elite':
        return 'bg-yellow-500 text-white'
      case 'premium':
        return 'bg-purple-500 text-white'
      case 'basic':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-400 text-white'
    }
  }

  if (isVerifyingCard) {
    return (
      <div className="p-4 border-2 border-gray-300 border-dashed rounded-lg card-verification-container bg-gray-50">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-5 h-5 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          <span className="text-gray-600">Verifying MetaMask Card...</span>
        </div>
      </div>
    )
  }

  if (!cardTier) {
    return (
      <div className="p-4 border-2 border-gray-300 rounded-lg card-verification-container bg-gray-50">
        <div className="flex items-center space-x-3">
          <MdOutlineCardMembership className="text-gray-400" size={24} />
          <div>
            <p className="font-medium text-gray-600">
              Card verification pending
            </p>
            <p className="text-sm text-gray-500">
              Connect wallet to verify MetaMask Card
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`card-verification-container p-4 border-2 rounded-lg ${getTierColor(
        cardTier.tier,
      )}`}
    >
      {cardTier.hasCard ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getTierIcon(cardTier.tier)}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-800">
                    MetaMask Card Verified
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadgeColor(
                      cardTier.tier,
                    )}`}
                  >
                    {cardTier.tier.toUpperCase()}
                  </span>
                </div>
                {cardTier.delegationAmount && (
                  <p className="text-sm text-gray-600">
                    Delegation: {cardTier.delegationAmount} ETH
                  </p>
                )}
              </div>
            </div>
            <MdCardMembership className="text-gray-600" size={32} />
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Your Benefits:</h4>
            <ul className="space-y-1">
              {cardTier.benefits.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-center space-x-2 text-sm text-gray-600"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tier-specific information */}
          {cardTier.tier === 'elite' && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-center space-x-2">
                <RiVipCrownFill className="text-yellow-600" size={16} />
                <span className="text-sm font-medium text-yellow-800">
                  Elite Member: Enjoy 0% fees and priority support!
                </span>
              </div>
            </div>
          )}

          {cardTier.tier === 'premium' && (
            <div className="p-3 bg-purple-100 border border-purple-300 rounded-lg">
              <div className="flex items-center space-x-2">
                <RiShieldStarFill className="text-purple-600" size={16} />
                <span className="text-sm font-medium text-purple-800">
                  Premium Member: 50% reduced fees and automated optimization!
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* No card detected */}
          <div className="flex items-center space-x-3">
            <MdOutlineCardMembership className="text-gray-400" size={24} />
            <div>
              <h3 className="font-semibold text-gray-700">
                MetaMask Card Not Detected
              </h3>
              <p className="text-sm text-gray-600">
                Get your MetaMask Card to unlock premium features and reduced
                fees
              </p>
            </div>
          </div>

          {/* Benefits preview */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-600">
              Available with MetaMask Card:
            </h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Reduced transaction fees</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Automated yield optimization</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Enhanced security features</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Priority customer support</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Button
            onClick={() => window.open('https://metamask.io/card', '_blank')}
            variant="outline"
            className="w-full mt-3 text-blue-600 border-blue-500 hover:bg-blue-50"
          >
            Get MetaMask Card
          </Button>
        </div>
      )}
    </div>
  )
}

export default CardVerification
