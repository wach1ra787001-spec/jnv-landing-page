"use client"

import { useState, useRef, useEffect } from "react"
import { appToast } from "@/lib/toast-utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Tag,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
} from "lucide-react"

interface TradeNotesEditorProps {
  initialNotes?: string
  onSave?: (notes: string) => void
  onClose?: () => void
}

export function TradeNotesEditor({
  initialNotes = "",
  onSave,
  onClose,
}: TradeNotesEditorProps) {
  const [content, setContent] = useState(initialNotes)
  const [showToolbar, setShowToolbar] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const applyFormat = (command: string, value: string = "") => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const insertTemplate = (template: string) => {
    const templates: { [key: string]: string } = {
      entry: "📍 Entry Reason:\n",
      exit: "❌ Exit Reason:\n",
      mistake: "⚠️ Mistake Made:\n",
      lesson: "💡 Lesson Learned:\n",
    }
    applyFormat("insertText", templates[template] || "")
  }

  const handleSave = () => {
    const html = editorRef.current?.innerHTML || ""
    onSave?.(html)
    appToast.notesSaved()
  }

  const handleContentChange = () => {
    setContent(editorRef.current?.innerHTML || "")
  }

  const fontSizes = ["12", "14", "16", "18", "24"]
  const colors = [
    "#10b981", // profit green
    "#ef4444", // loss red
    "#3d52d5", // primary blue
    "#f59e0b", // warning amber
    "#8b5cf6", // purple
  ]

  return (
    <Card className="border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
        <h3 className="font-semibold text-foreground">Add Trade Notes</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="border-b border-border/50 bg-muted/50 p-3 flex flex-wrap gap-2">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-border/50 pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("bold")}
              title="Bold"
              className="h-8 w-8 p-0"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("italic")}
              title="Italic"
              className="h-8 w-8 p-0"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("underline")}
              title="Underline"
              className="h-8 w-8 p-0"
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>

          {/* Font Size */}
          <div className="border-r border-border/50 pr-2">
            <select
              onChange={(e) =>
                applyFormat("fontSize", fontSizes.indexOf(e.target.value) + 1 + "")
              }
              className="h-8 px-2 rounded bg-card border border-border/50 text-sm cursor-pointer"
            >
              <option value="">Size</option>
              {fontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-border/50 pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("justifyLeft")}
              className="h-8 w-8 p-0"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("justifyCenter")}
              className="h-8 w-8 p-0"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("justifyRight")}
              className="h-8 w-8 p-0"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-border/50 pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("insertUnorderedList")}
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("insertOrderedList")}
              className="h-8 w-8 p-0"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-border/50 pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("formatBlock", "h2")}
              className="h-8 w-8 p-0"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Quote */}
          <div className="flex gap-1 border-r border-border/50 pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormat("formatBlock", "blockquote")}
              className="h-8 w-8 p-0"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </Button>
          </div>

          {/* Color Picker */}
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => applyFormat("foreColor", color)}
                className="h-8 w-8 rounded border border-border/50 hover:border-border"
                style={{ backgroundColor: color }}
                title="Text color"
              />
            ))}
          </div>
        </div>
      )}

      {/* Trading Templates */}
      {showToolbar && (
        <div className="border-b border-border/50 bg-muted/30 p-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertTemplate("entry")}
            className="text-xs"
          >
            Entry Reason
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertTemplate("exit")}
            className="text-xs"
          >
            Exit Reason
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertTemplate("mistake")}
            className="text-xs"
          >
            Mistake
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertTemplate("lesson")}
            className="text-xs"
          >
            Lesson Learned
          </Button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onFocus={() => setShowToolbar(true)}
        onBlur={() => !content && setShowToolbar(false)}
        onInput={handleContentChange}
        dangerouslySetInnerHTML={{ __html: initialNotes }}
        className="min-h-64 p-4 outline-none text-foreground bg-card focus:bg-card/90 empty:text-muted-foreground empty:before:content-['Add_your_trade_notes_here...']"
        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
      />

      {/* Footer */}
      {showToolbar && (
        <div className="flex justify-end gap-2 p-4 border-t border-border/50 bg-muted/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-primary">
            Save Notes
          </Button>
        </div>
      )}
    </Card>
  )
}
