import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface PaymentConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onNewTransaction: () => void
  txHash?: string
}

export const PaymentConfirmationModal = ({
  isOpen,
  onClose,
  onNewTransaction,
  txHash,
}: PaymentConfirmationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 mb-4 text-green-500">
            <CheckCircle className="w-full h-full" />
          </div>

          <h2 className="mb-2 text-2xl font-semibold text-[#0B263F]">
            Your payment is successful
          </h2>

          {txHash && (
            <div className="w-full p-4 mb-6 text-sm bg-gray-50 rounded-xl">
              <p className="mb-2 font-medium text-[#0B263F]">
                Check the details of your transaction
              </p>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                here
              </a>
            </div>
          )}

          <div className="flex flex-col w-full gap-3">
            <Button
              onClick={onNewTransaction}
              className="w-full bg-[#0B263F] hover:bg-[#0B263F]/90"
            >
              Make new payment
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-[#0B263F] text-[#0B263F]"
            >
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
