'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Image,
  List,
  ListOrdered,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Undo,
  Redo,
  Type,
  Palette,
  Highlighter,
  Minus,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NoteEditorToolbarProps {
  editor: Editor | null
}

export function NoteEditorToolbar({ editor }: NoteEditorToolbarProps) {
  if (!editor) return null

  const [fontSize, setFontSize] = useState(11)
  const [fontFamily, setFontFamily] = useState('Arial')

  const toggleBold = () => editor.chain().focus().toggleBold().run()
  const toggleItalic = () => editor.chain().focus().toggleItalic().run()
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run()
  const toggleStrike = () => editor.chain().focus().toggleStrike().run()

  const setHeading = (level: 1 | 2 | 3 | 4) => {
    editor.chain().focus().toggleHeading({ level }).run()
  }

  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run()
  const toggleTaskList = () => editor.chain().focus().toggleTaskList().run()

  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    editor.chain().focus().setTextAlign(align).run()
  }

  const increaseIndent = () => editor.chain().focus().sinkListItem('listItem').run()
  const decreaseIndent = () => editor.chain().focus().liftListItem('listItem').run()

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const insertHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run()
  }

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="p-3 max-w-full overflow-x-auto">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Text Style Dropdown */}
          <Select defaultValue="normal">
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Normal text" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal text</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Family Dropdown */}
          <Select defaultValue="Arial">
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Arial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Size Controls */}
          <div className="flex items-center gap-1 border border-border rounded px-2 h-9">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7"
              onClick={() => setFontSize(Math.max(6, fontSize - 1))}
              title="Decrease font size"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Math.max(6, Math.min(400, parseInt(e.target.value) || 11)))}
              className="w-10 text-center text-sm focus:outline-none"
              min="6"
              max="400"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7"
              onClick={() => setFontSize(Math.min(400, fontSize + 1))}
              title="Increase font size"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Text Formatting */}
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBold}
            title="Bold (Ctrl+B)"
            className="h-9"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleItalic}
            title="Italic (Ctrl+I)"
            className="h-9"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleUnderline}
            title="Underline (Ctrl+U)"
            className="h-9"
          >
            <Underline className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleStrike}
            title="Strikethrough"
            className="h-9"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Color & Highlight */}
          <Button
            variant="ghost"
            size="sm"
            title="Text color"
            className="h-9"
          >
            <Palette className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Highlight"
            className="h-9"
          >
            <Highlighter className="w-4 h-4" />
          </Button>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={insertLink}
            title="Insert link (Ctrl+K)"
            className="h-9"
          >
            <Link className="w-4 h-4" />
          </Button>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Alignment */}
          <Button
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlign('left')}
            title="Align left"
            className="h-9"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlign('center')}
            title="Align center"
            className="h-9"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlign('right')}
            title="Align right"
            className="h-9"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlign('justify')}
            title="Justify"
            className="h-9"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Lists */}
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleBulletList}
            title="Bullet list (Ctrl+Shift+8)"
            className="h-9"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleOrderedList}
            title="Numbered list (Ctrl+Shift+7)"
            className="h-9"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive('taskList') ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleTaskList}
            title="Checklist (Ctrl+Shift+9)"
            className="h-9"
          >
            <CheckSquare className="w-4 h-4" />
          </Button>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Indentation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={decreaseIndent}
            title="Decrease indent (Ctrl+[)"
            className="h-9"
          >
            <Outdent className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={increaseIndent}
            title="Increase indent (Ctrl+])"
            className="h-9"
          >
            <Indent className="w-4 h-4" />
          </Button>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Insert */}
          <Button
            variant="ghost"
            size="sm"
            onClick={insertImage}
            title="Insert image"
            className="h-9"
          >
            <Image className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertHorizontalRule}
            title="Insert horizontal rule"
            className="h-9"
          >
            <Minus className="w-4 h-4" />
          </Button>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
            className="h-9"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo (Ctrl+Shift+Z)"
            className="h-9"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
