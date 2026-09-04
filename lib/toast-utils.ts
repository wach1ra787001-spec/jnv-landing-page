import { toast } from 'sonner'

/**
 * Toast utility functions for consistent notifications throughout the app
 */

export const appToast = {
  // Success notifications
  success: (message: string, description?: string) => {
    toast.success(message, {
      ...(description && { description }),
    })
  },

  tradeSaved: (symbol: string, pnl: string, pnlPercent: string, isProfit: boolean) => {
    toast.success('Trade saved successfully', {
      description: `${symbol} ${isProfit ? '+' : ''}${pnl} (${isProfit ? '+' : ''}${pnlPercent}%)`,
    })
  },

  notesSaved: () => {
    toast.success('Trade notes saved successfully')
  },

  playBookCreated: (title: string) => {
    toast.success('Playbook created successfully', {
      description: `"${title}" is now available`,
    })
  },

  screenshotsAdded: (count: number) => {
    toast.success(`${count} screenshot${count > 1 ? 's' : ''} added`)
  },

  goalsCreated: () => {
    toast.success('Goal created successfully')
  },

  rulesCreated: () => {
    toast.success('Trading rule created successfully')
  },

  settingsUpdated: () => {
    toast.success('Settings updated successfully')
  },

  syncCompleted: () => {
    toast.success('Sync completed successfully')
  },

  // Error notifications
  error: (message: string, description?: string) => {
    toast.error(message, {
      ...(description && { description }),
    })
  },

  tradeSaveFailed: (description = 'Please try again') => {
    toast.error('Failed to save trade', {
      description,
    })
  },

  notesSaveFailed: () => {
    toast.error('Failed to save notes', {
      description: 'Please try again',
    })
  },

  invalidForm: (field: string) => {
    toast.error('Invalid input', {
      description: `Please check the ${field} field`,
    })
  },

  mt5ConnectionFailed: () => {
    toast.error('Unable to connect to MT5 bridge', {
      description: 'Please check your connection and try again',
    })
  },

  sessionExpired: () => {
    toast.error('Session expired', {
      description: 'Please log in again',
    })
  },

  uploadFailed: () => {
    toast.error('Failed to upload screenshot', {
      description: 'Please try again',
    })
  },

  // Warning notifications
  unsavedChanges: () => {
    toast.warning('Unsaved changes', {
      description: 'Your changes will be lost',
    })
  },

  partialSync: () => {
    toast.warning('Partial sync completed', {
      description: 'Some trades could not be imported',
    })
  },

  // Info notifications
  screenshotRemoved: () => {
    toast.info('Screenshot removed')
  },

  importStarted: () => {
    toast.info('Starting trade import...')
  },

  // Loading notifications
  saving: (item: string = 'data') => {
    return toast.loading(`Saving ${item}...`)
  },

  syncing: () => {
    return toast.loading('Syncing with MT5...')
  },

  importing: () => {
    return toast.loading('Importing trades...')
  },

  // Trade imported notification
  tradeImported: (symbol: string, tradeId: string, onJournal?: () => void) => {
    toast.success('New Trade Imported', {
      description: `Your ${symbol} trade has been imported successfully. Take a few minutes to journal it while the details are still fresh.`,
      action: {
        label: 'Journal Trade',
        onClick: () => onJournal?.(),
      },
      duration: 8000, // Auto-dismiss after 8 seconds
    })
  },
}
