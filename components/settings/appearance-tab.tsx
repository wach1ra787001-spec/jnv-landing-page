"use client"

import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Sun, Moon, Monitor } from "lucide-react"

const themes = [
  {
    id: "light",
    name: "Light Mode",
    description: "A clean, bright interface for daytime use",
    icon: Sun,
    preview: {
      bg: "#F9FAFB",
      card: "#FFFFFF",
      accent: "#3B82F6",
      text: "#111827",
    },
  },
  {
    id: "dark",
    name: "Dark Mode",
    description: "Easy on the eyes during night trading",
    icon: Moon,
    preview: {
      bg: "#0F172A",
      card: "#1E293B",
      accent: "#3B82F6",
      text: "#F8FAFC",
    },
  },
  {
    id: "system",
    name: "System",
    description: "Automatically match your device settings",
    icon: Monitor,
    preview: {
      bg: "linear-gradient(135deg, #F9FAFB 50%, #0F172A 50%)",
      card: "#FFFFFF",
      accent: "#3B82F6",
      text: "#111827",
    },
  },
]

export function AppearanceTab() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how JNvJournal looks on your device
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((themeOption) => (
          <button
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className={cn(
              "relative border rounded-lg p-4 text-left transition-all hover:border-primary/50",
              theme === themeOption.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            )}
          >
            {/* Preview */}
            <div
              className="w-full h-24 rounded-md mb-4 overflow-hidden border border-border"
              style={{ background: themeOption.preview.bg }}
            >
              <div className="p-2 h-full flex flex-col gap-1.5">
                {/* Preview Header */}
                <div
                  className="h-3 rounded-sm w-1/2"
                  style={{ backgroundColor: themeOption.preview.accent }}
                />
                {/* Preview Cards */}
                <div className="flex-1 flex gap-1.5">
                  <div
                    className="flex-1 rounded-sm"
                    style={{
                      backgroundColor:
                        themeOption.id === "system"
                          ? "rgba(255,255,255,0.8)"
                          : themeOption.preview.card,
                    }}
                  />
                  <div
                    className="flex-1 rounded-sm"
                    style={{
                      backgroundColor:
                        themeOption.id === "system"
                          ? "rgba(30,41,59,0.8)"
                          : themeOption.preview.card,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  theme === themeOption.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                <themeOption.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{themeOption.name}</p>
                <p className="text-xs text-muted-foreground">{themeOption.description}</p>
              </div>
            </div>

            {/* Selected Indicator */}
            {theme === themeOption.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Your theme preference is saved automatically and synced across all your devices.
        </p>
      </div>
    </div>
  )
}
