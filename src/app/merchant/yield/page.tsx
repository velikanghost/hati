'use client'

import MerchantDashboardLayout from '@/components/layouts/merchantDashboard'

export default function YieldPage() {
  return (
    <MerchantDashboardLayout>
      <div className="h-full p-6">
        <h1 className="text-3xl font-bold" style={{ color: '#1D1D22' }}>
          Yield Optimization
        </h1>
        <p className="mt-1 text-gray-600">
          Automated DeFi yield strategies for your USDC balance
        </p>
      </div>
    </MerchantDashboardLayout>
  )
}
