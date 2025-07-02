'use client'

import { AppShell, Avatar, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../ui/button'
import HatiLogo from '../../../public/images/hati_logo.png'
import Image from 'next/image'
import { blo } from 'blo'

import '@/components/layouts/dashboard.scss'
import {
  RiDashboard2Line,
  RiWallet3Line,
  RiSettings4Line,
  RiExchangeLine,
  RiLineChartLine,
} from 'react-icons/ri'

// Define merchant navigation links
const navLinks = [
  {
    icon: (color: string) => <RiDashboard2Line color={color} />,
    name: 'Overview',
    url: '/merchant',
  },
  {
    icon: (color: string) => <RiExchangeLine color={color} />,
    name: 'Payments',
    url: '/merchant/payments',
  },
  {
    icon: (color: string) => <RiWallet3Line color={color} />,
    name: 'Transactions',
    url: '/merchant/transactions',
  },
  {
    icon: (color: string) => <RiLineChartLine color={color} />,
    name: 'Yield',
    url: '/merchant/yield',
    requiresCardTier: true, // Only for Premium/Elite
  },
  {
    icon: (color: string) => <RiSettings4Line color={color} />,
    name: 'Settings',
    url: '/merchant/settings',
  },
]

type CardTier = 'Basic' | 'Premium' | 'Elite'

export default function MerchantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [opened, { toggle }] = useDisclosure()
  const pathname = usePathname()
  const router = useRouter()

  // TODO: Get from Redux store or context
  const merchantWallet = '0x1234...5678' // Mock wallet address
  const cardTier: CardTier = 'Elite' // Mock card tier (Basic/Premium/Elite)

  const shouldShowYield = ['Premium', 'Elite'].includes(cardTier)

  return (
    <AppShell
      layout="alt"
      header={{ height: 90 }}
      navbar={{
        width: 350,
        breakpoint: 'md',
        collapsed: { mobile: !opened },
      }}
      withBorder={false}
      className="font-bricolage"
    >
      <AppShell.Header>
        <div className="flex items-center gap-6">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="md"
            size="md"
            color="#121212"
          />
          <div className="flex items-center gap-3">
            <Avatar
              className="border border-white"
              radius="xl"
              src={blo(merchantWallet)}
            />
            <div className="flex flex-col">
              <div className="logo text-[#000000b3] text-xl font-medium">
                {merchantWallet}
              </div>
              <div
                className={`text-sm font-semibold ${
                  cardTier === 'Elite'
                    ? 'text-purple-600'
                    : cardTier === 'Premium'
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                MetaMask Card - {cardTier}
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="default"
          className="rounded-full"
          onClick={() => router.push('/')}
        >
          Sign Out
        </Button>
      </AppShell.Header>

      <AppShell.Navbar className="relative sidenav_wrapper">
        <div className="flex items-center justify-between mt-8 mb-12">
          <div className="flex items-center gap-4">
            <Image src={HatiLogo} width={60} height={45} alt="Hati Logo" />
            <h1 className="text-[#000000b3] text-[32px] font-medium">Hati</h1>
          </div>
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="md"
            size="md"
            color="#121212"
          />
        </div>

        <nav className="space-y-2">
          {navLinks.map((link, index) => {
            // Skip yield nav for Basic tier
            if (link.requiresCardTier && !shouldShowYield) {
              return null
            }

            const isActive = pathname.startsWith(link.url)

            return (
              <Link
                key={index}
                href={link.url}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-[10px] transition-colors
                  ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-[#818181] hover:bg-gray-100 hover:text-gray-800'
                  }
                `}
              >
                {link.icon(isActive ? '#FFFFFF' : '#818181')}
                <span className="font-medium">{link.name}</span>
                {link.requiresCardTier && (
                  <span
                    className={`ml-auto text-xs px-2 py-1 rounded-full ${
                      cardTier === 'Elite'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {cardTier}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* <Image
          className="absolute bottom-0 left-0 w-full sidenav_img"
          src={sidenavImg}
          alt="sidenav image"
        /> */}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
