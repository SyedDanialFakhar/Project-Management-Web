import { useState } from 'react';
import { FileText, ArrowLeft, CheckCircle2, Download, Sparkles, RotateCcw } from 'lucide-react';
import { LetterUploader } from '@/components/letter/LetterUploader';
import { LetterDataPreview } from '@/components/letter/LetterDataPreview';
import { LetterApiKeyInput } from '@/components/letter/LetterApiKeyInput';
import { useLetterGenerator, type ExtractedLetterData } from '@/hooks/useLetterGenerator';
import { downloadLetter } from '@/hooks/useLetterDownload';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Step = 'input' | 'extracting' | 'review' | 'done';

export default function LetterGeneratorPage() {
  const [step, setStep] = useState<Step>('input');
  const [transcript, setTranscript] = useState('');
  const [transcriptName, setTranscriptName] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedLetterData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { extractAndGenerate, isGenerating, error, getSavedKey, saveKey, clearKey } = useLetterGenerator();
  const apiKey = getSavedKey();

  function handleTranscriptLoaded(text: string, name: string) {
    setTranscript(text);
    setTranscriptName(name);
    setStep('input');
  }

  async function handleExtract() {
    if (!transcript || !apiKey) return;
    setStep('extracting');
    try {
      const data = await extractAndGenerate(transcript, apiKey);
      setExtractedData(data);
      setStep('review');
    } catch {
      setStep('input');
    }
  }

  async function handleDownload() {
    if (!extractedData) return;
    setIsDownloading(true);
    try {
      const patientSlug = extractedData.patientName.replace(/[^a-zA-Z0-9]/g, '_');
      await downloadLetter(extractedData, `${patientSlug}_Letter.docx`);
      setStep('done');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  }

  function handleReset() {
    setStep('input');
    setTranscript('');
    setTranscriptName('');
    setExtractedData(null);
  }

  const STEPS = [
    { id: 'input',      label: 'Transcript' },
    { id: 'extracting', label: 'Extracting'  },
    { id: 'review',     label: 'Review'      },
    { id: 'done',       label: 'Done'        },
  ];
  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          {transcript && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Tools</p>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Letter Generator
            </h1>
          </div>
        </div>

        {/* Step indicator */}
        <div className="hidden sm:flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                stepIndex === i ? 'bg-primary text-primary-foreground' :
                stepIndex > i ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                'bg-muted/40 text-muted-foreground'
              )}>
                {stepIndex > i
                  ? <CheckCircle2 className="h-3 w-3" />
                  : <span className="h-3.5 w-3.5 rounded-full border-2 border-current flex items-center justify-center text-[9px] font-bold">{i + 1}</span>
                }
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px w-4', stepIndex > i ? 'bg-green-500/40' : 'bg-border/40')} />
              )}
            </div>
          ))}
        </div>

        {transcript && (
          <div className="flex items-center gap-2 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40 text-muted-foreground flex-shrink-0">
            <FileText className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{transcriptName}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* Step 1 — Input */}
        {step === 'input' && !transcript && (
          <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-5">
            <LetterApiKeyInput savedKey={apiKey} onSave={saveKey} onClear={clearKey} />
            <LetterUploader onTranscriptLoaded={handleTranscriptLoaded} />
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Transcript loaded, ready */}
        {step === 'input' && transcript && (
          <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
            <LetterApiKeyInput savedKey={apiKey} onSave={saveKey} onClear={clearKey} />
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠️ {error}
              </div>
            )}
            <div className="rounded-2xl border border-border/60 bg-muted/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transcript Preview</p>
                <span className="text-xs text-muted-foreground">
                  {transcript.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <div className="p-5 max-h-64 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">{transcript}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Start Over
              </Button>
              <Button onClick={handleExtract} disabled={!apiKey} className="gap-2 px-6">
                <Sparkles className="h-3.5 w-3.5" />
                {!apiKey ? 'Add API Key First' : 'Extract & Generate Letter'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Extracting */}
        {step === 'extracting' && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-6 px-8">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">AI is reading the transcript</p>
                <p className="text-sm text-muted-foreground mt-1">Extracting patient info, medications, history and generating letter...</p>
              </div>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {['Patient Info', 'Medications', 'PMHx', 'Allergies', 'Social History', 'Letter Body', 'Plan'].map((item, i) => (
                  <span key={item} className="text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 'review' && extractedData && (
          <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Data extracted! Review and edit below, then download the letter.
              </p>
            </div>

            <LetterDataPreview data={extractedData} onChange={setExtractedData} />

            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleExtract} className="gap-1.5 text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Re-extract
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
                  Start Over
                </Button>
              </div>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="gap-2 px-6 bg-green-600 hover:bg-green-700 text-white border-0"
              >
                {isDownloading
                  ? <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <Download className="h-3.5 w-3.5" />
                }
                Download Letter (.docx)
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 'done' && extractedData && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-6 px-8 max-w-md">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">Letter Downloaded!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  The letter for <span className="font-semibold text-foreground">{extractedData.patientName}</span> has been saved to your downloads folder.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setStep('review')} variant="outline" className="gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Back to Review
                </Button>
                <Button onClick={handleReset} variant="ghost" className="gap-2 text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Generate Another Letter
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}