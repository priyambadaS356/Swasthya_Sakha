import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, Square, FileText, CalendarDays, Languages, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import Badge from '../components/Badge';
import { appointments } from '../data';
import { SymptomSelector, TriageCard, QUICK_SYMPTOMS } from '../components/EmergencyTriage';
import { saveOfflineRecord } from '../utils/indexedDB';
import { api } from '../api';

export default function PatientDashboard({ subpage }) {
  const [lang, setLang] = useState('en-IN');
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [tab, setTab] = useState(subpage || 'overview');

  const recognitionRef = useRef(null);

  // Triage & Translation state
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => { 
    setTab(subpage || 'overview'); 
  }, [subpage]);

  const stopSpeech = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Speech stop warning:', err);
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleLanguageChange = async (targetLang) => {
    if (listening) stopSpeech();

    const sourceCode = lang.split('-')[0];
    const targetCode = targetLang.split('-')[0];

    setLang(targetLang);

    if (text.trim() && sourceCode !== targetCode) {
      setIsTranslating(true);
      setStatusMsg('Translating text...');
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`
        );
        const data = await res.json();
        if (data?.responseData?.translatedText) {
          setText(data.responseData.translatedText);
          setStatusMsg('');
        }
      } catch (err) {
        console.error('Translation error:', err);
        setStatusMsg('Translation server unavailable. You can edit text directly.');
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const toggleSymptom = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const resetSymptoms = () => setSelectedSymptoms([]);

  const totalScore = selectedSymptoms.reduce((sum, id) => {
    const item = (QUICK_SYMPTOMS || []).find((s) => s.id === id);
    return sum + (item ? item.score : 0);
  }, 0);

  // Universal Safe API Execution
  const executeApiPost = async (endpoint, payload) => {
    if (typeof api === 'function') {
      return await api(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else if (api && typeof api.post === 'function') {
      return await api.post(endpoint, payload);
    }
    throw new Error('API client method not initialized.');
  };

  const handleSubmitTriage = async () => {
    if (!text.trim() && selectedSymptoms.length === 0) {
      setStatusMsg('Please select symptoms or speak/type before submitting.');
      return;
    }

    setSubmitting(true);
    setStatusMsg('');

    const endpoint = '/triage/submit';
    const payload = {
      symptomsText: text,
      selectedSymptoms,
      totalScore,
      language: lang,
      submittedAt: new Date().toISOString()
    };

    // Case 1: Browser Offline
    if (!navigator.onLine) {
      try {
        await saveOfflineRecord(endpoint, payload);
        setStatusMsg('⚠️ Device offline hai. Data IndexedDB mein save ho gaya hai, network aate hi sync ho jayega!');
        setText('');
        setSelectedSymptoms([]);
      } catch (err) {
        console.error('Offline save error:', err);
        setStatusMsg('❌ Failed to save offline record.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Case 2: Browser Online
    try {
      await executeApiPost(endpoint, payload);
      setStatusMsg('✅ Triage recorded successfully on server!');
      setText('');
      setSelectedSymptoms([]);
    } catch (err) {
      console.error('Submission error:', err);
      const isNetworkIssue = !navigator.onLine || err?.message?.includes('Failed to fetch');

      if (isNetworkIssue) {
        await saveOfflineRecord(endpoint, payload);
        setStatusMsg('⚠️ Connection lost. Data offline queue mein save kar diya gaya!');
        setText('');
        setSelectedSymptoms([]);
      } else {
        setStatusMsg(`❌ Server Error: ${err?.message || '500 Internal Server Error'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMsg('Speech recognition requires Chrome, Edge, or Safari.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
      const langLabel = lang === 'hi-IN' ? 'Hindi' : lang === 'mr-IN' ? 'Marathi' : 'English';
      setStatusMsg(`🎙️ Listening in ${langLabel}... Speak now.`);
    };

    recognition.onresult = (event) => {
      let liveTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        liveTranscript += event.results[i][0].transcript;
      }
      setText(liveTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setListening(false);
      if (event.error === 'not-allowed') {
        setStatusMsg('❌ Microphone access denied. Please allow microphone in browser settings.');
      } else if (event.error === 'no-speech') {
        setStatusMsg('⚠️ No speech detected. Try speaking closer to mic.');
      } else {
        setStatusMsg(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Speech start exception:', err);
      setStatusMsg('Failed to initialize microphone.');
    }
  };

  if (tab === 'history') {
    return (
      <div className="space-y-5">
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-5">
            <SectionHeader title="Medical Timeline" sub="Recent encounters and prescriptions" />
            <div className="space-y-4">
              {[
                '12 Aug 2026 — District Hospital · Follow-up',
                '28 Jul 2026 — PHC Andheri · Consultation',
                '11 Jun 2026 — Diagnostics · CBC + Hb'
              ].map((entry) => (
                <div key={entry} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-teal-600 mt-2 shrink-0" />
                  <div>
                    <b className="text-sm">{entry}</b>
                    <p className="text-xs text-muted mt-1">
                      Clinical notes, reports, and e-prescriptions accessible to authorized care team.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <SectionHeader title="Documents" />
            <div className="space-y-2">
              {['Lab report · CBC', 'Prescription · 12 Aug', 'Referral · Cardiology'].map((doc) => (
                <div key={doc} className="border rounded-xl p-3 flex items-center gap-3">
                  <FileText size={17} className="text-teal-700" />
                  <span className="text-sm">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'appointments') {
    return (
      <div className="card p-5">
        <SectionHeader title="Your Care Schedule" sub="Appointments, referrals, and follow-up actions" />
        <div className="space-y-3">
          {(appointments || []).slice(0, 3).map((a) => (
            <div key={a.id || a.time} className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <b>{a.time} · {a.doctor}</b>
                <p className="text-xs text-muted mt-1">{a.reason}</p>
              </div>
              <Badge tone={a.status === 'Waiting' ? 'amber' : 'green'}>{a.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label="Next appointment" value="10:30 AM" sub="Dr. Meera Shah · 12 Sep" icon={CalendarDays} />
        <StatCard label="Medical records" value="12" sub="Last updated 12 Aug" icon={FileText} tone="blue" />
        <StatCard label="Follow-up" value="Due in 8 days" sub="Cardiology referral" icon={CheckCircle2} tone="amber" />
      </div>

      <SymptomSelector 
        selectedSymptoms={selectedSymptoms} 
        toggleSymptom={toggleSymptom} 
        resetSymptoms={resetSymptoms} 
      />

      <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-5">
        <div className="card p-5">
          <SectionHeader title="Multilingual symptom intake" sub="Speak or type in Marathi, Hindi, or English. Live speech-to-text supported." />

          <div className="flex gap-2 mb-4 items-center flex-wrap">
            {[
              ['en-IN', 'English'],
              ['hi-IN', 'हिन्दी'],
              ['mr-IN', 'मराठी']
            ].map(([val, label]) => (
              <button 
                key={val} 
                onClick={() => handleLanguageChange(val)} 
                disabled={isTranslating}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  lang === val ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Languages size={14} className="inline mr-1" />
                {label}
              </button>
            ))}
            {isTranslating && (
              <span className="text-xs text-teal-600 font-medium flex items-center gap-1 ml-2">
                <Loader2 size={13} className="animate-spin" /> Translating...
              </span>
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isTranslating}
            placeholder="Type your symptoms here or tap the microphone below to speak..."
            className="w-full min-h-40 bg-slate-50 border rounded-2xl p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-y disabled:opacity-60"
          />

          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="flex justify-center">
              {listening ? (
                <button 
                  onClick={stopSpeech} 
                  className="w-14 h-14 rounded-full bg-rose-500 text-white grid place-items-center shadow-lg animate-pulse"
                  aria-label="Stop recording"
                >
                  <Square size={19} />
                </button>
              ) : (
                <button 
                  onClick={startSpeech} 
                  className="w-14 h-14 rounded-full bg-teal-700 hover:bg-teal-800 text-white grid place-items-center shadow-lg transition-all"
                  aria-label="Start voice input"
                >
                  <Mic size={23} />
                </button>
              )}
            </div>

            <p className="text-center text-[11px] font-medium text-slate-600">
              {listening ? 'Listening... Speak now' : 'Tap the microphone to speak'}
            </p>

            <button
              onClick={handleSubmitTriage}
              disabled={submitting || isTranslating}
              className="w-full mt-2 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Symptoms & Triage'}
            </button>

            {statusMsg && (
              <p className="text-xs text-center font-medium text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 flex items-center gap-1 justify-center">
                <AlertCircle size={14} /> {statusMsg}
              </p>
            )}
          </div>
        </div>

        <TriageCard totalScore={totalScore} selectedSymptoms={selectedSymptoms} />
      </div>
    </div>
  );
}