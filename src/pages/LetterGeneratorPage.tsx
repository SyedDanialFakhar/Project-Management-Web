import { useState } from 'react';
import JSZip from 'jszip';
import { FileText, ArrowLeft, Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useTemplateDetector, type TemplateType } from '@/hooks/useTemplateDetector';
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

  // ✅ TEMPLATE SYSTEM
  const templateMap: Record<TemplateType, string> = {
    SARAH: 'LETTER_TEMPLATE_FINAL.docx',
    SENTHURAN: 'LETTER_TEMPLATE_SENTHURAN.docx',
  };

  const AVAILABLE_TEMPLATES = [
    { label: 'Dr Sarah Yeo', value: 'LETTER_TEMPLATE_FINAL.docx' },
    { label: 'Dr Senthuran Shivakumar', value: 'LETTER_TEMPLATE_SENTHURAN.docx' },
  ];

  const [selectedTemplate, setSelectedTemplate] = useState<string>('LETTER_TEMPLATE_FINAL.docx');
  const [detectedDoctor, setDetectedDoctor] = useState<TemplateType | null>(null);

  const { detectDoctor } = useTemplateDetector();

  const [step, setStep] = useState<Step>('input');
  const [tab, setTab] = useState<Tab>('generate');
  const [transcript, setTranscript] = useState('');
  const [transcriptName, setTranscriptName] = useState('');
  const [data, setData] = useState<ExtractedLetterData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [batchLetters, setBatchLetters] = useState<BatchLetter[]>([]);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [reviewingFromBatch, setReviewingFromBatch] = useState(false);

  const { extractAndGenerate, isGenerating, error } = useLetterGenerator();
  const { splitTranscript } = useLetterSplitter();
  const { data: history = [], saveLetter, deleteLetter } = useLetterHistory();

  // ✅ DETECTION
  async function handleTranscriptLoaded(text: string, name: string) {
    setTranscript(text);
    setTranscriptName(name);
    setStep('input');
    setBatchLetters([]);
    setReviewingFromBatch(false);

    const doctorType = await detectDoctor(text);
    setDetectedDoctor(doctorType);
    setSelectedTemplate(templateMap[doctorType]);
  }

  function getDoctorLabel() {
    if (detectedDoctor === 'SARAH') return 'Dr Sarah Yeo';
    if (detectedDoctor === 'SENTHURAN') return 'Dr Senthuran Shivakumar';
    return undefined;
  }

  function detectMultiplePatients(text: string): boolean {
    const patterns = [
      /this is \w+ dictating/gi,
      /please see this letter to dr/gi,
      /date of birth[,\s]+\d/gi,
    ];
    return patterns.some(p => (text.match(p)?.length || 0) > 1);
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

        for (let i = 0; i < parts.length; i++) {
          results[i] = { ...results[i], status: 'extracting' };
          setBatchLetters([...results]);

          try {
            const extracted = await extractAndGenerate(parts[i]);
            extracted.plan = [];
            results[i] = { ...results[i], data: extracted, status: 'ready' };
          } catch (err: any) {
            results[i] = { ...results[i], status: 'error', error: err.message };
          }

          setBatchLetters([...results]);
        }

        setStep('batch_ready');

      } catch {
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

  // ✅ FIXED DOWNLOAD (TEMPLATE PASSED)
  async function handleDownload() {
    if (!data) return;

    setIsDownloading(true);

    try {
      const cleanName = data.patientName.replace(/\s+/g, '_');
      const dateSlug = data.date.replace(/\s/g, '_').replace(/,/g, '');

      await downloadLetter(
        data,
        `${cleanName}_${dateSlug}.docx`,
        selectedTemplate // ✅ FIX
      );

      await saveLetter.mutateAsync(data);
      setStep('done');

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDownloadOne(letter: BatchLetter) {
    if (!letter.data) return;

    await downloadLetter(
      letter.data,
      `${letter.data.patientName}.docx`,
      selectedTemplate // ✅ FIX
    );

    await saveLetter.mutateAsync(letter.data);
  }

  async function handleDownloadAll() {
    setIsDownloadingAll(true);

    try {
      const zip = new JSZip();

      for (const letter of batchLetters) {
        if (!letter.data) continue;

        const blob = await generateDocxBlob(
          letter.data,
          selectedTemplate // ✅ FIX
        );

        zip.file(`${letter.data.patientName}.docx`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'Letters.zip';
      a.click();

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

  function handleBack() {
    if (step === 'review' && reviewingFromBatch) {
      setStep('batch_ready');
      setReviewingFromBatch(false);
      setData(null);
    } else {
      handleReset();
    }
  }

  function handleOpenFromHistory(record: any) {
    setData(record.extracted_data);
    setStep('review');
    setTab('generate');
  }

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="flex justify-between p-4 border-b">
        <h1 className="flex items-center gap-2 font-bold">
          <FileText className="h-4 w-4" />
          Letter Generator
        </h1>
      </div>

      {/* BODY */}
      <div className="p-6">

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

        {step === 'batch_ready' && (
          <BatchLetterList
            letters={batchLetters}
            selectedTemplate={selectedTemplate}
            templates={AVAILABLE_TEMPLATES}
            detectedDoctor={getDoctorLabel()}
            onTemplateChange={setSelectedTemplate}
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
            hasTranscript={!!transcript}
            selectedTemplate={selectedTemplate}
            templates={AVAILABLE_TEMPLATES}
            detectedDoctor={getDoctorLabel()}
            onTemplateChange={setSelectedTemplate}
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
    </div>
  );
}