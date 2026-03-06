"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSpeechAnalytics, type SpeechMetrics } from "@/hooks/useSpeechAnalytics";
import { VOICE_MAP } from "@/lib/prompts/simulator-scoring";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SimulatorPhase =
  | "setup"
  | "asking"
  | "listening"
  | "scoring"
  | "follow_up_asking"
  | "follow_up_listening"
  | "follow_up_scoring"
  | "feedback"
  | "completed";

export interface SimulatorQuestion {
  text: string;
  type: string;
  referenceAnswer?: string;
  moduleTitle: string;
}

export interface ScoreResult {
  relevance: number | null;
  specificity: number | null;
  structure: number | null;
  contentQuality: number | null;
  feedback: string;
  improvedAnswer: string | null;
  followUp: string | null;
  answerId: string | null;
  timedOut?: boolean;
}

export interface AnswerRecord {
  questionText: string;
  questionType: string;
  transcript: string;
  metrics: SpeechMetrics;
  score: ScoreResult | null;
  followUp?: {
    question: string;
    transcript: string;
    metrics: SpeechMetrics;
    score: ScoreResult | null;
  };
}

export interface SimulatorConfig {
  boardId?: string;
  companyName: string;
  role: string;
  roundType: string;
  interviewerMode: "friendly" | "technical" | "stress" | "skeptical";
  questionCount: number;
  selectedModules?: string[];
  // Skeptical mode
  vulnerabilityId?: string;
  vulnerabilityData?: unknown; // RiskAuditReport
  singleRiskItemId?: string;
}

export interface UseInterviewSimulatorReturn {
  // State
  phase: SimulatorPhase;
  sessionId: string | null;
  questions: SimulatorQuestion[];
  currentIndex: number;
  answers: AnswerRecord[];
  config: SimulatorConfig | null;
  isLoading: boolean;
  error: string | null;
  // Speech analytics passthrough
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  metrics: SpeechMetrics;
  // Actions
  startSession: (config: SimulatorConfig) => Promise<void>;
  stopListening: () => void;
  nextQuestion: () => void;
  skipQuestion: () => void;
  retryAnswer: () => void;
  endEarly: () => Promise<void>;
  skipTTS: () => void;
}

// ---------------------------------------------------------------------------
// Aggregate score computation
// ---------------------------------------------------------------------------

export function computeAggregateScores(answers: AnswerRecord[]) {
  const scored = answers.filter(
    (a) => a.score && a.score.relevance !== null
  );

  if (scored.length === 0) {
    return {
      overallScore: 0,
      contentScore: 0,
      deliveryScore: 0,
      avgWpm: 0,
      totalFillers: 0,
      avgConfidence: 0,
      totalDurationSecs: 0,
    };
  }

  // Content scores
  const contentAvg =
    scored.reduce((sum, a) => {
      const s = a.score!;
      return (
        sum +
        ((s.relevance || 0) +
          (s.specificity || 0) +
          (s.structure || 0) +
          (s.contentQuality || 0)) /
          4
      );
    }, 0) / scored.length;

  // Delivery scores
  const allAnswers = answers.filter((a) => a.transcript);
  const avgWpm = allAnswers.length > 0
    ? Math.round(
        allAnswers.reduce((s, a) => s + a.metrics.wpm, 0) / allAnswers.length
      )
    : 0;
  const totalFillers = allAnswers.reduce(
    (s, a) => s + a.metrics.fillerCount,
    0
  );
  const avgConfidence = allAnswers.length > 0
    ? Math.round(
        allAnswers.reduce((s, a) => s + a.metrics.confidenceScore, 0) /
          allAnswers.length
      )
    : 0;
  const totalDurationSecs = allAnswers.reduce(
    (s, a) => s + a.metrics.duration,
    0
  );

  // Compute delivery score
  let paceScore = 100;
  if (avgWpm < 120) paceScore = Math.max(0, 100 - (120 - avgWpm) * 2);
  if (avgWpm > 160) paceScore = Math.max(0, 100 - (avgWpm - 160) * 2);
  const avgFillersPerAnswer =
    allAnswers.length > 0 ? totalFillers / allAnswers.length : 0;
  const fillerScore = Math.max(0, 100 - avgFillersPerAnswer * 10);
  const deliveryAvg = Math.round(
    paceScore * 0.3 + fillerScore * 0.3 + avgConfidence * 0.4
  );

  const overallScore = Math.round(contentAvg * 0.55 + deliveryAvg * 0.45);

  return {
    overallScore,
    contentScore: Math.round(contentAvg),
    deliveryScore: deliveryAvg,
    avgWpm,
    totalFillers,
    avgConfidence,
    totalDurationSecs,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInterviewSimulator(): UseInterviewSimulatorReturn {
  const [phase, setPhase] = useState<SimulatorPhase>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SimulatorQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [config, setConfig] = useState<SimulatorConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compose useSpeechAnalytics
  const speech = useSpeechAnalytics();

  // Refs for audio and timers
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isFollowUpRef = useRef(false);
  const parentAnswerIdRef = useRef<string | null>(null);
  const followUpQuestionRef = useRef<string | null>(null);
  // Track transcript for silence detection
  const lastTranscriptRef = useRef("");
  const phaseRef = useRef<SimulatorPhase>("setup");

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Audio playback ──
  const playQuestion = useCallback(
    async (text: string, isFollowUp = false) => {
      setPhase(isFollowUp ? "follow_up_asking" : "asking");
      setError(null);

      const voice = config ? VOICE_MAP[config.interviewerMode] || "onyx" : "onyx";

      const beginListeningPhase = () => {
        setPhase(isFollowUp ? "follow_up_listening" : "listening");
        speech.start();
      };

      try {
        // Try OpenAI TTS first
        const res = await fetch("/api/simulator/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            beginListeningPhase();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            // Fallback to browser TTS
            fallbackBrowserTTS(text, beginListeningPhase);
          };

          await audio.play();
          return;
        }
      } catch {
        // Network error — fall through to browser TTS
      }

      // Fallback: browser SpeechSynthesis
      fallbackBrowserTTS(text, beginListeningPhase);
    },
    [config, speech]
  );

  // ── Browser TTS fallback ──
  const fallbackBrowserTTS = useCallback(
    (text: string, onEnd: () => void) => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = onEnd;
        utterance.onerror = () => {
          // Last fallback: text-only with delay
          setTimeout(onEnd, 2000);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        // Text-only fallback — show question for 2s then start
        setTimeout(onEnd, 2000);
      }
    },
    []
  );

  // ── Silence detection ──
  useEffect(() => {
    const currentPhase = phaseRef.current;
    if (currentPhase !== "listening" && currentPhase !== "follow_up_listening")
      return;
    if (!speech.transcript || speech.transcript.trim().length < 20) return;

    // If transcript changed, reset timer
    if (speech.transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = speech.transcript;
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // Auto-stop after 4s of silence
        if (
          phaseRef.current === "listening" ||
          phaseRef.current === "follow_up_listening"
        ) {
          handleStopListening();
        }
      }, 4000);
    }

    return () => clearTimeout(silenceTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript, phase]);

  // ── Stop listening and score ──
  const handleStopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    speech.stop();

    const finalTranscript = speech.transcript;
    const finalMetrics = { ...speech.metrics };
    const currentPhase = phaseRef.current;
    const isFollowUp =
      currentPhase === "follow_up_listening" ||
      currentPhase === "follow_up_scoring";

    setPhase(isFollowUp ? "follow_up_scoring" : "scoring");

    // Score the answer
    scoreAnswer(finalTranscript, finalMetrics, isFollowUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech]);

  // ── Score answer ──
  const scoreAnswer = useCallback(
    async (
      transcript: string,
      metrics: SpeechMetrics,
      isFollowUp: boolean
    ) => {
      if (!config || !sessionId) return;

      const question = isFollowUp
        ? followUpQuestionRef.current || ""
        : questions[currentIndex]?.text || "";
      const questionType = isFollowUp
        ? "B"
        : questions[currentIndex]?.type || "B";
      const referenceAnswer = isFollowUp
        ? undefined
        : questions[currentIndex]?.referenceAnswer;

      // For skeptical mode, pass the reference answer as vulnerability context
      const vulnerabilityContext =
        config.interviewerMode === "skeptical" && !isFollowUp
          ? questions[currentIndex]?.referenceAnswer
          : undefined;

      setIsLoading(true);

      try {
        const res = await fetch("/api/simulator/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionIndex: currentIndex,
            questionText: question,
            questionType,
            referenceAnswer,
            vulnerabilityContext,
            transcript,
            duration: metrics.duration,
            wpm: metrics.wpm,
            fillerCount: metrics.fillerCount,
            confidenceScore: metrics.confidenceScore,
            interviewerMode: config.interviewerMode,
            companyName: config.companyName,
            role: config.role,
            isFollowUp,
            parentAnswerId: isFollowUp ? parentAnswerIdRef.current : undefined,
          }),
        });

        const score: ScoreResult = await res.json();

        if (isFollowUp) {
          // Attach follow-up to the last answer
          setAnswers((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) {
              updated[updated.length - 1] = {
                ...last,
                followUp: {
                  question: followUpQuestionRef.current || "",
                  transcript,
                  metrics,
                  score,
                },
              };
            }
            return updated;
          });
          isFollowUpRef.current = false;
          parentAnswerIdRef.current = null;
          followUpQuestionRef.current = null;
          setPhase("feedback");
        } else {
          // Create new answer record
          const record: AnswerRecord = {
            questionText: question,
            questionType,
            transcript,
            metrics,
            score,
          };

          setAnswers((prev) => [...prev, record]);

          // Check for follow-up
          if (score.followUp) {
            isFollowUpRef.current = true;
            parentAnswerIdRef.current = score.answerId;
            followUpQuestionRef.current = score.followUp;
            speech.reset();
            playQuestion(score.followUp, true);
          } else {
            setPhase("feedback");
          }
        }
      } catch (err) {
        console.error("Scoring error:", err);
        setError("Failed to score answer. Please try again.");

        // Still record the answer without scores
        if (!isFollowUp) {
          const record: AnswerRecord = {
            questionText: question,
            questionType,
            transcript,
            metrics,
            score: null,
          };
          setAnswers((prev) => [...prev, record]);
        }
        setPhase("feedback");
      } finally {
        setIsLoading(false);
      }
    },
    [config, sessionId, questions, currentIndex, speech, playQuestion]
  );

  // ── Start session ──
  const startSession = useCallback(
    async (sessionConfig: SimulatorConfig) => {
      setIsLoading(true);
      setError(null);
      setConfig(sessionConfig);

      try {
        const res = await fetch("/api/simulator/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId: sessionConfig.boardId,
            companyName: sessionConfig.companyName,
            role: sessionConfig.role,
            roundType: sessionConfig.roundType,
            interviewerMode: sessionConfig.interviewerMode,
            questionCount: sessionConfig.questionCount,
            selectedModules: sessionConfig.selectedModules,
            vulnerabilityData: sessionConfig.vulnerabilityData,
            singleRiskItemId: sessionConfig.singleRiskItemId,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to create session");
        }

        const data = await res.json();
        setSessionId(data.sessionId);
        setQuestions(data.questions);
        setCurrentIndex(0);
        setAnswers([]);
        setIsLoading(false);

        // Start with the first question
        playQuestion(data.questions[0].text);
      } catch (err) {
        console.error("Start session error:", err);
        setError("Failed to start session. Please try again.");
        setIsLoading(false);
      }
    },
    [playQuestion]
  );

  // ── Next question ──
  const nextQuestion = useCallback(() => {
    speech.reset();
    lastTranscriptRef.current = "";
    isFollowUpRef.current = false;
    parentAnswerIdRef.current = null;
    followUpQuestionRef.current = null;

    const nextIdx = currentIndex + 1;

    if (nextIdx >= questions.length) {
      // All questions done — complete session
      const aggregates = computeAggregateScores(answers);

      if (sessionId) {
        fetch("/api/simulator/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            ...aggregates,
          }),
        }).catch(() => {});
      }

      setPhase("completed");
    } else {
      setCurrentIndex(nextIdx);
      playQuestion(questions[nextIdx].text);
    }
  }, [currentIndex, questions, answers, sessionId, speech, playQuestion]);

  // ── Skip question ──
  const skipQuestion = useCallback(() => {
    speech.reset();
    const question = questions[currentIndex];

    // Record a blank answer
    const blankRecord: AnswerRecord = {
      questionText: question?.text || "",
      questionType: question?.type || "B",
      transcript: "",
      metrics: {
        wpm: 0,
        wpmHistory: [],
        fillerCount: 0,
        fillerWords: {},
        confidenceScore: 0,
        confidenceHistory: [],
        duration: 0,
      },
      score: null,
    };
    setAnswers((prev) => [...prev, blankRecord]);

    // Move to next
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) {
      const aggregates = computeAggregateScores([...answers, blankRecord]);
      if (sessionId) {
        fetch("/api/simulator/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, ...aggregates }),
        }).catch(() => {});
      }
      setPhase("completed");
    } else {
      setCurrentIndex(nextIdx);
      lastTranscriptRef.current = "";
      playQuestion(questions[nextIdx].text);
    }
  }, [currentIndex, questions, answers, sessionId, speech, playQuestion]);

  // ── Skip TTS (jump to listening) ──
  const skipTTS = useCallback(() => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const isFollowUp =
      phaseRef.current === "follow_up_asking";
    setPhase(isFollowUp ? "follow_up_listening" : "listening");
    speech.start();
  }, [speech]);

  // ── Retry answer ──
  const retryAnswer = useCallback(() => {
    speech.reset();
    lastTranscriptRef.current = "";

    // Remove the last answer
    setAnswers((prev) => prev.slice(0, -1));

    // Re-ask current question
    playQuestion(questions[currentIndex].text);
  }, [speech, questions, currentIndex, playQuestion]);

  // ── End early ──
  const endEarly = useCallback(async () => {
    // Stop audio and mic
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speech.stop();
    clearTimeout(silenceTimerRef.current);

    // Compute and save aggregates
    const aggregates = computeAggregateScores(answers);
    if (sessionId) {
      try {
        await fetch("/api/simulator/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, ...aggregates }),
        });
      } catch {
        // Best-effort
      }
    }

    setPhase("completed");
  }, [speech, answers, sessionId]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return {
    phase,
    sessionId,
    questions,
    currentIndex,
    answers,
    config,
    isLoading,
    error,
    isListening: speech.isListening,
    isSupported: speech.isSupported,
    transcript: speech.transcript,
    metrics: speech.metrics,
    startSession,
    stopListening: handleStopListening,
    nextQuestion,
    skipQuestion,
    retryAnswer,
    endEarly,
    skipTTS,
  };
}
