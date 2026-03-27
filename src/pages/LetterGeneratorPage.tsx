import { useState } from 'react';
import JSZip from 'jszip';
import { FileText, ArrowLeft, Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLetterGenerator, type ExtractedLetterData } from '@/hooks/useLetterGenerator';
import { useLetterSplitter } from '@/hooks/useLetterSplitter';
import { useLetterHistory } from '@/hooks/useLetterHistory';
import { downloadLetter, generateDocxBlob } from '@/hooks/useLetterDownload';
import { LetterUploader } from '@/components/letter/LetterUploader';
import { LetterStepIndicator } from '@/components/letter/LetterStepIndicator';
import { LetterTranscriptPreview } from '@/components/letter/LetterTranscriptPreview';
import { LetterExtractingView } from '@/components/letter/LetterExtractingView';
import { LetterReviewView } from '@/components/letter/LetterReviewView';
import { LetterDoneView } from '@/components/letter/LetterDoneView';
import { LetterHistoryTab } from '@/components/letter/LetterHistoryTab';
import { BatchLetterList, type BatchLetter } from '@/components/letter/BatchLetterList';
import { BatchSplittingView } from '@/components/letter/BatchSplittingView';

type Step = 'input' | 'extracting' | 'review' | 'done' | 'batch_splitting' | 'batch_ready';
type Tab  = 'generate' | 'history';

export default function LetterGeneratorPage() {
  const [step, setStep]                     = useState<Step>('input');
  const [tab, setTab]                       = useState<Tab>('generate');
  const [transcript, setTranscript]         = useState('');
  const [transcriptName, setTranscriptName] = useState('');
  const [data, setData]                     = useState<ExtractedLetterData | null>(null);
  const [isDownloading, setIsDownloading]   = useState(false);
  const [batchLetters, setBatchLetters]     = useState<BatchLetter[]>([]);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [reviewingFromBatch, setReviewingFromBatch] = useState(false);

  const { extractAndGenerate, isGenerating, error } = useLetterGenerator();
  const { splitTranscript }                          = useLetterSplitter();
  const { data: history = [], saveLetter, deleteLetter } = useLetterHistory();

  function handleTranscriptLoaded(text: string, name: string) {
    setTranscript(text);
    setTranscriptName(name);
    setStep('input');
    setBatchLetters([]);
    setReviewingFromBatch(false);
  }

  function detectMultiplePatients(text: string): boolean {
    const patterns = [
      /this is \w+ dictating/gi,
      /please see this letter to dr/gi,
      /date of birth[,\s]+\d/gi,
    ];
    for (const p of patterns) {
      const matches = text.match(p);
      if (matches && matches.length > 1) return true;
    }
    return false;
  }

  async function handleExtract() {
    if (!transcript) return;
  
    const isMultiple = detectMultiplePatients(transcript);
  
    if (isMultiple) {
      setStep('batch_splitting');
      try {
        const parts = await splitTranscript(transcript);
        const initial: BatchLetter[] = parts.map((part, i) => ({
          id: `letter-${i}`,
          transcriptPart: part,
          data: null,
          status: 'pending',
        }));
        setBatchLetters(initial);
  
        const results = [...initial];
        
        // Process in parallel with concurrency limit
        const concurrency = 3; // Process 3 at a time
        
        for (let i = 0; i < parts.length; i += concurrency) {
          const batchIndices = Array.from(
            { length: Math.min(concurrency, parts.length - i) },
            (_, idx) => i + idx
          );
          
          // Start all in this batch
          for (const idx of batchIndices) {
            results[idx] = { ...results[idx], status: 'extracting' };
          }
          setBatchLetters([...results]);
          
          // Process batch in parallel
          const promises = batchIndices.map(async (idx) => {
            try {
              const extracted = await extractAndGenerate(parts[idx]);
              extracted.plan = [];
              results[idx] = { ...results[idx], data: extracted, status: 'ready' };
            } catch (err: any) {
              results[idx] = { ...results[idx], status: 'error', error: err.message };
            }
            // Update UI after each completes
            setBatchLetters([...results]);
          });
          
          await Promise.all(promises);
        }
        
        setStep('batch_ready');
      } catch (err) {
        setStep('input');
      }
    } else {
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
  }

  async function handleDownload() {
    if (!data) return;
    setIsDownloading(true);
    try {
      const cleanName = data.patientName
        .replace(/^(Mr|Mrs|Ms|Dr|Miss)\.?\s*/i, '')
        .trim().replace(/\s+/g, '_');
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

  async function handleDownloadOne(letter: BatchLetter) {
    if (!letter.data) return;
    const cleanName = letter.data.patientName
      .replace(/^(Mr|Mrs|Ms|Dr|Miss)\.?\s*/i, '')
      .trim().replace(/\s+/g, '_');
    const dateSlug = letter.data.date.replace(/\s/g, '_').replace(/,/g, '');
    await downloadLetter(letter.data, `${cleanName}_${dateSlug}.docx`);
    await saveLetter.mutateAsync(letter.data);
  }

  async function handleDownloadAll() {
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      const readyLetters = batchLetters.filter(l => l.status === 'ready' && l.data);
      for (const letter of readyLetters) {
        if (!letter.data) continue;
        const blob = await generateDocxBlob(letter.data);
        const cleanName = letter.data.patientName
          .replace(/^(Mr|Mrs|Ms|Dr|Miss)\.?\s*/i, '')
          .trim().replace(/\s+/g, '_');
        const dateSlug = letter.data.date.replace(/\s/g, '_').replace(/,/g, '');
        zip.file(`${cleanName}_${dateSlug}.docx`, blob);
        await saveLetter.mutateAsync(letter.data);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Letters_${new Date().toLocaleDateString('en-AU').replace(/\//g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingAll(false);
    }
  }

  function handleReset() {
    setStep('input');
    setTranscript('');
    setTranscriptName('');
    setData(null);
    setBatchLetters([]);
    setReviewingFromBatch(false);
  }

  // ✅ Smart back button logic
  function handleBack() {
    if (step === 'review' && reviewingFromBatch) {
      // ✅ Go back to batch list when reviewing from batch
      setStep('batch_ready');
      setReviewingFromBatch(false);
      setData(null);
    } else if (step === 'done' && reviewingFromBatch) {
      setStep('batch_ready');
      setReviewingFromBatch(false);
    } else {
      handleReset();
    }
  }

  function handleOpenFromHistory(record: any) {
    setData(record.extracted_data as ExtractedLetterData);
    setStep('review');
    setTab('generate');
    setReviewingFromBatch(false);
  }

  const showBackButton = tab === 'generate' && (
    step === 'review' ||
    step === 'done' ||
    (step === 'input' && transcript) ||
    step === 'batch_ready' ||
    step === 'batch_splitting'
  );

  // Back button label changes based on context
  const backLabel = (step === 'review' || step === 'done') && reviewingFromBatch
    ? 'All Letters'
    : 'Back';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-1.5 text-muted-foreground -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
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

        {/* Step indicator — only for single letter flow */}
        {tab === 'generate' && !['batch_splitting', 'batch_ready'].includes(step) && (
          <LetterStepIndicator step={step} />
        )}

        {/* Batch indicator */}
        {tab === 'generate' && ['batch_splitting', 'batch_ready'].includes(step) && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <FileText className="h-3 w-3" />
            Batch Mode — {batchLetters.length} patients
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
          {[
            { id: 'generate', label: 'Generate', icon: Sparkles },
            { id: 'history', label: history.length > 0 ? `History (${history.length})` : 'History', icon: History },
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

        {tab === 'history' && (
          <LetterHistoryTab
            history={history}
            onOpen={handleOpenFromHistory}
            onDelete={(id) => deleteLetter.mutate(id)}
          />
        )}

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

            {step === 'batch_splitting' && (
              <BatchSplittingView totalFound={batchLetters.length} />
            )}

            {step === 'batch_ready' && (
              <BatchLetterList
                letters={batchLetters}
                onDownloadOne={handleDownloadOne}
                onDownloadAll={handleDownloadAll}
                onReview={(letter) => {
                  setData(letter.data);
                  setReviewingFromBatch(true);
                  setStep('review');
                }}
                isDownloadingAll={isDownloadingAll}
              />
            )}

            {step === 'review' && data && (
              <LetterReviewView
                data={data}
                isDownloading={isDownloading}
                hasTranscript={!!transcript && !reviewingFromBatch}
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