import { useState } from 'react';
import { FileText, ArrowLeft, Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLetterGenerator, type ExtractedLetterData } from '@/hooks/useLetterGenerator';
import { useLetterHistory } from '@/hooks/useLetterHistory';
import { downloadLetter } from '@/hooks/useLetterDownload';
import { LetterUploader } from '@/components/letter/LetterUploader';
import { LetterStepIndicator } from '@/components/letter/LetterStepIndicator';
import { LetterTranscriptPreview } from '@/components/letter/LetterTranscriptPreview';
import { LetterExtractingView } from '@/components/letter/LetterExtractingView';
import { LetterReviewView } from '@/components/letter/LetterReviewView';
import { LetterDoneView } from '@/components/letter/LetterDoneView';
import { LetterHistoryTab } from '@/components/letter/LetterHistoryTab';

type Step = 'input' | 'extracting' | 'review' | 'done';
type Tab  = 'generate' | 'history';

export default function LetterGeneratorPage() {
  const [step, setStep]               = useState<Step>('input');
  const [tab, setTab]                 = useState<Tab>('generate');
  const [transcript, setTranscript]   = useState('');
  const [transcriptName, setTranscriptName] = useState('');
  const [data, setData]               = useState<ExtractedLetterData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { extractAndGenerate, isGenerating, error } = useLetterGenerator();
  const { data: history = [], saveLetter, deleteLetter } = useLetterHistory();

  function handleTranscriptLoaded(text: string, name: string) {
    setTranscript(text);
    setTranscriptName(name);
    setStep('input');
  }

  async function handleExtract() {
    if (!transcript) return;
    setStep('extracting');
    try {
      const result = await extractAndGenerate(transcript);
      result.plan = [];
      setData(result);
      setStep('review');
    } catch {
      setStep('input');
    }
  }

  async function handleDownload(format: 'docx' | 'pdf') {
    if (!data) return;
    setIsDownloading(true);
    try {
        const cleanName = data.patientName
        .replace(/^(Mr|Mrs|Ms|Dr|Miss)\.?\s*/i, '')  // remove title
        .trim()
        .replace(/\s+/g, '_');                         // spaces to underscores
      const dateSlug = data.date.replace(/\s/g, '_').replace(/,/g, '');
      await downloadLetter(data, `${cleanName}_${dateSlug}.docx`);
      await saveLetter.mutateAsync(data);
      setStep('done');
    } catch (err: any) {
      alert('Download failed: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  }

  function handleReset() {
    setStep('input');
    setTranscript('');
    setTranscriptName('');
    setData(null);
  }

  function handleOpenFromHistory(record: any) {
    setData(record.extracted_data as ExtractedLetterData);
    setStep('review');
    setTab('generate');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          {transcript && tab === 'generate' && step !== 'done' && (
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

        {tab === 'generate' && <LetterStepIndicator step={step} />}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
          {[
            { id: 'generate', label: 'Generate', icon: Sparkles },
            { id: 'history',  label: history.length > 0 ? `History (${history.length})` : 'History', icon: History },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* History tab */}
        {tab === 'history' && (
          <LetterHistoryTab
            history={history}
            onOpen={handleOpenFromHistory}
            onDelete={(id) => deleteLetter.mutate(id)}
          />
        )}

        {/* Generate tab */}
        {tab === 'generate' && (
          <div className="p-6 md:p-8 max-w-4xl mx-auto">

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠️ {error}
              </div>
            )}

            {step === 'input' && !transcript && (
              <LetterUploader onTranscriptLoaded={handleTranscriptLoaded} />
            )}

            {step === 'input' && transcript && (
              <LetterTranscriptPreview
                transcript={transcript}
                isExtracting={isGenerating}
                onExtract={handleExtract}
                onReset={handleReset}
              />
            )}

            {step === 'extracting' && <LetterExtractingView />}

            {step === 'review' && data && (
              <LetterReviewView
                data={data}
                isDownloading={isDownloading}
                hasTranscript={!!transcript}
                onChange={setData}
                onDownload={handleDownload}
                onReExtract={handleExtract}
                onReset={handleReset}
              />
            )}

            {step === 'done' && data && (
              <LetterDoneView
                patientName={data.patientName}
                onBackToReview={() => setStep('review')}
                onReset={handleReset}
                onViewHistory={() => setTab('history')}
              />
            )}

          </div>
        )}

      </div>
    </div>
  );
}