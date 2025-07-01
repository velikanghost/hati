import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppSelector } from '@/store/hooks'
import { useGetOperationsQuery } from '@/store/api/merchantApi'
import { MerchantTransactions } from '@/lib/types/all'

const DataTable = () => {
  const merchantEvmAddress = useAppSelector(
    (state) => state.merchant.merchantEvmAddress,
  )

  const { data: operationsData } = useGetOperationsQuery(
    merchantEvmAddress || '0x0cf76957AF81329917E7c29f8cbf9b8FAd7842ce',
  )

  const allMerchantOperations = operationsData?.all || []

  const handleActionClick = async (row: MerchantTransactions) => {
    if (!row.hash || !row.destinationFormatted) {
      console.error('Missing transaction hash or destination chain')
      return
    }
  }

  const columns: ColumnDef<MerchantTransactions>[] = [
    {
      accessorKey: 'hash',
      header: 'Transaction Hash',
      cell: ({ row }) => {
        const hash: string = row.getValue('hash')

        return (
          <div className="lowercase">{`${hash.substring(
            0,
            8,
          )}...........${hash.substring(56)}`}</div>
        )
      },
    },
    {
      accessorKey: 'sourceFormatted',
      header: 'Source',
      cell: ({ row }) => (
        <div className="">{row.getValue('sourceFormatted')}</div>
      ),
    },
    {
      accessorKey: 'protocol',
      header: 'Protocol',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('protocol')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('status')}</div>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'))
        const formatted = amount / 1000000

        return <div className="font-medium text-right">{formatted}</div>
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        if (row.original.status === 'pending') {
          return (
            <Button
              variant="nav"
              className="px-2 py-1 capitalize rounded text-secondary-foreground btn-primary"
              onClick={() => handleActionClick(row.original)}
            >
              Redeem
            </Button>
          )
        } else {
          return (
            <Button
              variant="nav"
              className="px-2 py-1 capitalize rounded text-secondary-foreground btn-primary"
              disabled
            >
              Finalized
            </Button>
          )
        }
      },
    },
  ]

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [statusFilter, setStatusFilter] = React.useState<string>('')

  // Update column filters when status changes
  React.useEffect(() => {
    setColumnFilters((filters) => [
      ...filters.filter((filter) => filter.id !== 'status'),
      ...(statusFilter ? [{ id: 'status', value: statusFilter }] : []),
    ])
  }, [statusFilter])

  const table = useReactTable({
    data: allMerchantOperations,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="absolute right-0 flex items-center justify-between mb-4 -top-1 bg-primary-foreground">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1 border rounded text-secondary-foreground"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="border rounded-[4px]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-base text-center"
                >
                  No results.
                  <br />
                  Connect wallet to see your incoming payments.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end py-4 space-x-2">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-secondary-foreground rounded-[4px]"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-secondary-foreground rounded-[4px]"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DataTable
