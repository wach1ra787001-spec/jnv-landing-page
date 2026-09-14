import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileRole = profile?.role
    const metadataRole = user.app_metadata?.role ?? user.user_metadata?.role
    const role = profileRole ?? metadataRole
    isAdmin = role === 'admin' || role === 'super_admin'
  }

  return <SettingsClient isAdmin={isAdmin} />
}
