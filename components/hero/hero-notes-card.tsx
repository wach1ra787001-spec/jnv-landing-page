import { mockNotesData } from '@/lib/mock/notes-data'

export function HeroNotesCard() {
  const note = mockNotesData[0]

  return (
    <div className="w-full h-full p-4 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col overflow-hidden">
      {/* Note Title */}
      <h3 className="text-sm font-bold text-white mb-2 truncate">{note.title}</h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-200 border border-slate-600/30"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* PnL and Date */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
        <span className={`text-sm font-bold ${note.pnl < 0 ? 'text-red-400' : 'text-green-400'}`}>
          {note.pnl < 0 ? '' : '+'}{note.pnl.toFixed(2)}
        </span>
        <span className="text-xs text-slate-400">{note.date}</span>
      </div>
    </div>
  )
}
