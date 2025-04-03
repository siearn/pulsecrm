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
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Shield, UserX } from "lucide-react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface User {
  id: string
  clerkId: string | null
  name: string | null
  email: string
  image: string | null
  role: string
  createdAt: Date
}

interface TeamTableProps {
  teamMembers: User[]
  isAdmin: boolean
  currentUserId: string
}

const roleLabels = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
  SUPER_ADMIN: "Super Admin",
}

export function TeamTable({ teamMembers, isAdmin, currentUserId }: TeamTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<string>("")
  const [removeUser, setRemoveUser] = useState<User | null>(null)

  const handleChangeRole = async () => {
    if (!changeRoleUser || !newRole) return

    setIsLoading((prev) => ({ ...prev, [changeRoleUser.id]: true }))

    try {
      const response = await fetch(`/api/users/${changeRoleUser.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to change role")
      }

      toast({
        title: "Role updated",
        description: `${changeRoleUser.name || changeRoleUser.email}'s role has been updated to ${roleLabels[newRole as keyof typeof roleLabels]}.`,
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change role",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [changeRoleUser.id]: false }))
      setChangeRoleUser(null)
    }
  }

  const handleRemoveUser = async () => {
    if (!removeUser) return

    setIsLoading((prev) => ({ ...prev, [removeUser.id]: true }))

    try {
      const response = await fetch(`/api/users/${removeUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to remove user")
      }

      toast({
        title: "User removed",
        description: `${removeUser.name || removeUser.email} has been removed from your team.`,
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove user",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [removeUser.id]: false }))
      setRemoveUser(null)
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name || ""} />
              ) : (
                <AvatarFallback>
                  {user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="font-medium">{user.name || "No name"}</div>
            {user.id === currentUserId && (
              <Badge variant="outline" className="ml-2">
                You
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return <Badge variant="outline">{roleLabels[role as keyof typeof roleLabels] || role}</Badge>
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Joined
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
        const user = row.original
        const isCurrentUser = user.id === currentUserId
        const isLoadingAction = isLoading[user.id] || false
        const canManageUser = isAdmin && !isCurrentUser && user.role !== "SUPER_ADMIN"

        return canManageUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                {isLoadingAction ? <LoadingSpinner size={16} /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setChangeRoleUser(user)
                  setNewRole(user.role)
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setRemoveUser(user)}>
                <UserX className="mr-2 h-4 w-4" />
                Remove User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null
      },
    },
  ]

  const table = useReactTable({
    data: teamMembers,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
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
                No team members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 py-4 px-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={!!changeRoleUser} onOpenChange={(open) => !open && setChangeRoleUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {changeRoleUser?.name || changeRoleUser?.email}. Different roles have different
              permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                <strong>Admin:</strong> Can manage team members, billing, and all company settings.
              </p>
              <p>
                <strong>Manager:</strong> Can manage leads and invite team members, but cannot change billing.
              </p>
              <p>
                <strong>User:</strong> Can only access and manage assigned leads and tasks.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation */}
      <AlertDialog open={!!removeUser} onOpenChange={(open) => !open && setRemoveUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeUser?.name || removeUser?.email} from your team? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

