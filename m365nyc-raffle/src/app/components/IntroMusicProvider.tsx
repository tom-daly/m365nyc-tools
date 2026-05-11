'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type IntroMusicContextValue = {
  isPlaying: boolean;
  toggleAudio: () => void;
};

const IntroMusicContext = createContext<IntroMusicContextValue | null>(null);

export function IntroMusicProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  const clearFadeInterval = useCallback(() => {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const audio = new Audio('/sounds/intro.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      clearFadeInterval();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, [clearFadeInterval]);

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const fadeOutDuration = 3000;
      const fadeSteps = 30;
      const volumeStep = audio.volume / fadeSteps;
      const fadeInterval = fadeOutDuration / fadeSteps;

      clearFadeInterval();

      fadeIntervalRef.current = window.setInterval(() => {
        if (audio.volume > volumeStep) {
          audio.volume = Math.max(0, audio.volume - volumeStep);
        } else {
          audio.volume = 0;
          audio.pause();
          audio.volume = 0.3;
          clearFadeInterval();
        }
      }, fadeInterval);

      return;
    }

    clearFadeInterval();
    audio.volume = 0.3;
    audio.play().catch(console.error);
  }, [clearFadeInterval, isPlaying]);

  const value = useMemo(() => ({
    isPlaying,
    toggleAudio
  }), [isPlaying, toggleAudio]);

  return (
    <IntroMusicContext.Provider value={value}>
      {children}
    </IntroMusicContext.Provider>
  );
}

export function useIntroMusic() {
  const context = useContext(IntroMusicContext);

  if (!context) {
    throw new Error('useIntroMusic must be used within an IntroMusicProvider');
  }

  return context;
}
