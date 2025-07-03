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

  const filtered = useMemo(() => {
    if (!query) return tokens
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name?.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query, tokens])

  if (!isOpen) return null

  const formatBalance = (tk: TokenBalance) => {
    try {
      const raw = BigInt(tk.amount)
      const divisor = 10n ** BigInt(tk.decimals)
      const whole = Number(raw / divisor)
      return whole.toLocaleString()
    } catch {
      return '0'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-w-lg w-full h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

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

        {/* Content */}
        <div className="flex-1 p-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No tokens found</div>
          ) : (
            filtered.map((token) => (
              <button
                key={token.token_address}
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
                    <p className="font-medium text-[#0B263F]">{token.symbol}</p>
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
      </DialogContent>
    </Dialog>
  )
}
