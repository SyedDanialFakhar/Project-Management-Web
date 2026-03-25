import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PdfUploader } from '@/components/pdf-interpreter/PdfUploader';
import { InterpretationFileUploader } from '@/components/pdf-interpreter/InterpretationFileUploader';
import { ResultCard } from '@/components/pdf-interpreter/ResultCard';
import { ProgressBar } from '@/components/pdf-interpreter/ProgressBar';
import { InterpretationHistory } from '@/components/pdf-interpreter/InterpretationHistory';
import { usePdfInterpretation } from '@/hooks/usePdfInterpretation';
import { useInterpretationStore } from '@/hooks/useInterpretationStore';
import { Loader2, FileScan, Layers } from 'lucide-react';

type Mode = 'single' | 'batch';

export default function PdfInterpreterPage() {
  const [mode, setMode] = useState<Mode>('single');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [interpretationsFile, setInterpretationsFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: '' });
  const [isSaving, setIsSaving] = useState(false);

  const { processInterpretation, processMultipleInterpretations, isProcessing, error } = usePdfInterpretation();
  const { saveInterpretationFile } = useInterpretationStore();

  const handleSingleProcess = async () => {
    if (!pdfFile || !interpretationsFile) {
      alert('Please select both a PDF and interpretations file');
      return;
    }

    const result = await processInterpretation(pdfFile, interpretationsFile);
    setResult(result);

    // Save to interpretation_store if successful
    if (result.success && result.interpretation) {
      setIsSaving(true);
      try {
        // Create a map of patient name to interpretation
        const interpretationsMap: Record<string, string> = {};
        interpretationsMap[result.patientName!] = result.interpretation;
        
        await saveInterpretationFile.mutateAsync({
          fileName: interpretationsFile.name,
          interpretations: interpretationsMap,
          patientCount: 1,
        });
      } catch (err) {
        console.error('Failed to save to history:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBatchProcess = async () => {
    if (pdfFiles.length === 0 || !interpretationsFile) {
      alert('Please select PDFs and interpretations file');
      return;
    }

    const results = await processMultipleInterpretations(
      pdfFiles,
      interpretationsFile,
      (current, total, fileName, patientName) => {
        setProgress({ current, total, currentFile: `${fileName} (${patientName})` });
      }
    );
    
    setBatchResults(results);

    // Save all successful results to interpretation_store as one record
    const successfulResults = results.filter(res => res.success && res.interpretation);
    
    if (successfulResults.length > 0) {
      setIsSaving(true);
      try {
        // Create a map of all patient names to their interpretations
        const interpretationsMap: Record<string, string> = {};
        for (const res of successfulResults) {
          if (res.patientName && res.interpretation) {
            interpretationsMap[res.patientName] = res.interpretation;
          }
        }
        
        await saveInterpretationFile.mutateAsync({
          fileName: interpretationsFile.name,
          interpretations: interpretationsMap,
          patientCount: successfulResults.length,
        });
      } catch (err) {
        console.error('Failed to save to history:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const resetSingle = () => {
    setPdfFile(null);
    setInterpretationsFile(null);
    setResult(null);
  };

  const resetBatch = () => {
    setPdfFiles([]);
    setInterpretationsFile(null);
    setBatchResults([]);
    setProgress({ current: 0, total: 0, currentFile: '' });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileScan className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">PDF Interpreter</h1>
            <p className="text-sm text-muted-foreground">
              Match patient PDFs with interpretations and add them automatically
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <FileScan className="h-3.5 w-3.5" />
              Single PDF
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <Layers className="h-3.5 w-3.5" />
              Batch Process
            </TabsTrigger>
          </TabsList>

          {/* Single Mode */}
          <TabsContent value="single" className="space-y-5 mt-5">
            <PdfUploader
              onFileSelect={setPdfFile}
              selectedFile={pdfFile}
              label="Patient PDF"
            />
            
            <InterpretationFileUploader
              onFileSelect={setInterpretationsFile}
              selectedFile={interpretationsFile}
            />

            <Button
              onClick={handleSingleProcess}
              disabled={!pdfFile || !interpretationsFile || isProcessing || isSaving}
              className="w-full gap-2"
            >
              {isProcessing || isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isProcessing ? 'Processing...' : 'Saving to history...'}
                </>
              ) : (
                <>
                  <FileScan className="h-4 w-4" />
                  Add Interpretation to PDF
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {result && (
              <ResultCard
                success={result.success}
                message={result.message}
                pdfBlob={result.pdfBlob}
                fileName={result.fileName}
                patientName={result.patientName}
                onDownload={resetSingle}
              />
            )}
          </TabsContent>

          {/* Batch Mode */}
          <TabsContent value="batch" className="space-y-5 mt-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient PDFs (multiple)</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => setPdfFiles(Array.from(e.target.files || []))}
                  className="hidden"
                  id="batch-pdf-upload"
                />
                <label htmlFor="batch-pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm">
                    {pdfFiles.length > 0 
                      ? `${pdfFiles.length} PDFs selected` 
                      : 'Click to select multiple PDF files'}
                  </span>
                </label>
              </div>
              {pdfFiles.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {pdfFiles.map((file, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <InterpretationFileUploader
              onFileSelect={setInterpretationsFile}
              selectedFile={interpretationsFile}
            />

            <Button
              onClick={handleBatchProcess}
              disabled={pdfFiles.length === 0 || !interpretationsFile || isProcessing || isSaving}
              className="w-full gap-2"
            >
              {isProcessing || isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isProcessing 
                    ? `Processing ${progress.current}/${progress.total}...` 
                    : 'Saving to history...'}
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Process {pdfFiles.length} PDFs
                </>
              )}
            </Button>

            {isProcessing && progress.total > 0 && (
              <ProgressBar
                current={progress.current}
                total={progress.total}
                currentFile={progress.currentFile}
              />
            )}

            {batchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Results</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {batchResults.map((res, i) => (
                    <ResultCard
                      key={i}
                      success={res.success}
                      message={res.message}
                      pdfBlob={res.pdfBlob}
                      fileName={res.fileName}
                      patientName={res.patientName}
                    />
                  ))}
                </div>
                {batchResults.every(r => r.success) && (
                  <Button onClick={resetBatch} variant="outline" className="w-full">
                    Process More PDFs
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* History Section */}
        <div className="pt-6 border-t">
          <InterpretationHistory />
        </div>
      </div>
    </div>
  );
}