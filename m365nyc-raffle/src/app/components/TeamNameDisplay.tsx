import React, { useState } from 'react';

interface TeamNameDisplayProps {
  name: string;
  disambiguator?: string;
  className?: string;
  disambiguatorClassName?: string;
}

// Keep first 3 + last 3 chars, replace the middle with password stars.
// Strings shorter than 7 chars get fully masked (length-preserving).
export function maskDisambiguator(value: string): string {
  if (!value) return '';
  if (value.length <= 6) return '*'.repeat(value.length);
  const start = value.slice(0, 3);
  const end = value.slice(-3);
  return `${start}${'*'.repeat(value.length - 6)}${end}`;
}

const TeamNameDisplay: React.FC<TeamNameDisplayProps> = ({
  name,
  disambiguator,
  className = '',
  disambiguatorClassName = 'text-xs text-gray-500 dark:text-gray-400 ml-2 font-mono tracking-tight',
}) => {
  const [revealed, setRevealed] = useState(false);

  if (!disambiguator) {
    return <span className={className}>{name}</span>;
  }

  // The raw disambiguator value is never rendered. Default state hides it
  // entirely; clicking the eye reveals the masked form, never the original.
  const masked = maskDisambiguator(disambiguator);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span>{name}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setRevealed((v) => !v);
        }}
        className="ml-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        aria-label={revealed ? 'Hide identifier' : 'Show identifier'}
        title={revealed ? 'Hide identifier' : 'Show identifier'}
      >
        {revealed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
      {revealed && <span className={disambiguatorClassName}>{masked}</span>}
    </span>
  );
};

export default TeamNameDisplay;
