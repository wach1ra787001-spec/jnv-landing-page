# Toast Notification System

The AB Journal uses **Sonner** for elegant, production-grade toast notifications across the entire application.

## Features

- ✨ Smooth animations and transitions
- 📱 Fully responsive and mobile-friendly
- 🎨 Dark mode compatible
- ⚡ Non-blocking UI
- 🎯 Auto-dismisses after 4 seconds
- 🖱️ Manual close option
- 🔄 Loading states for async operations
- 📚 Rich descriptions and contextual messages

## Setup

The Toaster component is globally configured in `app/layout.tsx`:

```tsx
<Toaster richColors position="top-right" />
```

## Usage

### Quick Start

Use the centralized `appToast` utility from `lib/toast-utils.ts`:

```tsx
import { appToast } from '@/lib/toast-utils'

// Success
appToast.tradeSaved('EURUSD', '50.25', '2.5', true)
appToast.notesSaved()
appToast.playBookCreated('My Strategy')

// Error
appToast.tradeSaveFailed()
appToast.sessionExpired()

// Info
appToast.screenshotRemoved()

// Loading
const toastId = appToast.saving('trade data')
// Later: update or replace with success/error
```

### Direct Toast Usage

For custom messages, import from Sonner directly:

```tsx
import { toast } from 'sonner'

toast.success('All trades synced', {
  description: '42 new trades imported'
})

toast.error('Connection failed', {
  description: 'Please check your internet'
})

toast.loading('Processing your request...')
```

## Available Methods

### Success Notifications
- `appToast.tradeSaved(symbol, pnl, pnlPercent, isProfit)`
- `appToast.notesSaved()`
- `appToast.playBookCreated(title)`
- `appToast.screenshotsAdded(count)`
- `appToast.goalsCreated()`
- `appToast.rulesCreated()`
- `appToast.settingsUpdated()`
- `appToast.syncCompleted()`

### Error Notifications
- `appToast.tradeSaveFailed()`
- `appToast.notesSaveFailed()`
- `appToast.invalidForm(fieldName)`
- `appToast.mt5ConnectionFailed()`
- `appToast.sessionExpired()`
- `appToast.uploadFailed()`

### Warning Notifications
- `appToast.unsavedChanges()`
- `appToast.partialSync()`

### Info Notifications
- `appToast.screenshotRemoved()`
- `appToast.importStarted()`

### Loading Notifications
- `appToast.saving(item)` - Returns toast ID
- `appToast.syncing()` - Returns toast ID
- `appToast.importing()` - Returns toast ID

## Best Practices

### 1. Use Pre-built Methods
Always use the centralized `appToast` utilities for consistency:

```tsx
// ✅ Good
appToast.tradeSaved('EURUSD', '100', '5', true)

// ❌ Avoid
toast.success('Trade saved!')
```

### 2. Provide Context in Descriptions
Include relevant details:

```tsx
// ✅ Good
appToast.tradeSaved('EURUSD', '50.25', '2.5', true)

// ❌ Avoid
appToast.tradeSaved('Trade', 'X', 'Y', true)
```

### 3. Handle Loading States
Use loading toasts for async operations:

```tsx
const toastId = appToast.saving('trade')

try {
  const response = await saveTrade(data)
  appToast.tradeSaved(symbol, pnl, pnlPercent, isProfit)
} catch (error) {
  appToast.tradeSaveFailed()
}
```

### 4. Clear Messaging
Be specific about what went wrong or succeeded:

```tsx
// ✅ Clear
appToast.mt5ConnectionFailed()

// ❌ Vague
toast.error('Something went wrong')
```

## Toast Customization

For specific use cases, customize toast options:

```tsx
import { toast } from 'sonner'

toast.success('Trade saved', {
  description: 'EURUSD BUY +50.25 (2.5%)',
  duration: 3000, // milliseconds
  position: 'top-right', // auto, top-left, top-center, etc
  closeButton: true,
  richColors: true,
})
```

## Integration Points

The toast system is integrated throughout:

- **Trade Journal**: Trade save/load feedback
- **Notes Editor**: Note save confirmation
- **Screenshots**: Upload feedback
- **Settings**: Update confirmation
- **Authentication**: Login/session feedback
- **API Requests**: Success/error feedback
- **Sync Operations**: Progress feedback

## Mobile Behavior

Toasts automatically adapt to mobile:
- Smaller text sizes
- Adjusted positioning
- Touch-friendly dismiss area
- Full-width on small screens

## Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- Color not the only indicator
- Sufficient contrast ratio
- Auto-dismissal respects user preferences

## Performance

- Zero impact on app bundle (Sonner is ~2KB)
- Non-blocking animations
- Efficient DOM updates
- No memory leaks

## Examples

### Trade Save Workflow

```tsx
const handleAddTrade = async (tradeData) => {
  const toastId = appToast.saving(`${tradeData.symbol} trade`)
  
  try {
    const response = await fetch('/api/trades', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    })
    
    if (response.ok) {
      const trade = await response.json()
      appToast.tradeSaved(
        trade.symbol,
        trade.pnl,
        trade.pnl_percent,
        trade.pnl >= 0
      )
    } else {
      appToast.tradeSaveFailed()
    }
  } catch (error) {
    appToast.tradeSaveFailed()
  }
}
```

### Multi-step Process

```tsx
const handleImport = async () => {
  appToast.importStarted()
  
  try {
    const result = await importMT5Trades()
    
    if (result.failed > 0) {
      appToast.partialSync()
    } else {
      appToast.syncCompleted()
    }
  } catch (error) {
    appToast.mt5ConnectionFailed()
  }
}
```

## Troubleshooting

### Toasts Not Showing

1. Check that `<Toaster />` is in root layout
2. Verify `richColors` prop is set
3. Ensure `position` is specified

### Styling Issues

Sonner uses CSS variables from your theme. Check:
- `--popover` background color
- `--popover-foreground` text color
- `--border` border color

These are defined in `globals.css`.

## See Also

- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [Toast Best Practices](https://www.nngroup.com/articles/toast-notification/)
- Design System: `docs/DESIGN_SYSTEM.md`
