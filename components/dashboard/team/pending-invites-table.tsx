"use client"

import { useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { MoreHorizontal, X, Clock } from "lucide-react"

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
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Invite {
  id: string
  email: string
  name?: string | null
  role: string
  token: string
  expires: Date
  createdAt: Date
}

interface PendingInvitesTableProps {
  invites: Invite[]
  canManage: boolean
}

export function PendingInvitesTable({ invites, canManage }: PendingInvitesTableProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

  const cancelInvite = async (token: string) => {
    setIsLoading((prev) => ({ ...prev, [token]: true }))

    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to cancel invitation")
      }

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled successfully.",
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel invitation",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [token]: false }))
    }
  }

  const resendInvite = async (token: string) => {
    setIsLoading((prev) => ({ ...prev, [token]: true }))

    try {
      const response = await fetch(`/api/invites/${token}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to resend invitation")
      }

      toast({
        title: "Invitation resent",
        description: "The invitation has been resent successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend invitation",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [token]: false }))
    }
  }

  const columns: ColumnDef<Invite>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="font-medium">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div>{row.getValue("name") || "-"}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return <Badge variant="outline">{role.charAt(0) + role.slice(1).toLowerCase()}</Badge>
      },
    },
    {
      accessorKey: "expires",
      header: "Expires",
      cell: ({ row }) => {
        const expires = new Date(row.getValue("expires"))
        const now = new Date()
        const isExpired = expires < now

        return (
          <div className="flex items-center">
            {isExpired ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <X className="h-3 w-3" /> Expired
              </Badge>
            ) : (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {expires.toLocaleDateString()}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Sent",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invite = row.original
        const isLoadingAction = isLoading[invite.token] || false

        return canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                {isLoadingAction ? <LoadingSpinner size={16} /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => resendInvite(invite.token)}>Resend Invitation</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => cancelInvite(invite.token)}>
                Cancel Invitation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null
      },
    },
  ]

  const table = useReactTable({
    data: invites,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  })

  return (
    <div>
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
                No pending invitations.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4 px-4">
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
      )}
    </div>
  )
}

