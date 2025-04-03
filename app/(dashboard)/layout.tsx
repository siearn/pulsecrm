import type React from "react"
import { redirect } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = auth()

  if (!userId) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-950 shadow-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <MobileNav />
            <span className="hidden font-bold text-blue-600 md:inline-block">PulseCRM</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserButton
              afterSignOutUrl="/login"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        <aside className="hidden w-[240px] flex-col md:flex lg:w-[280px] overflow-y-auto py-6">
          <DashboardNav />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden py-6">{children}</main>
      </div>
    </div>
  )
}

