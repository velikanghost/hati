import React, { useMemo, useState } from 'react'
import { TokenBalance } from '@/hooks/useTokenBalances'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TokenSelectModalProps {
  isOpen: boolean
  onClose: () => void
  tokens: TokenBalance[]
  onSelect: (token: TokenBalance) => void
  loading?: boolean
}

export const TokenSelectModal: React.FC<TokenSelectModalProps> = ({
  isOpen,
  onClose,
  tokens,
  onSelect,
  loading = false,
}) => {
  const [query, setQuery] = useState('')
  const [activeChain, setActiveChain] = useState<
    'all' | 'eth' | 'optimism' | 'arbitrum' | 'base' | 'linea'
  >('all')

  const chainOptions = [
    { key: 'all', label: 'All Chains', icon: '/images/chains/eth.svg' },
    { key: 'arbitrum', label: 'Arbitrum', icon: '/images/chains/arbitrum.svg' },
    { key: 'optimism', label: 'Optimism', icon: '/images/chains/optimism.svg' },
    { key: 'base', label: 'Base', icon: '/images/chains/base.svg' },
    { key: 'linea', label: 'Linea', icon: '/images/chains/linea.svg' },
    { key: 'eth', label: 'Ethereum', icon: '/images/chains/eth.svg' },
  ] as const

  const filtered = useMemo(() => {
    let baseList = tokens
    if (activeChain !== 'all') {
      baseList = tokens.filter(
        (tk) => tk.chain?.toLowerCase() === activeChain.toLowerCase(),
      )
    }
    if (!query) return baseList
    return baseList.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name?.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query, tokens, activeChain])

  if (!isOpen) return null

  const formatBalance = (tk: TokenBalance) => {
    if (!tk.amount_formatted) return '0'
    const num = parseFloat(tk.amount_formatted)
    if (isNaN(num)) return tk.amount_formatted
    // Show up to 6 significant digits, trimming trailing zeros
    return num.toLocaleString(undefined, {
      minimumFractionDigits: num < 1 ? 3 : 0,
      maximumFractionDigits: 6,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        {/* Body split */}
        <div className="flex flex-1 overflow-hidden border-t">
          {/* Sidebar */}
          <div className="w-40 overflow-y-auto border-r">
            {chainOptions.map((ch) => (
              <button
                key={ch.key}
                onClick={() => setActiveChain(ch.key as any)}
                className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100 ${
                  activeChain === ch.key ? 'bg-gray-100 font-semibold' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ch.icon} alt={ch.label} className="w-5 h-5" />
                <span>{ch.label}</span>
              </button>
            ))}
          </div>

          {/* Main list */}
          <div className="flex flex-col flex-1">
            {/* Search */}
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search token..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B263F]/50"
              />
            </div>

            <div className="flex-1 p-2 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No tokens found
                </div>
              ) : (
                filtered.map((token) => (
                  <button
                    key={`${token.chain}-${token.token_address}`}
                    onClick={() => onSelect(token)}
                    className="flex items-center justify-between w-full gap-2 p-3 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {token.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={token.thumbnail}
                          alt={token.symbol}
                          className="object-contain w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-[#0B263F]">
                          {token.symbol.slice(0, 1)}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium text-[#0B263F]">
                          {token.symbol}
                        </p>
                        <p className="text-xs text-gray-500">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      {formatBalance(token)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
