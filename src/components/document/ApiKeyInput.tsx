import { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiKeyInputProps {
  savedKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
}

export function ApiKeyInput({ savedKey, onSave, onClear }: ApiKeyInputProps) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!key.trim().startsWith('AIza')) {
        alert('Invalid API key format. Gemini keys start with AIza');
        return;
      }
    onSave(key.trim());
    setSaved(true);
    setKey('');
    setTimeout(() => setSaved(false), 2000);
  }

  if (savedKey) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs font-semibold text-green-600">API Key Connected</p>
            <p className="text-[10px] text-muted-foreground">
              {savedKey.slice(0, 12)}••••••••••••{savedKey.slice(-4)}
            </p>
          </div>
        </div>
        <button onClick={onClear} className="text-xs text-muted-foreground">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 py-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-start gap-2">
        <Key className="h-4 w-4 text-amber-500 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-600">
            Gemini API Key Required
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            To fix documents with AI, you need an API key. It's stored only in your browser.{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              Get one here <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="AIza..."
            className="w-full h-9 px-3 pr-9 rounded-lg border text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>

        <Button size="sm" onClick={handleSave} disabled={!key.trim()}>
          {saved ? '✓ Saved' : 'Save'}
        </Button>
      </div>
    </div>
  );
}