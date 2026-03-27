import { CheckCircle2, Download, RotateCcw, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LetterDataPreview } from './LetterDataPreview';
import { TEMPLATES, type TemplateId } from '@/lib/templateRegistry';
import type { ExtractedLetterData } from '@/hooks/useLetterGenerator';

interface Props {
  data: ExtractedLetterData;
  isDownloading: boolean;
  hasTranscript: boolean;
  onChange: (data: ExtractedLetterData) => void;
  onDownload: () => void;
  onReExtract: () => void;
  onReset: () => void;
}

export function LetterReviewView({
  data, isDownloading, hasTranscript,
  onChange, onDownload, onReExtract, onReset,
}: Props) {
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const currentTemplateId = data.templateId ?? 'sarah';
  const currentTemplate   = TEMPLATES[currentTemplateId] ?? TEMPLATES['sarah'];

  function handleSwitchTemplate(newId: TemplateId) {
    setShowTemplatePicker(false);
    if (newId === currentTemplateId) return;
    // Switch template — keep all extracted data, just change the templateId
    // Reset bullet fields to empty if switching to a template that doesn't use them
    const newConfig = TEMPLATES[newId];
    onChange({
      ...data,
      templateId: newId,
      // Clear bullet sections when switching to a non-bullet template
      pmhx:          newConfig.hasBulletSections ? data.pmhx          : [],
      medications:   newConfig.hasBulletSections ? data.medications   : [],
      allergies:     newConfig.hasBulletSections ? data.allergies     : [],
      socialHistory: newConfig.hasBulletSections ? data.socialHistory : [],
    });
  }

  return (
    <div className="space-y-5">

      {/* Success banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
          Data extracted! Review and edit below, then download.
        </p>
      </div>

      {/* Template switcher */}
      <div className="relative">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/60 bg-muted/10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
              Auto-detected template
            </p>
            <p className="text-sm font-semibold text-foreground">{currentTemplate.doctorName}</p>
          </div>
          <button
            onClick={() => setShowTemplatePicker((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80 transition-opacity font-medium px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20"
          >
            Wrong doctor?
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTemplatePicker ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown */}
        {showTemplatePicker && (
          <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-xl border border-border/60 bg-background shadow-lg overflow-hidden">
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Switch to a different template
            </p>
            {Object.values(TEMPLATES).map((config) => (
              <button
                key={config.id}
                onClick={() => handleSwitchTemplate(config.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors ${
                  config.id === currentTemplateId ? 'bg-primary/5' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{config.doctorName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config.hasBulletSections ? 'PMHx · Medications · Allergies · Social Hx + Body' : 'Narrative body only'}
                  </p>
                </div>
                {config.id === currentTemplateId && (
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <LetterDataPreview data={data} onChange={onChange} />

      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <div className="flex gap-2">
          {hasTranscript && (
            <Button variant="ghost" size="sm" onClick={onReExtract} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Re-extract
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-muted-foreground">
            Start Over
          </Button>
        </div>

        <Button
          onClick={onDownload}
          disabled={isDownloading}
          className="gap-2 px-6 bg-green-600 hover:bg-green-700 text-white border-0"
        >
          {isDownloading
            ? <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Download className="h-3.5 w-3.5" />
          }
          Download .docx
        </Button>
      </div>
    </div>
  );
}