'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Navbar from '@/components/layouts/navbar'
import { useRouter } from 'next/navigation'
import '@/app/globals.scss'

const Home = () => {
  const router = useRouter()
  return (
    <>
      <div className="relative w-full overflow-x-hidden font-[Space Grotesk]">
        {/* Hero Gradient Background with Diagonal Cut */}
        <div
          className="absolute top-0 left-0 w-full h-[380px] md:h-[500px] bg-gradient-to-r from-[#FFD28F] to-[#F1A5FB] -z-10"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 70%)' }}
        />
        <section className="relative z-10 w-full min-h-[600px] flex flex-col overflow-x-hidden max-w-full font-[Space Grotesk]">
          <Navbar />
          <div className="flex items-center justify-between h-full gap-6 pt-16 mx-auto overflow-x-hidden max-w-max">
            {/* Left Side */}
            <div className="flex flex-col items-start justify-center flex-1 w-full max-w-xl px-4 mt-4 md:px-0 md:mt-16">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1a2530] mb-4 md:mb-6 leading-tight md:leading-tight">
                Instant
                <br />
                Transactions
                <br />
                One Click,
                <br />
                Any Chain.
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-[#1a2530] mb-6 md:mb-8">
                Experience Hati, A payment solution powered by Monad Layer-1
                blockchain, providing fast one-click transactions regardless of
                source and destination chains.
              </p>
              <div className="flex flex-col w-full gap-3 mb-6 sm:flex-row md:gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="bg-[#1a2530] text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-[#232f3e] transition w-full sm:w-auto text-base md:text-lg">
                    Start with payments
                    <span className="ml-2">&darr;</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="mt-1 bg-white text-[#1a2530] w-[11rem] md:w-[12.5rem] rounded text-base shadow-lg">
                    <DropdownMenuItem
                      className="cursor-pointer px-4 py-2 hover:bg-[#F1A5FB]/20"
                      onClick={() => router.push('/shoppers')}
                    >
                      For shoppers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer px-4 py-2 hover:bg-[#FFD28F]/20"
                      onClick={() => router.push('/merchant')}
                    >
                      For merchants
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {/* Right Side */}
            <div className="w-[620px] h-[608px]">
              <img
                src="/images/hero-section.png"
                alt="Hero section"
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default Home
