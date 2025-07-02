'use client'

import MerchantDashboardLayout from '@/components/layouts/merchantDashboard'

export default function MerchantPayments() {
  return (
    <MerchantDashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="mt-1 text-gray-600">
              Welcome back! Here&apos;s your payment gateway overview.
            </p>
          </div>
        </div>
      </div>
    </MerchantDashboardLayout>
  )
}
