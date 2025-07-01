import DataTable from '@/components/table'
import { useAppSelector } from '@/store/hooks'
import { useGetOperationsQuery } from '@/store/api/merchantApi'
import MerchantNavbar from '@/components/layouts/merchantNavbar'

const Merchant = () => {
  const { merchantEvmAccount } = useAppSelector((state) => state.merchant)

  // RTK Query hook - automatically handles loading, error, and data states
  const {
    data: operations,
    isLoading,
    error,
  } = useGetOperationsQuery(merchantEvmAccount.address, {
    skip: !merchantEvmAccount.address, // Skip query if no address
  })

  const allMerchantOperations = operations?.all || []
  const merchantPendingOperations = operations?.pending || []

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#1F2026]">
        <MerchantNavbar />
        <div className="container flex flex-col items-center justify-center flex-1 px-6 mx-auto mt-10 text-secondary">
          <p>Loading operations...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#1F2026]">
        <MerchantNavbar />
        <div className="container flex flex-col items-center justify-center flex-1 px-6 mx-auto mt-10 text-secondary">
          <p>Error loading operations. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#1F2026]">
      <MerchantNavbar />
      <div className="container flex flex-col items-center justify-center flex-1 px-6 mx-auto mt-10 text-secondary lg:items-start">
        <div className="flex flex-col items-start justify-start w-full gap-6 md:items-center md:flex-row md:flex-wrap">
          <div className="border border-secondary rounded-[4px] p-6 min-w-[250px]">
            <h2 className="flex items-center justify-between text-base font-semibold">
              Total Transactions
            </h2>
            <p className="text-3xl font-medium">
              {allMerchantOperations.length}
            </p>
          </div>

          <div className="border border-secondary rounded-[4px] p-6 min-w-[250px]">
            <h2 className="flex items-center justify-between text-base font-semibold">
              Pending Transactions
            </h2>
            <p className="text-3xl font-medium">
              {merchantPendingOperations.length}
            </p>
          </div>

          <div className="border border-secondary rounded-[4px] p-6 min-w-[250px]">
            <h2 className="flex items-center justify-between text-base font-semibold">
              Complete Transactions
            </h2>
            <p className="text-3xl font-medium">
              {Math.abs(
                allMerchantOperations.length - merchantPendingOperations.length,
              )}
            </p>
          </div>
        </div>

        <div className="relative w-full mt-10">
          <h2 className="mb-3 text-xl font-semibold">Recent Payments</h2>
          <DataTable />
        </div>
      </div>
    </div>
  )
}

export default Merchant
