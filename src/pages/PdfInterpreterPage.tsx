import { useState, useRef } from 'react';
import {
  FileText, Upload, CheckCircle2, Download,
  Trash2, Database, Clock, AlertTriangle,
  ArrowLeft, Loader2, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import { formatDistanceToNow } from 'date-fns';
import { parseInterpretations, type PatientInterpretation } from '@/utils/interpretationParser';
import { usePdfInterpretation, type ProcessResult } from '@/hooks/usePdfInterpretation';
import { useInterpretationStore } from '@/hooks/useInterpretationStore';

type Step = 'setup' | 'processing' | 'done';

export default function PdfInterpreterPage() {
  const [step, setStep]                       = useState<Step>('setup');
  const [interpretations, setInterpretations] = useState<PatientInterpretation[]>([]);
  const [interpFileName, setInterpFileName]   = useState('');
  const [pdfFile, setPdfFile]                 = useState<File | null>(null);
  const [result, setResult]                   = useState<ProcessResult | null>(null);
  const [activeTab, setActiveTab]             = useState<'upload' | 'stored'>('upload');
  const [isDraggingInterp, setIsDraggingInterp] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf]       = useState(false);
  const [loadingInterp, setLoadingInterp]       = useState(false);

  const interpRef = useRef<HTMLInputElement>(null);
  const pdfRef    = useRef<HTMLInputElement>(null);

  const { processPdf, isProcessing, error, setError } = usePdfInterpretation();
  const { data: storedInterps = [], saveInterpretations, deleteStore } = useInterpretationStore();

  async function loadInterpFile(file: File) {
    setLoadingInterp(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let text = '';

      if (ext === 'txt') {
        text = await file.text();
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const ab = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: ab });
        text = result.value;
      } else {
        throw new Error('Please upload a .docx or .txt interpretations file');
      }

      const parsed = parseInterpretations(text);
      if (parsed.length === 0) {
        throw new Error(
          'No patient interpretations found. Format should be:\n' +
          'Patient Name\n' +
          'Interpretation text here...\n\n' +
          'Next Patient Name\n' +
          'Their interpretation...'
        );
      }

      setInterpretations(parsed);
      setInterpFileName(file.name);

      await saveInterpretations.mutateAsync({
        fileName: file.name,
        interpretations: parsed,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingInterp(false);
    }
  }

  async function handleProcess() {
    if (!pdfFile || interpretations.length === 0) return;
    setStep('processing');
    try {
      const res = await processPdf(pdfFile, interpretations);
      setResult(res);
      setStep('done');
    } catch {
      setStep('setup');
    }
  }

  function handleReset() {
    setStep('setup');
    setPdfFile(null);
    setResult(null);
    setError(null);
  }

  const isReady = interpretations.length > 0 && pdfFile !== null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          {step !== 'setup' && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Tools</p>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              PDF Interpreter
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Match patients and fill interpretations into lung function PDFs
            </p>
          </div>
        </div>

        {/* Status pills */}
        <div className="hidden md:flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            interpretations.length > 0
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-muted/40 text-muted-foreground'
          )}>
            {interpretations.length > 0
              ? <CheckCircle2 className="h-3 w-3" />
              : <Users className="h-3 w-3" />
            }
            {interpretations.length > 0
              ? `${interpretations.length} patients loaded`
              : 'No interpretations'}
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            pdfFile
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-muted/40 text-muted-foreground'
          )}>
            {pdfFile ? <CheckCircle2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {pdfFile ? pdfFile.name.slice(0, 22) + (pdfFile.name.length > 22 ? '...' : '') : 'No PDF'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-sm font-semibold text-foreground">Matching patient and filling PDF...</p>
                <p className="text-xs text-muted-foreground">Locating interpretation section and adding text</p>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && result && (
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">Interpretation Added!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Filled for <span className="font-semibold text-foreground">{result.patientName}</span>
                </p>
              </div>

              {/* Preview interpretation */}
              <div className="w-full max-w-xl px-5 py-4 rounded-xl bg-muted/20 border border-border/40 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Added Interpretation</p>
                <p className="text-sm text-foreground leading-relaxed">{result.interpretation}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => saveAs(result.blob, result.fileName)}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white border-0 px-6"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Process Another
                </Button>
              </div>
            </div>
          )}

          {/* Setup */}
          {step === 'setup' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left — Interpretations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      interpretations.length > 0
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-muted/40 text-muted-foreground'
                    )}>
                      {interpretations.length > 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
                    </div>
                    <p className="text-sm font-semibold text-foreground">Load Interpretations</p>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
                    {[
                      { id: 'upload', label: 'Upload File', icon: Upload },
                      { id: 'stored', label: `Stored (${storedInterps.length})`, icon: Database },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                          activeTab === t.id
                            ? 'bg-background text-foreground shadow-sm border border-border/40'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <t.icon className="h-3 w-3" />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'upload' && (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingInterp(true); }}
                      onDragLeave={() => setIsDraggingInterp(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDraggingInterp(false); const f = e.dataTransfer.files[0]; if (f) loadInterpFile(f); }}
                      onClick={() => interpRef.current?.click()}
                      className={cn(
                        'flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
                        isDraggingInterp ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20',
                        loadingInterp && 'pointer-events-none opacity-70'
                      )}
                    >
                      <input ref={interpRef} type="file" accept=".docx,.txt" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) loadInterpFile(f); e.target.value = ''; }} />
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        {loadingInterp ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <Upload className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">
                          {loadingInterp ? 'Reading file...' : 'Upload Interpretations'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">.docx or .txt file</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'stored' && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {storedInterps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 border border-dashed rounded-2xl bg-muted/5">
                          <Database className="h-6 w-6 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">No stored interpretations yet</p>
                        </div>
                      ) : (
                        storedInterps.map((record: any) => (
                          <div key={record.id} className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-all">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{record.file_name}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })} · {record.patient_count} patients
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => { setInterpretations(record.interpretations); setInterpFileName(record.file_name); }}>
                                Use
                              </Button>
                              <button onClick={() => deleteStore.mutate(record.id)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {interpretations.length > 0 && (
                    <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {interpretations.length} patients loaded from {interpFileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                          {interpretations.map(p => `${p.firstName} ${p.lastName}`).join(' · ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right — PDF */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      pdfFile ? 'bg-green-500/20 text-green-600' : 'bg-muted/40 text-muted-foreground'
                    )}>
                      {pdfFile ? <CheckCircle2 className="h-3.5 w-3.5" /> : '2'}
                    </div>
                    <p className="text-sm font-semibold text-foreground">Upload Lung Function PDF</p>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                    onDragLeave={() => setIsDraggingPdf(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(false);
                      const f = e.dataTransfer.files[0];
                      if (f?.type === 'application/pdf') setPdfFile(f);
                    }}
                    onClick={() => pdfRef.current?.click()}
                    className={cn(
                      'flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
                      isDraggingPdf ? 'border-primary bg-primary/5' :
                      pdfFile ? 'border-green-500/40 bg-green-500/5' :
                      'border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20'
                    )}
                  >
                    <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setPdfFile(f); e.target.value = ''; }} />
                    <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', pdfFile ? 'bg-green-500/20' : 'bg-primary/10')}>
                      <FileText className={cn('h-5 w-5', pdfFile ? 'text-green-600' : 'text-primary')} />
                    </div>
                    <div className="text-center">
                      {pdfFile ? (
                        <>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400 truncate max-w-[200px]">{pdfFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-foreground">Drop PDF here</p>
                          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 leading-relaxed space-y-1">
                    <p className="font-semibold">How it works:</p>
                    <p>1. Reads <strong>Last name</strong> + <strong>First name</strong> from the PDF</p>
                    <p>2. Matches to your interpretations list (fuzzy match)</p>
                    <p>3. Adds text into the <strong>Interpretation</strong> section</p>
                    <p>4. Downloads the filled PDF</p>
                  </div>
                </div>
              </div>

              {/* Process button */}
              <div className="flex items-center justify-end pt-2 border-t border-border/40">
                <Button
                  onClick={handleProcess}
                  disabled={!isReady || isProcessing}
                  size="lg"
                  className="gap-2 px-8"
                >
                  {isProcessing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FileText className="h-4 w-4" />
                  }
                  {isProcessing ? 'Processing...' : 'Fill Interpretation'}
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}