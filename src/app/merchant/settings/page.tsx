'use client'

import MerchantDashboardLayout from '@/components/layouts/merchantDashboard'

export default function SettingsPage() {
  return (
    <MerchantDashboardLayout>
      <div className="h-full p-6">
        <h1 className="text-3xl font-bold" style={{ color: '#1D1D22' }}>
          Settings
        </h1>
        <p className="mt-1 text-gray-600">
          Manage your merchant profile and payment preferences
        </p>
      </div>
    </MerchantDashboardLayout>
  )
}
