import { Button } from '@/components/ui/button'
import { Token } from '@/lib/types'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchTokenPrice } from '@/store/slices/connectSlice'
import { useEffect } from 'react'
import { Tab } from '@/lib/types/all'

interface Props {
  network: string
  token: Token
  amount: number
  setActiveTab?: (value: Tab) => void
  setTransferAmount?: (value: string) => void
  price: number
}

const UserLayer = ({ network, token, amount, setActiveTab, price }: Props) => {
  const dispatch = useAppDispatch()
  const { bridgeComplete } = useAppSelector((state) => state.bridge)

  useEffect(() => {
    const fetch = async () => {
      dispatch(fetchTokenPrice(token.symbol.toLowerCase()))
    }
    fetch()
  }, [token.symbol, dispatch]) // Remove selectedToken.symbol to prevent unnecessary re-fetches

  const getConversion = (
    amountInUsd: number,
    token: string,
    p: string | number,
  ): number => {
    let converted
    const price = typeof p === 'string' ? parseFloat(p) : p

    switch (token) {
      case 'eth':
        converted = amountInUsd / price
        break
      case 'weth':
        converted = amountInUsd / price
        break
      case 'usdt':
        converted = amountInUsd * price
        break
      case 'usdc':
        converted = amountInUsd * price
        break
      default:
        converted = amountInUsd
        break
    }
    return Number(converted.toFixed(4))
  }

  return (
    <div className="my-3 token-swap-card">
      <h4>You {bridgeComplete ? 'paid' : 'pay'}</h4>
      <div className="pb-3 swap-area">
        <span className="token-swap__amount">
          {getConversion(amount, token.symbol.toLowerCase(), price) || '--'}
        </span>

        <div className="token-swap__details">
          <div className="token-image-details">
            <img
              src={`/images/tokens/${token.symbol.toLowerCase()}.svg`}
              alt="token"
              className="token-image"
              width={40}
              height={40}
            />
            <img
              src={`/images/chains/${network.split(' ')[0].toLowerCase()}.svg`}
              alt="token"
              className="network-image"
              width={20}
              height={20}
            />
          </div>
          <div className="token-name-details">
            <div className="token-name">{token.name}</div>
            <div className="network-name">
              <span style={{ textTransform: 'capitalize' }}>{network}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 fiat-area">
        <p>
          ${getConversion(amount, 'usdt', '1.01')} from{' '}
          <span style={{ textTransform: 'capitalize' }}>{network}</span>
        </p>
        {bridgeComplete ? null : (
          <Button
            className="p-0 mb-0 btn-secondary change-token-btn"
            style={{ padding: '8px 12px', borderRadius: '17px' }}
            onClick={() => setActiveTab && setActiveTab('SELECT_TOKEN')}
          >
            <span className="mr-1">Change token | chain</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export default UserLayer
