import type { ExtractedLetterData } from '@/hooks/useLetterGenerator';
import { User, Stethoscope, Pill, AlertCircle, Users, FileText, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LetterDataPreviewProps {
  data: ExtractedLetterData;
  onChange: (data: ExtractedLetterData) => void;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-3 rounded-lg border border-border/60 bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function BulletField({ label, items, icon: Icon, color, onChange }: {
  label: string; items: string[]; icon: any; color: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <div className={cn('p-4 rounded-xl border space-y-2', color)}>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">•</span>
          <input
            value={item}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            className="flex-1 h-7 px-2 rounded-md border border-border/40 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="text-muted-foreground hover:text-destructive text-xs px-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        className="text-xs text-primary hover:opacity-80 transition-opacity"
      >
        + Add item
      </button>
    </div>
  );
}

export function LetterDataPreview({ data, onChange }: LetterDataPreviewProps) {
  const update = (key: keyof ExtractedLetterData, val: any) => onChange({ ...data, [key]: val });

  return (
    <div className="space-y-4 overflow-y-auto">
      <p className="text-xs text-muted-foreground">Review and edit the extracted data before generating the letter.</p>

      {/* Referring doctor */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Referring Doctor</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Field label="Name" value={data.referringDoctorName} onChange={v => update('referringDoctorName', v)} />
          <Field label="Clinic" value={data.referringDoctorClinic} onChange={v => update('referringDoctorClinic', v)} />
          <Field label="Address" value={data.referringDoctorAddress} onChange={v => update('referringDoctorAddress', v)} />
          <Field label="Salutation (first name)" value={data.salutation} onChange={v => update('salutation', v)} />
        </div>
      </div>

      {/* Patient */}
      <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Patient</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Full Name" value={data.patientName} onChange={v => update('patientName', v)} />
          <Field label="Date of Birth" value={data.patientDOB} onChange={v => update('patientDOB', v)} />
          <Field label="Contact" value={data.patientContact} onChange={v => update('patientContact', v)} />
          <Field label="Date of Letter" value={data.date} onChange={v => update('date', v)} />
        </div>
        <Field label="Address" value={data.patientAddress} onChange={v => update('patientAddress', v)} />
      </div>

      {/* Medical sections */}
      <BulletField label="PMHx" items={data.pmhx} icon={ClipboardList} color="border-border/40 bg-muted/10"
        onChange={v => update('pmhx', v)} />
      <BulletField label="Medications" items={data.medications} icon={Pill} color="border-border/40 bg-muted/10"
        onChange={v => update('medications', v)} />
      <BulletField label="Allergies" items={data.allergies} icon={AlertCircle} color="border-amber-500/20 bg-amber-500/5"
        onChange={v => update('allergies', v)} />
      <BulletField label="Social History" items={data.socialHistory} icon={Users} color="border-border/40 bg-muted/10"
        onChange={v => update('socialHistory', v)} />

      {/* Body */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Letter Body</p>
        </div>
        <textarea
          value={data.body}
          onChange={(e) => update('body', e.target.value)}
          rows={8}
          className="w-full resize-none rounded-xl border border-border/60 bg-muted/10 p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans"
        />
      </div>

      {/* Plan */}
      <BulletField label="Plan" items={data.plan} icon={ClipboardList} color="border-green-500/20 bg-green-500/5"
        onChange={v => update('plan', v)} />
    </div>
  );
}