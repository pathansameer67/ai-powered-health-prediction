import React from 'react';

interface FormattedClinicalContentProps {
  content: string;
}

export const FormattedClinicalContent: React.FC<FormattedClinicalContentProps> = ({ content }) => {
  if (!content) return null;

  // Split by markdown sections or lines
  const lines = content.split('\n');

  return (
    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-100 font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Section header (### or ##)
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <div key={idx} className="pt-2 pb-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center space-x-1.5 tracking-tight border-b border-slate-100 dark:border-slate-800/80 pb-1">
                <span>{headerText}</span>
              </h4>
            </div>
          );
        }

        // Disclaimer separator or disclaimer line
        if (trimmed.startsWith('---') || trimmed.startsWith('*Disclaimer:') || trimmed.startsWith('Disclaimer:')) {
          return (
            <div
              key={idx}
              className="mt-3 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 italic"
            >
              {trimmed.replace(/^---\s*/, '')}
            </div>
          );
        }

        // Bullet point line
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
          const bulletText = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1 text-slate-700 dark:text-slate-200">
              <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
              <span className="flex-1 leading-snug">
                {renderInlineFormatting(bulletText)}
              </span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="leading-relaxed">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

function renderInlineFormatting(text: string): React.ReactNode {
  // Parse **bold text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
