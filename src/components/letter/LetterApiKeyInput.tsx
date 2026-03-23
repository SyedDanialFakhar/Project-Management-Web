import { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LetterApiKeyInputProps {
  savedKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
}

export function LetterApiKeyInput({ savedKey, onSave, onClear }: LetterApiKeyInputProps) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);

  function handleSave() {
    if (!key.trim().startsWith('gsk_')) {
      alert('Invalid Groq API key. Groq keys start with gsk_');
      return;
    }
    onSave(key.trim());
    setKey('');
  }

  function openConsole() {
    window.open('https://console.groq.com/keys', '_blank');
  }

  if (savedKey) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-600 dark:text-green-400">Groq API Key Connected</p>
            <p className="text-[10px] text-muted-foreground">
              {savedKey.slice(0, 10)}••••••••{savedKey.slice(-4)}
            </p>
          </div>
        </div>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 py-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-start gap-2">
        <Key className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Groq API Key Required (Free)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Sign up free at console.groq.com — no credit card needed.
          </p>
          <button
            onClick={openConsole}
            className="mt-1 text-[11px] text-primary underline hover:opacity-80 transition-opacity"
          >
            Get free API key →
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="gsk_..."
            className="w-full h-9 px-3 pr-9 rounded-lg border border-border/60 bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!key.trim()}>Save</Button>
      </div>
    </div>
  );
}