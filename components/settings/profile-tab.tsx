"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Camera, Upload, Image as ImageIcon } from "lucide-react"
import { detectUserTimezone } from "@/lib/timezone-utils"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone_number: string | null
  avatar_url: string | null
  timezone: string | null
  currency: string
}

export function ProfileTab() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [phoneError, setPhoneError] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [tempAvatarUrl, setTempAvatarUrl] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    timezone: "UTC",
    currency: "USD",
  })

  // Timezone options - IANA format for proper daylight savings support
  const timezoneOptions = [
    { value: "UTC", label: "UTC" },
    // Africa
    { value: "Africa/Cairo", label: "Cairo, Africa" },
    { value: "Africa/Johannesburg", label: "Johannesburg, Africa" },
    { value: "Africa/Lagos", label: "Lagos, Africa" },
    { value: "Africa/Nairobi", label: "Nairobi, Africa" },
    // Asia
    { value: "Asia/Bangkok", label: "Bangkok, Asia" },
    { value: "Asia/Dubai", label: "Dubai, Asia" },
    { value: "Asia/Hong_Kong", label: "Hong Kong, Asia" },
    { value: "Asia/Jakarta", label: "Jakarta, Asia" },
    { value: "Asia/Kolkata", label: "Kolkata, Asia" },
    { value: "Asia/Shanghai", label: "Shanghai, Asia" },
    { value: "Asia/Singapore", label: "Singapore, Asia" },
    { value: "Asia/Tokyo", label: "Tokyo, Asia" },
    // Europe
    { value: "Europe/Amsterdam", label: "Amsterdam, Europe" },
    { value: "Europe/Berlin", label: "Berlin, Europe" },
    { value: "Europe/London", label: "London, Europe" },
    { value: "Europe/Paris", label: "Paris, Europe" },
    { value: "Europe/Moscow", label: "Moscow, Europe" },
    { value: "Europe/Zurich", label: "Zurich, Europe" },
    // Americas
    { value: "America/New_York", label: "New York, America" },
    { value: "America/Chicago", label: "Chicago, America" },
    { value: "America/Denver", label: "Denver, America" },
    { value: "America/Los_Angeles", label: "Los Angeles, America" },
    { value: "America/Toronto", label: "Toronto, America" },
    { value: "America/Mexico_City", label: "Mexico City, America" },
    { value: "America/Buenos_Aires", label: "Buenos Aires, America" },
    { value: "America/Sao_Paulo", label: "São Paulo, America" },
    // Oceania
    { value: "Australia/Brisbane", label: "Brisbane, Australia" },
    { value: "Australia/Sydney", label: "Sydney, Australia" },
    { value: "Australia/Melbourne", label: "Melbourne, Australia" },
    { value: "Australia/Perth", label: "Perth, Australia" },
    { value: "Pacific/Auckland", label: "Auckland, Pacific" },
    { value: "Pacific/Fiji", label: "Fiji, Pacific" },
    { value: "Pacific/Honolulu", label: "Honolulu, Pacific" },
  ]

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone_number, avatar_url, timezone, currency")
          .eq("id", user.id)
          .single()

        if (error) throw error

        setProfile(data)
        setAvatarUrl(data?.avatar_url || "")
        setTempAvatarUrl(data?.avatar_url || "")

        // Parse full_name into first and last name
        const fullName = data?.full_name || ""
        const nameParts = fullName.split(" ")
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || ""

        const browserTimezone = detectUserTimezone()
        const storedTimezone = data?.timezone || "UTC"
        const timezone = browserTimezone || storedTimezone

        setFormData({
          firstName,
          lastName,
          email: data?.email || "",
          phoneNumber: data?.phone_number || "",
          timezone,
          currency: data?.currency || "USD",
        })

        if (browserTimezone && browserTimezone !== storedTimezone) {
          const { error: timezoneError } = await supabase
            .from("profiles")
            .update({ timezone: browserTimezone })
            .eq("id", user.id)

          if (timezoneError) {
            console.error("Error syncing browser timezone:", timezoneError)
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [supabase])

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true // Optional field
    const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/
    return phoneRegex.test(phone)
  }

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phoneNumber: value })
    if (value && !validatePhoneNumber(value)) {
      setPhoneError("Please enter a valid phone number including country code")
    } else {
      setPhoneError("")
    }
  }

  // Handle file upload for avatar
  const handleFileUpload = async (file: File) => {
    setAvatarError("")
    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Unable to upload profile picture")
      }

      setAvatarUrl(result.url)
      setTempAvatarUrl(result.url)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setAvatarError(error instanceof Error ? error.message : "Unable to upload profile picture")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFileUpload(file)
    e.target.value = ""
  }

  const handleAvatarUrlSubmit = () => {
    const trimmedUrl = tempAvatarUrl.trim()
    if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
      setAvatarError("Enter a valid image URL starting with http:// or https://")
      return
    }

    setAvatarError("")
    setAvatarUrl(trimmedUrl)
    setTempAvatarUrl(trimmedUrl)
    setIsAvatarDialogOpen(false)
  }

  const handleSave = async () => {
    // Validate phone before saving
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      setPhoneError("Please enter a valid phone number including country code")
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      const savedAvatarUrl = tempAvatarUrl.trim() || avatarUrl.trim()

      const { data: savedProfile, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          email: formData.email || user.email || "",
          phone_number: formData.phoneNumber || null,
          avatar_url: savedAvatarUrl || null,
          timezone: formData.timezone,
          currency: formData.currency,
        }, { onConflict: "id" })
        .select("id, full_name, email, phone_number, avatar_url, timezone, currency")
        .single()

      if (error) throw error
      if (!savedProfile || savedProfile.avatar_url !== (savedAvatarUrl || null)) {
        throw new Error("The profile picture could not be confirmed in the database")
      }

      setAvatarUrl(savedAvatarUrl)
      setProfile((current) => current ? { ...current, full_name: fullName, email: formData.email, phone_number: formData.phoneNumber || null, avatar_url: savedAvatarUrl || null, timezone: formData.timezone, currency: formData.currency } : current)
      setTempAvatarUrl(savedAvatarUrl)
      setAvatarError("")
      router.refresh()
    } catch (error) {
      console.error("Error saving profile:", error)
      setAvatarError(error instanceof Error ? error.message : "Unable to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading profile...</div>
  }

  const initials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Profile avatar"
              className="w-20 h-20 rounded-full object-cover bg-accent"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
              <span className="text-2xl font-semibold text-accent-foreground">{initials || "??"}</span>
            </div>
          )}
          <button 
            onClick={() => setIsAvatarDialogOpen(true)}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {formData.firstName} {formData.lastName}
          </h3>
          <p className="text-sm text-muted-foreground">Pro Trader</p>
        </div>
      </div>

      {/* Avatar Selection Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Choose how to update your profile picture
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Upload from device */}
            <div>
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Upload from device</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG up to 2MB</span>
                </div>
              </label>
              <input 
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                ref={fileInputRef}
                className="hidden"
              />
            </div>

            {/* Or use URL */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Avatar URL input */}
            <div className="space-y-2">
              <Label htmlFor="avatar-url" className="text-sm font-medium text-foreground">
                Avatar URL
              </Label>
              <Input
                id="avatar-url"
                placeholder="https://example.com/avatar.jpg"
                value={tempAvatarUrl}
                onChange={(e) => setTempAvatarUrl(e.target.value)}
                className="bg-background"
              />
            </div>

            {isUploadingAvatar && <p className="text-sm text-muted-foreground">Uploading image...</p>}
            {avatarError && <p className="text-sm text-destructive" role="alert">{avatarError}</p>}

            {/* Preview */}
            {tempAvatarUrl && (
              <div className="flex flex-col items-center gap-2 rounded-lg bg-secondary p-3">
                <img src={tempAvatarUrl} alt="Profile picture preview" className="size-20 rounded-full object-cover" onError={() => setAvatarError("This image URL could not be loaded.")} />
                <p className="text-xs text-muted-foreground">Save your profile to apply this picture.</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAvatarDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAvatarUrlSubmit}
                disabled={isUploadingAvatar || !tempAvatarUrl}
                className="flex-1"
              >
                Set Avatar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
              First Name
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+254 712 345 678"
              className="bg-background"
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Include country code e.g. +254 712 345 678
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium text-foreground">
              Time Zone
            </Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Trading Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h4 className="text-sm font-semibold text-foreground whitespace-nowrap">
            Trading Information
          </h4>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium text-foreground">
              Account Currency
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {/* Major Currencies */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Major</div>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
                <SelectItem value="GBP">GBP — British Pound</SelectItem>
                <SelectItem value="JPY">JPY — Japanese Yen</SelectItem>
                <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                <SelectItem value="CHF">CHF — Swiss Franc</SelectItem>
                <SelectItem value="NZD">NZD — New Zealand Dollar</SelectItem>

                {/* African Currencies */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">African</div>
                <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
                <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
                <SelectItem value="GHS">GHS — Ghanaian Cedi</SelectItem>
                <SelectItem value="TZS">TZS — Tanzanian Shilling</SelectItem>
                <SelectItem value="UGX">UGX — Ugandan Shilling</SelectItem>
                <SelectItem value="EGP">EGP — Egyptian Pound</SelectItem>
                <SelectItem value="MAD">MAD — Moroccan Dirham</SelectItem>

                {/* Asian / Middle East */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Asian / Middle East</div>
                <SelectItem value="SGD">SGD — Singapore Dollar</SelectItem>
                <SelectItem value="HKD">HKD — Hong Kong Dollar</SelectItem>
                <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                <SelectItem value="SAR">SAR — Saudi Riyal</SelectItem>
                <SelectItem value="QAR">QAR — Qatari Riyal</SelectItem>
                <SelectItem value="MYR">MYR — Malaysian Ringgit</SelectItem>
                <SelectItem value="THB">THB — Thai Baht</SelectItem>

                {/* Other */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Other</div>
                <SelectItem value="BRL">BRL — Brazilian Real</SelectItem>
                <SelectItem value="MXN">MXN — Mexican Peso</SelectItem>
                <SelectItem value="SEK">SEK — Swedish Krona</SelectItem>
                <SelectItem value="NOK">NOK — Norwegian Krone</SelectItem>
                <SelectItem value="DKK">DKK — Danish Krone</SelectItem>
                <SelectItem value="PLN">PLN — Polish Zloty</SelectItem>
                <SelectItem value="CZK">CZK — Czech Koruna</SelectItem>
                <SelectItem value="HUF">HUF — Hungarian Forint</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This is the currency your P&L and stats are displayed in across the app
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
