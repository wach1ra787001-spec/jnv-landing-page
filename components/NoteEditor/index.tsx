'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'
import FontSize from '@tiptap/extension-font-size'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { NoteEditorToolbar } from './Toolbar'
import { SuggestionChips } from './SuggestionChips'
import { SaveStatus } from './SaveStatus'

interface NoteEditorProps {
  initialContent?: Record<string, any> | null
  noteId?: string
  tradId?: string
  onSave?: (content: Record<string, any>, wordCount: number, title: string) => void
}

export function NoteEditor({ initialContent, noteId, tradId, onSave }: NoteEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [wordCount, setWordCount] = useState(0)
  const [title, setTitle] = useState('Untitled')
  const [showSuggestions, setShowSuggestions] = useState(!initialContent)
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
      CharacterCount.configure({
        limit: null,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-4',
        },
        nested: true,
      }),
    ],
    content: initialContent || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const words = editor.storage.characterCount?.words?.() || 0
      setWordCount(words)
      
      // Extract title
      const extractedTitle = extractTitleFromContent(json)
      setTitle(extractedTitle)

      // Clear existing timer
      if (saveTimer) clearTimeout(saveTimer)

      // Set new save timer
      setSaveStatus('saving')
      const timer = setTimeout(() => {
        if (onSave) {
          onSave(json, words, extractedTitle)
        }
        setSaveStatus('saved')
      }, 1000)

      setSaveTimer(timer)
    },
    onCreate: ({ editor }) => {
      setShowSuggestions(editor.isEmpty)
    },
  })

  useEffect(() => {
    if (!editor) return

    if (editor.isEmpty) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [editor])

  const extractTitleFromContent = (content: Record<string, any>): string => {
    if (!content?.content?.length) return 'Untitled'

    for (const node of content.content) {
      if (node.type === 'heading' && node.content?.[0]?.text) {
        return node.content[0].text
      }
      if (node.type === 'paragraph' && node.content?.[0]?.text) {
        return node.content[0].text.substring(0, 60)
      }
    }

    return 'Untitled'
  }

  const insertTemplate = useCallback(
    (templateContent: string) => {
      if (editor) {
        editor.commands.setContent(templateContent)
        setShowSuggestions(false)
      }
    },
    [editor]
  )

  if (!editor) return null

  return (
    <div className="min-h-screen bg-[#f0f4f9]">
      {/* Toolbar */}
      <NoteEditorToolbar editor={editor} />

      {/* Header */}
      <div className="bg-[#f0f4f9] sticky top-12 z-40 px-4 py-3 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{wordCount} words</p>
          </div>
          <SaveStatus status={saveStatus} />
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex justify-center py-6 px-4">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-sm p-24 min-h-[1056px]">
          {showSuggestions && editor.isEmpty && (
            <SuggestionChips onSelect={insertTemplate} />
          )}
          <EditorContent editor={editor} className="text-foreground" />
        </div>
      </div>
    </div>
  )
}
