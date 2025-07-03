'use client'

import { AppShell, Avatar, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import HatiLogo from '../../../public/images/hati_logo.png'
import Image from 'next/image'
import { blo } from 'blo'
import { merchantStorage } from '@/lib/merchantStorage'
import { useMetaMask } from '@/hooks/useMetaMask'

import './dashboard.scss'
import {
  RiDashboard2Line,
  RiWallet3Line,
  RiSettings4Line,
  RiExchangeLine,
  RiLineChartLine,
  RiLogoutBoxLine,
} from 'react-icons/ri'

// Define merchant navigation links
const navLinks = [
  {
    icon: (color: string) => (
      <RiDashboard2Line className="w-5 h-5" style={{ color }} />
    ),
    name: 'Overview',
    url: '/merchant/overview',
  },
  {
    icon: (color: string) => (
      <RiWallet3Line className="w-5 h-5" style={{ color }} />
    ),
    name: 'Wallet',
    url: '/merchant/wallet',
  },
  {
    icon: (color: string) => (
      <RiLineChartLine className="w-5 h-5" style={{ color }} />
    ),
    name: 'Yield',
    url: '/merchant/yield',
    requiresCardTier: true, // Only for Premium/Elite
  },
  {
    icon: (color: string) => (
      <RiSettings4Line className="w-5 h-5" style={{ color }} />
    ),
    name: 'Settings',
    url: '/merchant/settings',
  },
]

type CardTier = 'Basic' | 'Premium' | 'Elite'

interface MerchantData {
  walletAddress: string
  hatiWalletAddress?: string
  hatiWalletId?: string
  cardTier: CardTier
  isNewUser: boolean
}

export default function MerchantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [opened, { toggle }] = useDisclosure()
  const pathname = usePathname()
  const router = useRouter()
  const { account, cardTier: metaMaskCardTier } = useMetaMask()

  const [merchantData, setMerchantData] = useState<MerchantData | null>(null)

  // Load merchant data on component mount
  useEffect(() => {
    const loadMerchantData = () => {
      const cachedData = merchantStorage.load()
      if (cachedData) {
        setMerchantData(cachedData)
      } else if (account?.address) {
        // If no cached data but we have a connected account, use fallback
        setMerchantData({
          walletAddress: account.address,
          cardTier:
            metaMaskCardTier?.tier === 'basic'
              ? 'Basic'
              : metaMaskCardTier?.tier === 'premium'
              ? 'Premium'
              : metaMaskCardTier?.tier === 'elite'
              ? 'Elite'
              : 'Basic',
          isNewUser: true,
        })
      }
    }

    loadMerchantData()
  }, [account, metaMaskCardTier])

  // Get values from merchant data or fallback to connected account
  const merchantWallet =
    merchantData?.walletAddress || account?.address || '0x...'
  const cardTier = merchantData?.cardTier || 'Basic'

  const shouldShowYield = ['Basic', 'Premium', 'Elite'].includes(cardTier)

  const getCardTierColor = (tier: CardTier) => {
    switch (tier) {
      case 'Elite':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'Premium':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatWalletAddress = (address: string) => {
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleSignOut = () => {
    // Clear cached merchant data
    merchantStorage.clear()
    // Navigate to home page
    router.push('/')
  }

  return (
    <AppShell
      layout="alt"
      header={{ height: 90 }}
      navbar={{
        width: 320,
        breakpoint: 'md',
        collapsed: { mobile: !opened },
      }}
      withBorder={false}
      className="h-screen overflow-hidden font-sans"
    >
      <AppShell.Header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="md"
            size="md"
            color="#374151"
            className="lg:hidden"
          />
          <div className="flex items-center gap-4">
            <Avatar
              className="ring-2 ring-gray-100"
              radius="xl"
              size="lg"
              src={blo(merchantWallet as `0x${string}`)}
            />
            <div className="flex flex-col">
              <div className="text-lg font-semibold text-gray-900">
                {formatWalletAddress(merchantWallet)}
              </div>
              <div
                className={`text-sm font-medium px-2 py-1 rounded-full border ${getCardTierColor(
                  cardTier,
                )}`}
              >
                MetaMask Card - {cardTier}
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 transition-colors border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900"
          onClick={handleSignOut}
        >
          <RiLogoutBoxLine className="w-4 h-4" />
          Sign Out
        </Button>
      </AppShell.Header>

      <AppShell.Navbar className="overflow-hidden bg-white border-r border-gray-100">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between pt-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl">
                <Image src={HatiLogo} width={40} height={30} alt="Hati Logo" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Hati</h1>
            </div>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
              size="sm"
              color="#6B7280"
              className="lg:hidden"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {navLinks.map((link, index) => {
              // Skip yield nav for Basic tier
              if (link.requiresCardTier && !shouldShowYield) {
                return null
              }

              const isActive =
                pathname === link.url ||
                (link.url !== '/merchant/overview' &&
                  pathname.startsWith(link.url) &&
                  pathname !== '/merchant/overview')

              return (
                <Link
                  key={index}
                  href={link.url}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative
                    ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}
                  >
                    {link.icon(isActive ? '#FFFFFF' : '#6B7280')}
                  </div>
                  <span className="font-medium">{link.name}</span>
                  {link.requiresCardTier && (
                    <span
                      className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : cardTier === 'Elite'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {cardTier}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute right-0 w-1 h-8 -translate-y-1/2 bg-white rounded-l-full top-1/2"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 mt-auto border-t border-gray-100">
            <div className="text-xs text-center text-gray-500">
              Powered by Hati
            </div>
          </div>
        </div>
      </AppShell.Navbar>

      <AppShell.Main className="overflow-hidden bg-slate-50">
        <div className="p-6 space-y-6 dashboard-content">{children}</div>
      </AppShell.Main>
    </AppShell>
  )
}
