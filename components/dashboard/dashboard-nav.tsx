"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, ListTodo, FileText, Settings, Home, UserPlus, PieChart, CreditCard } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DashboardNavProps extends React.HTMLAttributes<HTMLElement> {}

export function DashboardNav({ className, ...props }: DashboardNavProps) {
  const pathname = usePathname()

  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Leads",
      href: "/dashboard/leads",
      icon: UserPlus,
    },
    {
      title: "Customers",
      href: "/dashboard/customers",
      icon: Users,
    },
    {
      title: "Tasks",
      href: "/dashboard/tasks",
      icon: ListTodo,
    },
    {
      title: "Files",
      href: "/dashboard/files",
      icon: FileText,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: PieChart,
    },
    {
      title: "Team",
      href: "/dashboard/team",
      icon: Users,
    },
    {
      title: "Billing",
      href: "/dashboard/settings?tab=billing",
      icon: CreditCard,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <nav className={cn("flex flex-col space-y-2", className)} {...props}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Button
            key={item.href}
            variant={isActive ? "default" : "ghost"}
            className={cn(
              "justify-start h-10",
              isActive
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                : "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400",
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-5 w-5" />
              {item.title}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}

