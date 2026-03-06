"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WpmSample {
  time: number; // seconds since start
  wpm: number;
}

interface ConfidenceSample {
  time: number;
  score: number;
}

export interface SpeechMetrics {
  wpm: number;
  wpmHistory: WpmSample[];
  fillerCount: number;
  fillerWords: Record<string, number>;
  confidenceScore: number;
  confidenceHistory: ConfidenceSample[];
  duration: number; // seconds
}

export interface UseSpeechAnalyticsReturn {
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  transcript: string;
  metrics: SpeechMetrics;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILLER_WORDS = [
  "um", "uh", "like", "you know", "basically", "actually",
  "so", "right", "i mean", "sort of", "kind of", "well",
];

const IDEAL_WPM_MIN = 120;
const IDEAL_WPM_MAX = 160;
const SAMPLE_INTERVAL_MS = 2000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countFillers(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const counts: Record<string, number> = {};
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      counts[filler] = matches.length;
    }
  }
  return counts;
}

function calcConfidence(
  recognitionConfidence: number,
  fillerRatio: number,
  wpm: number,
  wpmSamples: number[],
): number {
  // Component 1: Recognition confidence (0-100) — 30% weight
  const recScore = recognitionConfidence * 100;

  // Component 2: Inverse filler ratio (0-100) — 25% weight
  const fillerScore = Math.max(0, 100 - fillerRatio * 500);

  // Component 3: WPM in ideal range (0-100) — 25% weight
  let paceScore = 100;
  if (wpm < IDEAL_WPM_MIN) {
    paceScore = Math.max(0, 100 - (IDEAL_WPM_MIN - wpm) * 2);
  } else if (wpm > IDEAL_WPM_MAX) {
    paceScore = Math.max(0, 100 - (wpm - IDEAL_WPM_MAX) * 2);
  }

  // Component 4: Consistency — low variance in pace (0-100) — 20% weight
  let consistencyScore = 80; // default if not enough samples
  if (wpmSamples.length >= 3) {
    const mean = wpmSamples.reduce((a, b) => a + b, 0) / wpmSamples.length;
    const variance = wpmSamples.reduce((s, v) => s + (v - mean) ** 2, 0) / wpmSamples.length;
    const stdDev = Math.sqrt(variance);
    consistencyScore = Math.max(0, Math.min(100, 100 - stdDev * 1.5));
  }

  const raw = recScore * 0.3 + fillerScore * 0.25 + paceScore * 0.25 + consistencyScore * 0.2;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSpeechAnalytics(): UseSpeechAnalyticsReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [metrics, setMetrics] = useState<SpeechMetrics>({
    wpm: 0,
    wpmHistory: [],
    fillerCount: 0,
    fillerWords: {},
    confidenceScore: 0,
    confidenceHistory: [],
    duration: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef("");
  const avgConfidenceRef = useRef<number[]>([]);
  const wpmRawSamples = useRef<number[]>([]);

  // Check browser support
  const isSupported = typeof window !== "undefined" && !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  const updateMetrics = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (elapsed < 0.5) return;

    const text = transcriptRef.current;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const wpm = Math.round((wordCount / elapsed) * 60);

    const fillerWords = countFillers(text);
    const fillerCount = Object.values(fillerWords).reduce((s, c) => s + c, 0);
    const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

    const avgConf = avgConfidenceRef.current.length > 0
      ? avgConfidenceRef.current.reduce((a, b) => a + b, 0) / avgConfidenceRef.current.length
      : 0.7;

    wpmRawSamples.current.push(wpm);
    const confidence = calcConfidence(avgConf, fillerRatio, wpm, wpmRawSamples.current);
    const time = Math.round(elapsed);

    setMetrics((prev) => ({
      wpm,
      wpmHistory: [...prev.wpmHistory, { time, wpm }],
      fillerCount,
      fillerWords,
      confidenceScore: confidence,
      confidenceHistory: [...prev.confidenceHistory, { time, score: confidence }],
      duration: time,
    }));
  }, []);

  const start = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
          avgConfidenceRef.current.push(result[0].confidence);
        } else {
          interim += result[0].transcript;
        }
      }

      const full = (final + " " + interim).trim();
      transcriptRef.current = full;
      setTranscript(full);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // already started
        }
      }
    };

    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();
    transcriptRef.current = "";
    avgConfidenceRef.current = [];
    wpmRawSamples.current = [];
    setTranscript("");
    setMetrics({
      wpm: 0, wpmHistory: [], fillerCount: 0, fillerWords: {},
      confidenceScore: 0, confidenceHistory: [], duration: 0,
    });

    recognition.start();
    setIsListening(true);

    // Sample metrics at interval
    intervalRef.current = setInterval(updateMetrics, SAMPLE_INTERVAL_MS);
  }, [isSupported, updateMetrics]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null; // prevent auto-restart
      rec.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsListening(false);
    // Final metrics update
    updateMetrics();
  }, [updateMetrics]);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setMetrics({
      wpm: 0, wpmHistory: [], fillerCount: 0, fillerWords: {},
      confidenceScore: 0, confidenceHistory: [], duration: 0,
    });
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { isListening, isSupported, start, stop, reset, transcript, metrics };
}
