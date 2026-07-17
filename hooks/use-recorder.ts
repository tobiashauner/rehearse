"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording";

export type Recording = {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
};

// First supported entry wins: opus/webm on Chrome & Firefox, mp4 on Safari.
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

/**
 * Microphone capture for spoken answers: MediaRecorder for the audio blob,
 * plus an AnalyserNode (exposed for waveform visualization) and a 1Hz elapsed
 * counter. All resources (stream, audio context, timers) are torn down on
 * stop/cancel/unmount.
 */
export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const teardown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    recorderRef.current = null;
    setAnalyser(null);
    setStatus("idle");
  }, []);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    setError(null);
    setStatus("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("idle");
      setError(
        "Microphone access was blocked. Allow it in your browser, or type your answer instead.",
      );
      return;
    }
    streamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    audioContext.createMediaStreamSource(stream).connect(analyserNode);
    setAnalyser(analyserNode);

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(
      () => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)),
      1000,
    );
    setStatus("recording");
  }, []);

  const stop = useCallback((): Promise<Recording | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      teardown();
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );
        teardown();
        resolve(blob.size > 0 ? { blob, mimeType, durationSeconds } : null);
      };
      recorder.stop();
    });
  }, [teardown]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    teardown();
  }, [teardown]);

  return { status, elapsed, analyser, error, start, stop, cancel };
}
