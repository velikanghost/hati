import { useEffect } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { Token } from '@/lib/types'
import { Chain } from '@/lib/types/chain'
import { chains } from '@/lib/data/chains'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  setSelectedChain,
  setSelectedToken,
  setTransferAmount,
  fetchTokenPrice,
} from '@/store/slices/connectSlice'
import { Tab } from '@/lib/types/all'

interface SelectTokenProps {
  setActiveTab: (value: Tab) => void
  setToken?: (value: Token) => void
  amount: number
}

const SelectToken = ({ setActiveTab, setToken, amount }: SelectTokenProps) => {
  const dispatch = useAppDispatch()
  const { userTokensInWallet, ethPrice, selectedChain } = useAppSelector(
    (state) => state.connect,
  )

  const getConversion = (amountInUsd: number, token: string): number => {
    let converted

    switch (token) {
      case 'eth':
        converted = amountInUsd / ethPrice
        break
      case 'weth':
        converted = amountInUsd / ethPrice
        break
      case 'usdt':
        converted = amountInUsd
        break
      default:
        converted = amountInUsd
        break
    }

    return Number(converted.toFixed(4))
  }

  useEffect(() => {
    dispatch(setSelectedChain(chains[0]))
    // TODO: Implement getUserTokensInWallet thunk
  }, [dispatch])

  const selectUserToken = async (token: Token) => {
    if (setToken) setToken(token)
    dispatch(fetchTokenPrice(token.symbol.toLowerCase()))
    dispatch(setSelectedToken(token as any))
    const amt = getConversion(amount, token.symbol.toLowerCase())
    dispatch(setTransferAmount(amt.toString()))
    setActiveTab('DEFAULT')
  }

  const handleChainSelect = (chn: Chain) => {
    dispatch(setSelectedChain(chn))
    // TODO: Implement getUserTokensInWallet thunk
  }

  const getBalance = (balance: string, decimals: string) => {
    return parseFloat(balance) / Math.pow(10, parseInt(decimals))
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
        <span className="mr-auto text-muted">Pay with</span>
      </div>
      <div className="mb-4 network-options">
        {chains.map((chn, i) => (
          <div
            key={i}
            onClick={() => handleChainSelect(chn)}
            className={
              selectedChain.title === chn.title ? 'network active' : 'network'
            }
          >
            <img
              src={`/images/chains/${chn?.icon}`}
              alt="token"
              className="network-image"
              width={100}
              height={100}
            />
          </div>
        ))}
      </div>
      {/* <div className="search-form">
        <input type="text" placeholder="Enter token name or address" />
        <BiSearchAlt size={30} />
      </div> */}
      <hr />
      <div className="mt-8 tokens-list">
        {userTokensInWallet.length > 0 ? (
          userTokensInWallet?.map((token, i) => (
            <div
              className="token-details"
              key={i}
              onClick={() => selectUserToken(token)}
            >
              <img
                src={`/images/tokens/${token?.symbol?.toLowerCase()}.svg`}
                alt="token"
                className="token-image"
                width={100}
                height={100}
              />
              <div className="w-full">
                <div className="token-symbol">{token?.symbol}</div>
                <div className="token-name">{token?.name?.toUpperCase()}</div>
              </div>
              <div className="">
                {getBalance(token?.balance!, token?.decimals!)}
              </div>
            </div>
          ))
        ) : (
          <p className="mt-4 text-center">
            No tokens in wallet for the selected network.
          </p>
        )}
      </div>
    </>
  )
}

export default SelectToken
