import { useState, useCallback } from 'react';

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const speak = useCallback((text: string, rate = 0.9, id?: string, lang = 'ja-JP') => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;

      // Find Japanese voice if available
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find((v) => v.lang.startsWith('ja') || v.lang.includes('JP'));
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      if (id) setPlayingId(id);
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        setPlayingId(null);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setPlayingId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech error:', e);
      setIsPlaying(false);
      setPlayingId(null);
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setPlayingId(null);
    }
  }, []);

  return { speak, stop, isPlaying, playingId };
}
