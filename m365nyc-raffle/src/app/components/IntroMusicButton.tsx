'use client';

import { motion } from 'framer-motion';
import { useIntroMusic } from './IntroMusicProvider';

type IntroMusicButtonProps = {
  className?: string;
};

export default function IntroMusicButton({ className = '' }: IntroMusicButtonProps) {
  const { isPlaying, toggleAudio } = useIntroMusic();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleAudio}
      className={className}
      title={isPlaying ? 'Pause intro music' : 'Play intro music'}
    >
      {isPlaying ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </motion.button>
  );
}
