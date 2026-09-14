import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false

  if (user) {
    const [{ data: profile }, { data: assignedRoles }] = await Promise.all([
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id),
    ])

    const profileRole = profile?.role?.trim().toLowerCase()
    const metadataRole = String(user.app_metadata?.role ?? user.user_metadata?.role ?? '').trim().toLowerCase()
    const relationRoles = (assignedRoles ?? []).flatMap((assignment) => {
      const role = assignment.roles as unknown as { name?: string } | { name?: string }[] | null
      return Array.isArray(role) ? role.map((item) => item.name) : role?.name ? [role.name] : []
    })
    const roles = [profileRole, metadataRole, ...relationRoles]
      .filter((role): role is string => Boolean(role))
      .map((role) => role.trim().toLowerCase())

    isAdmin = roles.includes('admin') || roles.includes('super_admin')
  }

  return <SettingsClient isAdmin={isAdmin} />
}
