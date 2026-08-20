import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarProvider } from "@/components/dashboard/sidebar-context"
import { SidebarBackdrop } from "@/components/dashboard/sidebar-backdrop"
import { CTraderAutoSync } from "@/components/dashboard/ctrader-autosync"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AccountProvider } from "@/components/dashboard/account-context"
import { getUserAccounts, getSelectedAccountId } from "@/lib/get-selected-account"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const [accounts, selectedAccountId] = await Promise.all([
    getUserAccounts(supabase, user.id),
    getSelectedAccountId(supabase, user.id),
  ])

  return (
    <SidebarProvider>
      <AccountProvider initialAccounts={accounts} initialSelectedAccountId={selectedAccountId}>
        <div className="flex h-screen overflow-hidden bg-background">
          <CTraderAutoSync />

          {/* Sidebar — overlay, does not take up layout space */}
          <DashboardSidebar user={user} profile={profile} />
          <SidebarBackdrop />

          {/* Content panel — resizes smoothly when sidebar opens */}
          <DashboardShell>
            <DashboardHeader user={user} profile={profile} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden w-full p-3 sm:p-4 md:p-6">
              {children}
            </main>
          </DashboardShell>
        </div>
      </AccountProvider>
    </SidebarProvider>
  )
}
