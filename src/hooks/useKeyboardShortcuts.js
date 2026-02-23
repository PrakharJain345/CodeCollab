import { useEffect } from 'react'

/**
 * Registers global keyboard shortcuts for CodeCollab.
 * @param {Object} handlers - { onToggleChat, onToggleUserList, onLeave }
 */
export function useKeyboardShortcuts({ onToggleChat, onToggleUserList, onLeave }) {
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+Shift+C — Toggle Chat panel
      if (ctrl && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        onToggleChat?.()
      }

      // Ctrl+Shift+U — Toggle User list
      if (ctrl && e.shiftKey && e.key === 'U') {
        e.preventDefault()
        onToggleUserList?.()
      }

      // Escape — close any open panel (handled via callback)
      if (e.key === 'Escape') {
        onToggleUserList?.(false)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onToggleChat, onToggleUserList, onLeave])
}
