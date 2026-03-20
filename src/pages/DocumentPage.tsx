import { useState } from 'react';
import { FileText, X, Hash, AlignLeft, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { DocumentUploader } from '@/components/document/DocumentUploader';
import { DocumentPreview } from '@/components/document/DocumentPreview';
import { DocumentEditor } from '@/components/document/DocumentEditor';
import { DocumentActions } from '@/components/document/DocumentActions';
import { useDocumentFixer } from '@/hooks/useDocumentFixer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getFixedOnly(raw: string) {
  return raw.split('--- SUGGESTIONS ---')[0].trim();
}

type Step = 'input' | 'fixing' | 'review';

export default function DocumentPage() {
  const [originalText, setOriginalText] = useState('');
  const [fixedText, setFixedText] = useState('');
  const [fileName, setFileName] = useState('document');
  const [hasFixed, setHasFixed] = useState(false);
  const [step, setStep] = useState<Step>('input');

  const { fixDocument, isFixing, error } = useDocumentFixer();

  function handleFileLoaded(text: string, name: string) {
    setOriginalText(text);
    setFixedText('');
    setHasFixed(false);
    setFileName(name);
    setStep('input');
  }

  async function handleFix() {
    if (!originalText) return;
    setStep('fixing');
    try {
      const result = await fixDocument(originalText);
      setFixedText(result);
      setHasFixed(true);
      setStep('review');
    } catch {
      setStep('input');
    }
  }

  function handleReset() {
    setOriginalText('');
    setFixedText('');
    setHasFixed(false);
    setFileName('document');
    setStep('input');
  }

  const fixedOnly = getFixedOnly(fixedText);

  const STEPS = [
    { id: 'input',   label: 'Input',    num: 1 },
    { id: 'fixing',  label: 'Fixing',   num: 2 },
    { id: 'review',  label: 'Review',   num: 3 },
  ];

  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          {originalText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Tools</p>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Document Fixer
            </h1>
          </div>
        </div>

        {/* Step indicator */}
        <div className="hidden sm:flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                stepIndex === i
                  ? 'bg-primary text-primary-foreground'
                  : stepIndex > i
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-muted/40 text-muted-foreground'
              )}>
                {stepIndex > i
                  ? <CheckCircle2 className="h-3 w-3" />
                  : <span className="h-3.5 w-3.5 rounded-full border-2 border-current flex items-center justify-center text-[9px] font-bold">{s.num}</span>
                }
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px w-4 transition-all', stepIndex > i ? 'bg-green-500/40' : 'bg-border/40')} />
              )}
            </div>
          ))}
        </div>

        {/* File info */}
        {originalText && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {countWords(originalText).toLocaleString()} words
              </span>
              <span className="flex items-center gap-1">
                <AlignLeft className="h-3 w-3" />
                {originalText.length.toLocaleString()} chars
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40 text-muted-foreground">
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[120px] font-medium">{fileName}</span>
              <button onClick={handleReset} className="hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Step 1 — Input */}
        {step === 'input' && !originalText && (
          <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <DocumentUploader onFileLoaded={handleFileLoaded} />
            {error && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Text loaded, ready to fix */}
        {step === 'input' && originalText && (
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠️ {error}
              </div>
            )}
            <div className="h-[520px]">
              <DocumentPreview
                title="Your Document"
                text={originalText}
                badge="Ready to fix"
                badgeColor="bg-primary/10 text-primary"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                {countWords(originalText)} words · {originalText.length} characters
              </p>
              <Button onClick={handleFix} className="gap-2 px-6">
                <FileText className="h-3.5 w-3.5" />
                Fix with AI
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Fixing */}
        {step === 'fixing' && (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center space-y-6 px-8">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">Fixing your document</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Checking grammar, spelling, punctuation and sentence structure...
                </p>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                {['Grammar', 'Spelling', 'Punctuation', 'Structure'].map((item, i) => (
                  <span
                    key={item}
                    className="text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 'review' && (
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">

            {/* Success banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Document fixed successfully! Review the changes and download when ready.
              </p>
            </div>

            {/* Side by side panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ minHeight: '500px' }}>
              <DocumentPreview
                title="Original Document"
                text={originalText}
                badge="Original"
                badgeColor="bg-muted text-muted-foreground"
              />
              <DocumentEditor value={fixedText} onChange={setFixedText} />
            </div>

            {/* Stats comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/20 border border-border/40">
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Original</p>
                  <p className="text-sm font-semibold text-foreground">
                    {countWords(originalText)} words · {originalText.length} chars
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">Fixed</p>
                  <p className="text-sm font-semibold text-foreground">
                    {countWords(fixedOnly)} words · {fixedOnly.length} chars
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <DocumentActions
              originalText={originalText}
              fixedText={fixedOnly}
              fileName={fileName}
              isFixing={isFixing}
              hasFixed={hasFixed}
              onFix={handleFix}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}