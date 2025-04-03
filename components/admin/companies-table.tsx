"use client"

import { useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Users, Edit, Trash2, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EditCompanyDialog } from "@/components/admin/edit-company-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Company {
  id: string
  name: string
  planType: string
  maxSeats: number
  usedSeats: number
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  trialEndsAt: Date | null
  createdAt: Date
  _count: {
    users: number
  }
}

interface CompaniesTableProps {
  companies: Company[]
}

const planColors = {
  FREE_TRIAL: "bg-blue-500",
  STARTER: "bg-green-500",
  PRO: "bg-purple-500",
  ENTERPRISE: "bg-orange-500",
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")

  const handleDeleteCompany = async () => {
    if (!deleteCompany) return

    setIsLoading((prev) => ({ ...prev, [deleteCompany.id]: true }))

    try {
      const response = await fetch(`/api/admin/companies/${deleteCompany.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete company")
      }

      toast({
        title: "Company deleted",
        description: `${deleteCompany.name} has been deleted successfully.`,
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete company",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [deleteCompany.id]: false }))
      setDeleteCompany(null)
    }
  }

  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Company Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "planType",
      header: "Plan",
      cell: ({ row }) => {
        const plan = row.getValue("planType") as string
        return (
          <Badge variant="outline" className={`${planColors[plan as keyof typeof planColors]} text-white`}>
            {plan.charAt(0) + plan.slice(1).toLowerCase().replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "maxSeats",
      header: "Seats",
      cell: ({ row }) => {
        const company = row.original
        return (
          <div>
            {company._count.users} / {company.maxSeats}
          </div>
        )
      },
    },
    {
      accessorKey: "stripeSubscriptionId",
      header: "Subscription",
      cell: ({ row }) => {
        const subscriptionId = row.getValue("stripeSubscriptionId") as string | null
        return subscriptionId ? (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            None
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div>{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const company = row.original
        const isLoadingAction = isLoading[company.id] || false

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                {isLoadingAction ? <LoadingSpinner size={16} /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditCompany(company)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => (window.location.href = `/admin/companies/${company.id}/users`)}>
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => (window.location.href = `/admin/companies/${company.id}/subscription`)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteCompany(company)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: companies,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div>
      <div className="flex items-center justify-between p-4">
        <Input
          placeholder="Search companies..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No companies found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 p-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} company(s) found.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      {/* Edit Company Dialog */}
      {editCompany && (
        <EditCompanyDialog
          company={editCompany}
          open={!!editCompany}
          onOpenChange={(open) => !open && setEditCompany(null)}
        />
      )}

      {/* Delete Company Confirmation */}
      <AlertDialog open={!!deleteCompany} onOpenChange={(open) => !open && setDeleteCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteCompany?.name}? This action cannot be undone and will remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

