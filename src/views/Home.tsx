"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Navbar from '@/components/layouts/navbar'
import { useRouter } from 'next/navigation'

import styles from './heroSection.module.scss';
import '@/app/globals.scss';

const Home = () => {
  const router = useRouter()
  return (
    <>
      <div className="relative w-full overflow-x-hidden max-w-full font-[Space Grotesk]">
        {/* Hero Gradient Background with Diagonal Cut */}
        <div
          className="absolute top-0 left-0 w-full h-[350px] md:h-[500px] bg-gradient-to-r from-[#FFD28F] to-[#F1A5FB] -z-10"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 70%)' }}
        />
        <section className="relative z-10 w-full min-h-[600px] flex flex-col overflow-x-hidden max-w-full font-[Space Grotesk]">
          <Navbar />
          <div className="container mx-auto flex flex-col-reverse md:flex-row items-center justify-between pt-4 md:pt-16 h-full overflow-x-hidden max-w-full gap-8 md:gap-0">
            {/* Left Side */}
            <div className="flex-1 max-w-xl px-4 md:px-0 mt-4 md:mt-16 flex flex-col items-start justify-center w-full">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1a2530] mb-4 md:mb-6 leading-tight md:leading-tight">
                Instant<br />
                Transactions<br />
                One Click,<br />
                Any Chain.
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-[#1a2530] mb-6 md:mb-8">
                Experience Hati, A payment solution powered by Monad Layer-1 blockchain, providing fast one-click transactions regardless of source and destination chains.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 w-full">
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
            <div className="flex-1 flex justify-center items-center mt-6 md:mt-0 px-2 md:px-0 w-full">
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-md h-[320px] sm:h-[320px] md:h-[430px] rounded-2xl shadow-lg flex items-center justify-center overflow-hidden p-0">
                <img 
                  src="/images/hero-section.png" 
                  alt="Hero section" 
                  className="object-cover w-full h-full" 
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Brand Logos */}
      <div className="container mx-auto flex flex-wrap justify-center gap-6 md:gap-12 pt-8 md:pt-12 relative z-20 overflow-x-hidden max-w-full">
        <img src="/images/amazon.png" alt="Amazon" className="h-8 sm:h-10 md:h-12 opacity-90" />
        <img src="/images/google.png" alt="Google" className="h-8 sm:h-10 md:h-12 opacity-90" />
        <img src="/images/airbnb.png" alt="Airbnb" className="h-8 sm:h-10 md:h-12 opacity-90" />
        <img src="/images/shopify.png" alt="Shopify" className="h-8 sm:h-10 md:h-12 opacity-90" />
      </div>
    </>
  )
}

export default Home
