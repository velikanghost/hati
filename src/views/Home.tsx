import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Navbar from '@/components/layouts/navbar'
import { useRouter } from 'next/navigation'

const Home = () => {
  const router = useRouter()
  return (
    <>
      <section className="relative h-[100dvh] bg-[#1F2026]">
        <Navbar />
        <div className="container absolute w-full mx-auto transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
          <div className="flex flex-col items-center justify-between gap-20 lg:flex-row">
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <h1 className="text-secondary drop-shadow-sm text-[40px] md:text-[60px] lg:text-[65px] leading-[120%] font-headings font-bold mb-6">
                Smart Payments <br /> MetaMask Card Powered.
              </h1>
              <p className="text-secondary drop-shadow-xl text-xl md:text-2xl mb-10 font-medium justify-center leading-[155%] max-w-[78%] text-center">
                Experience Hati, A MetaMask Card-powered smart payment gateway
                with lightning-fast USDC settlements and automated yield
                optimization.
              </p>
              <div className="flex items-center justify-center gap-4 md:gap-6">
                <DropdownMenu>
                  <DropdownMenuTrigger className="trydemo_btn bg-[#EBE8E2] text-secondary-foreground hover:bg-[#EBE8E2]/90">
                    Try Demo
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="mt-1 bg-primary-foreground text-secondary-foreground w-[12.5rem] rounded text-base">
                    <DropdownMenuItem
                      className="cursor-pointer"
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
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
