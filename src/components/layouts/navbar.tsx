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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@radix-ui/react-dropdown-menu'

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

          {pathname?.includes('/demo') ? (
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

                <DropdownMenu>
                  <DropdownMenuTrigger className="trydemo_btn bg-[#EBE8E2] text-secondary-foreground hover:bg-[#EBE8E2]/90 hover:animate-pulse font-medium text-base">
                    Try Demo
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="p-4 mt-2 -ml-20 bg-primary-foreground text-secondary-foreground w-[12.5rem] rounded-[4px]">
                    <DropdownMenuItem
                      className="mb-3 cursor-pointer"
                      onClick={() => router.push('/demo')}
                    >
                      For Shoppers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => router.push('/merchant')}
                    >
                      For Merchants
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
