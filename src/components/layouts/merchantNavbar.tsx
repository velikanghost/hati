import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { useState } from 'react'
import { RiMenu2Line, RiTwitterXLine } from 'react-icons/ri'
import { MobileSidebar } from './mobileSidebar'
import { NavigationMenuLink } from '@radix-ui/react-navigation-menu'
import { Button } from '@/components/ui/button'
import { RxExit } from 'react-icons/rx'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { connectMerchantWallet } from '@/store/slices/merchantSlice'

const MerchantNavbar = () => {
  const dispatch = useAppDispatch()
  const merchantEvmAccount = useAppSelector(
    (state) => state.merchant.merchantEvmAccount,
  )
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState<boolean>(false)

  const getAccount = async () => {
    dispatch(connectMerchantWallet())
  }

  const menuItems = [
    {
      icon: <RiTwitterXLine size={18} />,
      name: 'Twitter/X',
      link: 'https://x.com/HatiPayments',
    },
    // {
    //   icon: <BsJournalText size={18} />,
    //   name: 'Writings',
    //   link: 'https://hati.substack.com',
    // },
  ]

  return (
    <>
      <NavigationMenu className="mx-auto navigation-menu">
        <NavigationMenuList className="container items-center justify-between w-screen pt-2 nav-container">
          <NavigationMenuItem
            className="py-4 text-2xl font-semibold cursor-pointer text-primary-foreground font-headings"
            onClick={() => router.push('/')}
          >
            Hati
          </NavigationMenuItem>

          <NavigationMenuItem className="mr-auto">
            <button
              className="menu-button lg:hidden"
              onClick={() => setShowSidebar(true)}
            >
              {showSidebar ? null : <RiMenu2Line size={30} color="#EBE8E2" />}
            </button>
          </NavigationMenuItem>

          <div className="nav-menu-items text-primary-foreground">
            {menuItems.map((item, i) => (
              <NavigationMenuLink
                className="flex items-center justify-center h-full gap-2 py-4 text-base hover:animate-bounce"
                href={item.link}
                key={i}
                target={item.name === 'Home' ? '_parent' : '_blank'}
              >
                {item.icon} {item.name}
              </NavigationMenuLink>
            ))}
            {merchantEvmAccount.address ? (
              <>
                <Button
                  variant="nav"
                  className="flex items-center gap-3 btn-primary hover:animate-pulse"
                  onClick={() => router.push('/')}
                >
                  Exit
                  <RxExit />
                </Button>
              </>
            ) : (
              <Button
                variant="nav"
                className="btn-primary hover:animate-pulse"
                onClick={getAccount}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </NavigationMenuList>
      </NavigationMenu>
      {showSidebar && (
        <MobileSidebar menuItems={menuItems} setShowSidebar={setShowSidebar} />
      )}
    </>
  )
}

export default MerchantNavbar
