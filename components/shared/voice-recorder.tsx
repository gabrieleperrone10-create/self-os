'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Check, X } from 'lucide-react';

type RecorderState = 'idle' | 'requesting' | 'recording' | 'confirming';

interface Props {
  onConfirm: (transcript: string) => void;
  onCancel?: () => void;
  maxSeconds?: number;
  label?: string;
}

// Detect iOS (Safari doesn't support Web Speech API)
function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

// Detect if we're on mobile (any mobile browser)
function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Web Speech API needs a secure context on mobile (HTTPS or localhost)
function isSecureContext() {
  return typeof window !== 'undefined' && (window.isSecureContext ?? (location.protocol === 'https:' || location.hostname === 'localhost'));
}

export function VoiceRecorder({ onConfirm, onCancel, maxSeconds = 60, label }: Props) {
  const [state, setState] = useState<RecorderState>('idle');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<'yes' | 'no-ios' | 'no-https' | 'no-api'>('yes');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mobile = useRef(false);

  useEffect(() => {
    mobile.current = isMobile();

    if (isIOS()) {
      setSupported('no-ios');
      return;
    }

    if (isMobile() && !isSecureContext()) {
      setSupported('no-https');
      return;
    }

    const SR = (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
      ?? window.SpeechRecognition;
    if (!SR) setSupported('no-api');
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setState(prev => prev === 'recording' ? 'confirming' : prev);
  }, []);

  function startRecording() {
    setError(null);
    setFinalTranscript('');
    setInterimTranscript('');
    setSecondsLeft(maxSeconds);
    setState('requesting');

    const SR = (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
      ?? window.SpeechRecognition;

    if (!SR) {
      setError('Web Speech API non supportata. Usa Chrome su Android.');
      setState('idle');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'it-IT';
    // On mobile, continuous mode causes issues — use single-shot mode
    recognition.continuous = !mobile.current;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('recording');
      timerRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            stopRecording();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fin = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          fin += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setFinalTranscript(fin);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setError('Accesso al microfono negato. Controlla le impostazioni del browser.');
      } else if (event.error === 'network') {
        setError('Errore di rete. Verifica la connessione.');
      } else if (event.error !== 'aborted') {
        setError(`Errore: ${event.error}`);
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setState('idle');
    };

    // On mobile, speech recognition ends automatically after silence
    // Move to confirming state instead of resetting
    recognition.onend = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setState(prev => prev === 'recording' ? 'confirming' : prev);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function handleConfirm() {
    const text = (finalTranscript + ' ' + interimTranscript).trim();
    if (text.length < 5) {
      setError('Troppo breve. Riprova.');
      setState('idle');
      return;
    }
    onConfirm(text);
  }

  function handleCancel() {
    recognitionRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setState('idle');
    setFinalTranscript('');
    setInterimTranscript('');
    onCancel?.();
  }

  // iOS Safari — non supported
  if (supported === 'no-ios') {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
        Il microfono non è disponibile su Safari/iOS.{' '}
        <span style={{ color: 'var(--text-secondary)' }}>Usa il testo qui sopra.</span>
      </p>
    );
  }

  // Mobile non-HTTPS
  if (supported === 'no-https') {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
        Il microfono richiede HTTPS su mobile.{' '}
        <span style={{ color: 'var(--text-secondary)' }}>Usa il testo qui sopra.</span>
      </p>
    );
  }

  // No API support
  if (supported === 'no-api') {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Microfono non supportato. Usa Chrome su Android o desktop.
      </p>
    );
  }

  const displayText = (finalTranscript + interimTranscript).trim();
  const isRecording = state === 'recording';
  const btnSize = mobile.current ? 56 : 48;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {label && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          {label}
        </p>
      )}

      {/* Idle / Requesting */}
      {(state === 'idle' || state === 'requesting') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={startRecording}
            disabled={state === 'requesting'}
            style={micButtonStyle(false, btnSize)}
            aria-label="Avvia registrazione"
          >
            <Mic size={22} strokeWidth={1.5} />
          </button>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>
              {state === 'requesting' ? 'Attendendo permesso...' : 'Parla invece di scrivere'}
            </p>
            {mobile.current && state === 'idle' && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Parla, poi smetti — il microfono si ferma automaticamente
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recording */}
      {isRecording && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={stopRecording}
              style={micButtonStyle(true, btnSize)}
              aria-label="Ferma registrazione"
            >
              <MicOff size={22} strokeWidth={1.5} />
            </button>
            <Waveform />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '2.5rem' }}>
              {secondsLeft}s
            </span>
          </div>

          {displayText && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(201,169,110,0.05)',
              border: '1px solid rgba(201,169,110,0.15)',
              borderRadius: '3px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.6,
              minHeight: '3rem',
            }}>
              {finalTranscript}
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {interimTranscript}
              </span>
            </div>
          )}

          {mobile.current && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Smetti di parlare per confermare — oppure tocca il microfono per fermarti
            </p>
          )}
        </div>
      )}

      {/* Confirming */}
      {state === 'confirming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            Trascrizione — conferma prima di analizzare
          </p>

          <div style={{
            padding: '1rem 1.25rem',
            background: 'var(--surface)',
            border: '1px solid var(--gold)',
            borderRadius: '3px',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            fontFamily: 'Georgia, serif',
            lineHeight: 1.7,
          }}>
            {displayText || 'Nessun testo rilevato.'}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleConfirm} style={actionBtn('confirm', mobile.current)} disabled={!displayText}>
              <Check size={15} />
              Conferma
            </button>
            <button onClick={handleCancel} style={actionBtn('cancel', mobile.current)}>
              <X size={15} />
              Riprova
            </button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '0.8rem', color: '#B45454', lineHeight: 1.4 }}>{error}</p>
      )}
    </div>
  );
}

function Waveform() {
  const bars = [3, 7, 5, 9, 4, 8, 3, 6, 4, 7, 3];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '24px', flex: 1 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            borderRadius: '2px',
            backgroundColor: 'var(--gold)',
            animationName: 'voiceWave',
            animationDuration: `${0.4 + (i % 4) * 0.1}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${(i * 0.07).toFixed(2)}s`,
            height: `${h}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes voiceWave {
          from { transform: scaleY(1); }
          to   { transform: scaleY(2.5); }
        }
      `}</style>
    </div>
  );
}

function micButtonStyle(active: boolean, size: number): React.CSSProperties {
  return {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    background: active ? 'rgba(201,169,110,0.12)' : 'transparent',
    color: active ? 'var(--gold)' : 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.3s ease',
    boxShadow: active ? '0 0 0 6px rgba(201,169,110,0.1), 0 0 0 12px rgba(201,169,110,0.05)' : 'none',
    animation: active ? 'micPulse 1.5s ease-in-out infinite' : 'none',
  };
}

function actionBtn(type: 'confirm' | 'cancel', mobile: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    padding: mobile ? '0.75rem 1.25rem' : '0.5rem 1rem',
    flex: mobile ? 1 : undefined,
    background: 'transparent',
    border: `1px solid ${type === 'confirm' ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: '3px',
    color: type === 'confirm' ? 'var(--gold)' : 'var(--text-muted)',
    fontFamily: 'Georgia, serif',
    fontSize: '0.85rem',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    transition: 'all 0.3s ease',
    minHeight: '44px',
  };
}
