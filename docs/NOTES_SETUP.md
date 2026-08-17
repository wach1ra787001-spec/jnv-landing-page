# Google Docs-Style Note Editor Setup

## Database Setup

Run the following SQL in your Supabase dashboard to create the notes table:

```sql
-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own notes
CREATE POLICY "users manage own notes" ON notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create image storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', true)
ON CONFLICT DO NOTHING;

-- Storage RLS Policy
CREATE POLICY "Users can upload images to their own folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'note-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own images" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'note-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'note-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Features

### Editor Features
- **Tiptap-based rich text editor** with 40+ formatting options
- **Google Docs-style layout** with white document page (816px wide)
- **Auto-save to Supabase** - saves 1 second after user stops typing
- **Save status indicator** - shows "Saving...", "All changes saved", or error state
- **Full formatting toolbar** with color pickers, font controls, and alignment options
- **Template suggestions** - Trade Notes, Weekly Review, and Daily Journal templates
- **Keyboard shortcuts** - Full Google Docs-style shortcuts (Ctrl+B, Ctrl+Shift+7, etc.)

### Supported Formatting
- Text styles: Bold, Italic, Underline, Strikethrough
- Headings: H1, H2, H3, H4 (with keyboard shortcuts Ctrl+Alt+1-3)
- Lists: Bullet, Numbered, Checklists
- Text formatting: Font family, font size (6-400px), color, highlight
- Alignment: Left, center, right, justify
- Special: Links, images (with Supabase upload), tables
- Indentation: Increase/decrease indent
- Horizontal rules and more

### Keyboard Shortcuts
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + U` - Underline
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + K` - Insert link
- `Ctrl/Cmd + Alt + 1` - Heading 1
- `Ctrl/Cmd + Alt + 2` - Heading 2
- `Ctrl/Cmd + Alt + 3` - Heading 3
- `Ctrl/Cmd + Alt + 0` - Normal text
- `Ctrl/Cmd + Shift + 7` - Numbered list
- `Ctrl/Cmd + Shift + 8` - Bullet list
- `Ctrl/Cmd + Shift + 9` - Checklist
- `Ctrl/Cmd + [` - Decrease indent
- `Ctrl/Cmd + ]` - Increase indent

## Pages & Routes

- `/dashboard/journal/notes` - Notes list page with search and sort
- `/dashboard/journal/notes/[id]` - Individual note editor

## API Endpoints

- `POST /api/notes` - Create a new note
- `GET /api/notes` - List all user notes (supports `?trade_id=` parameter)
- `GET /api/notes/[id]` - Get a specific note
- `PATCH /api/notes/[id]` - Update a note
- `DELETE /api/notes/[id]` - Delete a note

## Components

- `NoteEditor` - Main editor component with toolbar and auto-save
- `Toolbar` - Formatting toolbar with all controls
- `SuggestionChips` - Template suggestions for empty documents
- `SaveStatus` - Save status indicator
- `NoteCard` - Grid card component for notes list

## Integration with Trade Detail

To add notes to the trade detail page, replace the existing notes section with:

```tsx
import { NoteEditor } from '@/components/NoteEditor'

// In your trade detail component:
<Card className="p-6">
  <NoteEditor noteId={noteId} />
</Card>
```

Or link to the notes editor:

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

<Link href={`/dashboard/journal/notes?trade_id=${tradeId}`}>
  <Button>View Notes</Button>
</Link>
```
