import {useEffect} from 'react';

type ShortcutActions = {
  onSelectAllCaptions: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onTogglePlay: () => void;
  onDelete: () => void;
};

export function useShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.matches('input,textarea,select,[contenteditable]')) return;

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        actions.onSelectAllCaptions();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        actions.onUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        actions.onRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        actions.onDuplicate();
      } else if (e.code === 'Space') {
        e.preventDefault();
        actions.onTogglePlay();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        actions.onDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
