import { useState, useRef } from 'react';
import {
  FileText, Upload, CheckCircle2, Download,
  Trash2, Database, Clock, AlertTriangle,
  ArrowLeft, Loader2, Users, Package, X, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import { formatDistanceToNow } from 'date-fns';
import JSZip from 'jszip';
import { parseInterpretations, type PatientInterpretation } from '@/utils/interpretationParser';
import { usePdfInterpretation, type ProcessResult } from '@/hooks/usePdfInterpretation';
import { useInterpretationStore } from '@/hooks/useInterpretationStore';

type Step = 'setup' | 'processing' | 'done';

export default function PdfInterpreterPage() {
  const [step, setStep]                         = useState<Step>('setup');
  const [interpretations, setInterpretations]   = useState<PatientInterpretation[]>([]);
  const [interpFileName, setInterpFileName]     = useState('');
  const [pdfFiles, setPdfFiles]                 = useState<File[]>([]);
  const [liveResults, setLiveResults]           = useState<ProcessResult[]>([]);
  const [activeTab, setActiveTab]               = useState<'upload' | 'stored'>('upload');
  const [isDraggingInterp, setIsDraggingInterp] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf]       = useState(false);
  const [loadingInterp, setLoadingInterp]       = useState(false);
  const [isZipping, setIsZipping]               = useState(false);

  const interpRef = useRef<HTMLInputElement>(null);
  const pdfRef    = useRef<HTMLInputElement>(null);

  const { processAllPdfs, isProcessing, error, setError } = usePdfInterpretation();
  const { data: storedInterps = [], saveInterpretations, deleteStore } = useInterpretationStore();

  // ✅ Load interpretations file
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
          'Interpretation text...\n\n' +
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

  // ✅ Add PDFs to list (no duplicates)
  function addPdfFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    setPdfFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const unique = arr.filter(f => !existing.has(f.name));
      return [...prev, ...unique];
    });
  }

  function removePdf(index: number) {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  }

  // ✅ Process all PDFs
  async function handleProcess() {
    if (pdfFiles.length === 0 || interpretations.length === 0) return;
    setStep('processing');
    setLiveResults([]);

    await processAllPdfs(pdfFiles, interpretations, (updated) => {
      setLiveResults([...updated]);
    });

    setStep('done');
  }

  // ✅ Download single PDF
  function downloadOne(result: ProcessResult) {
    if (result.status !== 'ready') return;
    saveAs(result.blob, result.fileName);
  }

  // ✅ Download all as ZIP
  async function downloadAll() {
    const ready = liveResults.filter(r => r.status === 'ready');
    if (ready.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const r of ready) {
        zip.file(r.fileName, r.blob);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const date = new Date().toLocaleDateString('en-AU').replace(/\//g, '-');
      saveAs(blob, `Interpretations_${date}.zip`);
    } finally {
      setIsZipping(false);
    }
  }

  function handleReset() {
    setStep('setup');
    setPdfFiles([]);
    setLiveResults([]);
    setError(null);
  }

  const readyCount = liveResults.filter(r => r.status === 'ready').length;
  const errorCount = liveResults.filter(r => r.status === 'error' && r.error !== 'Waiting...' && r.error !== 'Processing...').length;
  const isReady    = interpretations.length > 0 && pdfFiles.length > 0;

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
              Fill interpretations into one or multiple lung function PDFs
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
            {interpretations.length > 0 ? <CheckCircle2 className="h-3 w-3" /> : <Users className="h-3 w-3" />}
            {interpretations.length > 0 ? `${interpretations.length} patients` : 'No interpretations'}
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            pdfFiles.length > 0
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-muted/40 text-muted-foreground'
          )}>
            {pdfFiles.length > 0 ? <CheckCircle2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {pdfFiles.length > 0 ? `${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''}` : 'No PDFs'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Error banner */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="whitespace-pre-wrap flex-1">{error}</div>
              <button onClick={() => setError(null)} className="flex-shrink-0 hover:opacity-70">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── PROCESSING VIEW ── */}
          {step === 'processing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Processing {pdfFiles.length} PDF{pdfFiles.length > 1 ? 's' : ''}...</p>
                <p className="text-xs text-muted-foreground">
                  {liveResults.filter(r => r.status === 'ready' || (r.status === 'error' && r.error !== 'Waiting...' && r.error !== 'Processing...')).length} / {pdfFiles.length} done
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${pdfFiles.length > 0
                      ? (liveResults.filter(r => r.error !== 'Waiting...' && r.error !== 'Processing...').length / pdfFiles.length) * 100
                      : 0}%`
                  }}
                />
              </div>

              {/* Live results list */}
              <div className="flex flex-col gap-2">
                {liveResults.map((r, i) => (
                  <div key={i} className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                    r.status === 'ready'              && 'border-green-500/20 bg-green-500/5',
                    r.error === 'Processing...'       && 'border-primary/20 bg-primary/5',
                    r.error === 'Waiting...'           && 'border-border/40 bg-muted/5 opacity-50',
                    r.status === 'error' && r.error !== 'Waiting...' && r.error !== 'Processing...' && 'border-destructive/20 bg-destructive/5',
                  )}>
                    <div className="flex-shrink-0">
                      {r.status === 'ready' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {r.error === 'Processing...' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                      {r.error === 'Waiting...' && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                      {r.status === 'error' && r.error !== 'Waiting...' && r.error !== 'Processing...' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {r.status === 'ready' ? r.patientName : pdfFiles[i]?.name}
                      </p>
                      {r.error && r.error !== 'Waiting...' && r.error !== 'Processing...' && (
                        <p className="text-xs text-destructive mt-0.5 truncate">{r.error}</p>
                      )}
                      {r.error === 'Processing...' && (
                        <p className="text-xs text-primary mt-0.5">Extracting and matching...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DONE VIEW ── */}
          {step === 'done' && (
            <div className="space-y-5">

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total',   value: liveResults.length,  color: 'text-foreground',                          bg: 'bg-muted/20 border-border/40' },
                  { label: 'Success', value: readyCount,           color: 'text-green-600 dark:text-green-400',       bg: 'bg-green-500/5 border-green-500/20' },
                  { label: 'Failed',  value: errorCount,           color: 'text-destructive',                         bg: errorCount > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/20 border-border/40' },
                ].map(s => (
                  <div key={s.label} className={cn('px-4 py-3 rounded-xl border text-center', s.bg)}>
                    <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Download all */}
              {readyCount > 1 && (
                <Button
                  onClick={downloadAll}
                  disabled={isZipping}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
                >
                  {isZipping
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Package className="h-4 w-4" />
                  }
                  {isZipping ? 'Preparing ZIP...' : `Download All ${readyCount} PDFs as ZIP`}
                </Button>
              )}

              {/* Individual results */}
              <div className="flex flex-col gap-3">
                {liveResults.map((r, i) => (
                  <div key={i} className={cn(
                    'flex items-center gap-4 px-5 py-4 rounded-xl border',
                    r.status === 'ready' ? 'border-green-500/20 bg-green-500/5' : 'border-destructive/20 bg-destructive/5'
                  )}>
                    <div className="flex-shrink-0">
                      {r.status === 'ready'
                        ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                        : <AlertTriangle className="h-5 w-5 text-destructive" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {r.status === 'ready' ? r.patientName : pdfFiles[i]?.name}
                      </p>
                      {r.status === 'ready' && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.interpretation}</p>
                      )}
                      {r.status === 'error' && (
                        <p className="text-xs text-destructive mt-0.5">{r.error}</p>
                      )}
                    </div>
                    {r.status === 'ready' && (
                      <Button
                        size="sm"
                        onClick={() => downloadOne(r)}
                        className="gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-700 text-white border-0 flex-shrink-0"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-border/40">
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Process More PDFs
                </Button>
              </div>
            </div>
          )}

          {/* ── SETUP VIEW ── */}
          {step === 'setup' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left — Interpretations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      interpretations.length > 0 ? 'bg-green-500/20 text-green-600' : 'bg-muted/40 text-muted-foreground'
                    )}>
                      {interpretations.length > 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
                    </div>
                    <p className="text-sm font-semibold text-foreground">Interpretations File</p>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
                    {[
                      { id: 'upload', label: 'Upload File',           icon: Upload },
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
                        {loadingInterp
                          ? <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          : <Upload className="h-5 w-5 text-primary" />
                        }
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
                          {interpretations.length} patients from {interpFileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                          {interpretations.map(p => `${p.firstName} ${p.lastName}`).join(' · ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right — PDF Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      pdfFiles.length > 0 ? 'bg-green-500/20 text-green-600' : 'bg-muted/40 text-muted-foreground'
                    )}>
                      {pdfFiles.length > 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : '2'}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Upload PDF{pdfFiles.length > 1 ? 's' : ''}
                      {pdfFiles.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({pdfFiles.length} file{pdfFiles.length > 1 ? 's' : ''} selected)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                    onDragLeave={() => setIsDraggingPdf(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDraggingPdf(false); addPdfFiles(e.dataTransfer.files); }}
                    onClick={() => pdfRef.current?.click()}
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
                      isDraggingPdf ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20'
                    )}
                  >
                    {/* ✅ Multiple files allowed */}
                    <input ref={pdfRef} type="file" accept=".pdf" multiple className="hidden"
                      onChange={(e) => { if (e.target.files) addPdfFiles(e.target.files); e.target.value = ''; }} />
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">
                        Drop PDF{pdfFiles.length > 0 ? 's' : ''} here
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Click to browse · Multiple files supported
                      </p>
                    </div>
                  </div>

                  {/* PDF file list */}
                  {pdfFiles.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {pdfFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/40">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-foreground flex-1 truncate">{f.name}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); removePdf(i); }}
                            className="h-5 w-5 rounded flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Info */}
                  <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <p className="font-semibold">How it works:</p>
                    <p>1. Reads <strong>Last name</strong> + <strong>First name</strong> from each PDF</p>
                    <p>2. Matches to interpretations list (fuzzy match)</p>
                    <p>3. Adds text into the <strong>Interpretation</strong> section</p>
                    <p>4. Download individually or all as ZIP</p>
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
                  {isProcessing
                    ? 'Processing...'
                    : pdfFiles.length > 1
                      ? `Fill ${pdfFiles.length} PDFs`
                      : 'Fill Interpretation'
                  }
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}