import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { connectWallet, redeemAndFinalize } from '@/store/slices/connectSlice'
import Navbar from '@/components/layouts/navbar'

const Redeem = () => {
  const dispatch = useAppDispatch()
  const { isAwaitingVAA, loading, isRedeemCompleted } = useAppSelector(
    (state) => state.connect,
  )
  const [recoverTxid, setRecoverTxid] = useState<string>('')

  const getAccount = async () => {
    dispatch(connectWallet())
  }

  useEffect(() => {
    getAccount()
  }, [])

  const handleRedeemAndFinalize = async () => {
    if (!recoverTxid.trim()) {
      alert('Please enter a transaction hash')
      return
    }

    dispatch(
      redeemAndFinalize({
        recoverTxid,
        destinationChain: 'ArbitrumSepolia',
      }),
    )
  }
  return (
    <>
      <Navbar />
      <div className="container flex flex-col justify-center items-center mx-auto max-w-[600px] mt-[20%]">
        <h4>Redeem</h4>
        <Input
          type="text"
          placeholder="Tx Hash"
          value={recoverTxid}
          onChange={(e) => setRecoverTxid(e.target.value)}
          className="mt-10"
        />
        '
        <Button
          onClick={handleRedeemAndFinalize}
          variant="default"
          className="btn-primary"
        >
          Redeem
        </Button>
        {isAwaitingVAA ? <p className="text-black">Initializing...</p> : null}
        {loading ? <p className="text-black">Redeeming...</p> : null}
        {isRedeemCompleted ? (
          <p className="text-black">Token bridge complete!</p>
        ) : null}
      </div>
    </>
  )
}

export default Redeem
