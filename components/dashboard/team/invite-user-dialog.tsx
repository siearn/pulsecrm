"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface Company {
  id: string
  name: string
  maxSeats: number
}

interface User {
  id: string
  name: string | null
  email: string
}

interface Invite {
  id: string
  email: string
  role: string
}

interface InviteUserDialogProps {
  trigger: React.ReactNode
  company: Company
  teamMembers: User[]
  pendingInvites: Invite[]
}

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "USER"], {
    required_error: "Please select a role.",
  }),
})

export function InviteUserDialog({ trigger, company, teamMembers, pendingInvites }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "USER",
    },
  })

  // Calculate seats information
  const usedSeats = teamMembers.length
  const pendingSeats = pendingInvites.length
  const availableSeats = company.maxSeats - usedSeats - pendingSeats
  const atCapacity = availableSeats <= 0

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Check if we've reached the seat limit
      if (atCapacity) {
        toast({
          title: "Seat limit reached",
          description: `You've reached your plan's limit of ${company.maxSeats} users. Please upgrade your plan to add more users.`,
          variant: "destructive",
        })
        return
      }

      // Check if the user is already a member
      const existingMember = teamMembers.find((member) => member.email.toLowerCase() === values.email.toLowerCase())

      if (existingMember) {
        toast({
          title: "User already exists",
          description: "This user is already a member of your team.",
          variant: "destructive",
        })
        return
      }

      // Check if there's already a pending invite
      const existingInvite = pendingInvites.find((invite) => invite.email.toLowerCase() === values.email.toLowerCase())

      if (existingInvite) {
        toast({
          title: "Invitation already sent",
          description: "An invitation has already been sent to this email address.",
          variant: "destructive",
        })
        return
      }

      // Make API call to send the invitation
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          name: values.name || undefined,
          role: values.role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send invitation")
      }

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${values.email}.`,
      })

      form.reset()
      setOpen(false)

      // Refresh the page to show the new invitation
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They will receive an email with instructions to set up their account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email*</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading || atCapacity}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {atCapacity ? "No Available Seats" : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        <div className="text-xs text-muted-foreground mt-4">
          {usedSeats + pendingSeats} of {company.maxSeats} seats used • {availableSeats} available
        </div>
      </DialogContent>
    </Dialog>
  )
}

