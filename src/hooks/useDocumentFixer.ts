import { useState } from 'react';

export function useDocumentFixer() {
  const [isFixing, setIsFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ No API key needed — LanguageTool is completely free
  const fixDocument = async (text: string): Promise<string> => {
    setIsFixing(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('text', text);
      formData.append('language', 'en-US');

      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) throw new Error('LanguageTool API error');

      const data = await response.json();
      const matches = data.matches;

      if (!matches || matches.length === 0) {
        return text + '\n\n--- SUGGESTIONS ---\n• No errors found! Your text looks great.';
      }

      // ✅ Apply all corrections to the text
      let fixedText = text;
      let offset = 0;

      // Sort by offset to apply in order
      const sorted = [...matches].sort((a: any, b: any) => a.offset - b.offset);

      for (const match of sorted) {
        if (!match.replacements || match.replacements.length === 0) continue;
        const replacement = match.replacements[0].value;
        const start = match.offset + offset;
        const end = start + match.length;
        fixedText = fixedText.slice(0, start) + replacement + fixedText.slice(end);
        offset += replacement.length - match.length;
      }

      // ✅ Build suggestions from unique rule categories
      const seen = new Set<string>();
      const suggestions: string[] = [];

      for (const match of sorted) {
        const ruleId = match.rule?.id;
        if (!ruleId || seen.has(ruleId)) continue;
        seen.add(ruleId);
        if (match.message) suggestions.push(match.message);
        if (suggestions.length >= 5) break;
      }

      const suggStr = suggestions.length > 0
        ? suggestions.map(s => `• ${s}`).join('\n')
        : '• No major issues found.';

      return `${fixedText}\n\n--- SUGGESTIONS ---\n${suggStr}`;

    } catch (err: any) {
      const msg = err.message || 'Failed to fix document';
      setError(msg);
      throw err;
    } finally {
      setIsFixing(false);
    }
  };

  // ✅ No API key needed — these are dummies to keep the interface compatible
  const getSavedKey = () => 'free';
  const saveKey = (_key: string) => {};
  const clearKey = () => {};

  return { fixDocument, isFixing, error, getSavedKey, saveKey, clearKey };
}