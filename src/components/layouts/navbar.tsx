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
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [showSidebar, setShowSidebar] = useState<boolean>(false)
  const menuItems = [
    {
      icon: <RiTwitterXLine size={18} />,
      name: 'Twitter/X',
      link: 'https://x.com/HatiPayments',
    },
  ]

  return (
    <>
      <NavigationMenu className="mx-auto navigation-menu font-space-grotesk">
        <NavigationMenuList className="container items-center justify-between w-screen pt-2 nav-container">
          <NavigationMenuItem
            className="py-4 text-2xl cursor-pointer text-[#000000] flex items-center gap-2 font-bold"
            onClick={() => router.push('/')}
          >
            <img
              src="/images/hati_logo.png"
              alt="Hati Logo"
              className="h-8 w-8 object-contain mr-2"
            />
            Hati
          </NavigationMenuItem>

          {pathname?.includes('/shoppers') ? (
            <Button
              variant="nav"
              className="flex items-center gap-3 btn-primary hover:animate-pulse"
              onClick={() => router.push('/')}
            >
              Exit
              <RxExit />
            </Button>
          ) : (
            <>
              <NavigationMenuItem className="mr-auto">
                <button
                  className="menu-button lg:hidden"
                  onClick={() => setShowSidebar(true)}
                >
                  {showSidebar ? null : (
                    <RiMenu2Line size={30} color="#EBE8E2" />
                  )}
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

                <div className="flex gap-4">
                  <Link
                    href="/shoppers"
                    passHref
                    className="trydemo_btn bg-[#EBE8E2] text-secondary-foreground hover:bg-[#EBE8E2]/90 hover:animate-pulse font-medium text-base"
                  >
                    For Shoppers
                  </Link>
                  <Link
                    href="/merchant"
                    passHref
                    className="trydemo_btn bg-[#EBE8E2] text-secondary-foreground hover:bg-[#EBE8E2]/90 hover:animate-pulse font-medium text-base"
                  >
                    For Merchants
                  </Link>
                </div>
              </div>
            </>
          )}
        </NavigationMenuList>
      </NavigationMenu>
      {showSidebar && (
        <MobileSidebar menuItems={menuItems} setShowSidebar={setShowSidebar} />
      )}
    </>
  )
}

export default Navbar
