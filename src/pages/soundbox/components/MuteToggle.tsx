import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const STORAGE_KEY = 'soundbox-muted';

export function isMuted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setMutedState(muted: boolean) {
  localStorage.setItem(STORAGE_KEY, String(muted));
  window.dispatchEvent(new Event('mute-change'));
}

export function MuteToggle() {
  const [muted, setMuted] = useState(isMuted());

  useEffect(() => {
    const handleMuteChange = () => setMuted(isMuted());
    window.addEventListener('mute-change', handleMuteChange);
    return () => window.removeEventListener('mute-change', handleMuteChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(muted));
  }, [muted]);

  return (
    <button
      onClick={() => setMuted(!muted)}
      className={`flex h-9 w-9 items-center justify-center rounded-md border shadow-xs transition-colors ${
        muted
          ? 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'border-input bg-background hover:bg-accent'
      }`}
      title={muted ? 'Bật tiếng' : 'Tắt tiếng'}
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}