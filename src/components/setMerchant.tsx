import { useState } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setMerchantAmount, setMerchantId } from '@/store/slices/connectSlice'
import { Tab } from '@/lib/types/all'
import { Button } from '@/components/ui/button'

interface SelectTokenProps {
  setActiveTab: (value: Tab) => void
}

const SetMerchant = ({ setActiveTab }: SelectTokenProps) => {
  const dispatch = useAppDispatch()
  const { merchantAmount, merchantId } = useAppSelector(
    (state) => state.connect,
  )

  const [data, setData] = useState({
    amt: merchantAmount,
    id: merchantId,
  })

  const setMerchant = async () => {
    dispatch(setMerchantAmount(data.amt))
    dispatch(setMerchantId(data.id))
    setActiveTab('DEFAULT')
  }

  return (
    <>
      <div className="mt-3 mb-4 pay-with-header">
        <BiLeftArrowAlt
          size={30}
          className="mr-auto"
          onClick={() => setActiveTab('DEFAULT')}
          style={{ cursor: 'pointer' }}
        />
      </div>
      <h3 className="mb-4 text-xl font-medium">Input either or both.</h3>
      <div className="flex flex-col">
        <label htmlFor="">Amount in USD</label>
        <input
          type="number"
          name="amount"
          className="px-4 py-3 mt-2 mb-4 rounded text-secondary-foreground"
          placeholder="1"
          min={1}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              amt: e.target.valueAsNumber,
            }))
          }
        />
        <label htmlFor="">Hati Merchant ID (e.g., HT-123)</label>
        <input
          type="text"
          name="address"
          className="px-4 py-3 mt-2 mb-3 rounded text-secondary-foreground"
          placeholder="HT-123"
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              id: e.target.value,
            }))
          }
        />
      </div>
      <Button
        className="w-full p-6 mt-6 rounded"
        variant="secondary"
        onClick={setMerchant}
      >
        Set Merchant
      </Button>
    </>
  )
}

export default SetMerchant
