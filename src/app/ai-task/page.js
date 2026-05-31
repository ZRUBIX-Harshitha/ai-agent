'use client';

import { useState, useEffect, useRef } from 'react';

const VOICES = [
  { id: 'whatsapp', name: 'WhatsApp Business' },
  { id: 'virtual', name: 'Offline Virtual AI (Free Browser)' },
];

export default function AITaskPage() {
  const [task, setTask] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('917010156378');
  const [voice, setVoice] = useState('whatsapp');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const tasksRef = useRef([]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(async () => {
      // Ping the cron API to process any due tasks, then refresh the list
      try {
        await fetch('/api/cron');
      } catch (e) {
        console.error('Failed to trigger cron:', e);
      }
      fetchTasks();
      checkVirtualAlarms();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
        setScheduledTasks(sorted);
        tasksRef.current = sorted;
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/cron');
    } catch (e) {
      console.error('Failed to trigger cron:', e);
    }
    await fetchTasks();
    setIsRefreshing(false);
  };

  const checkVirtualAlarms = () => {
    const now = new Date();
    tasksRef.current.forEach(t => {
      const tTime = new Date(t.scheduledTime);
      if (t.voice === 'virtual' && t.status === 'pending' && tTime <= now) {
        triggerVirtualCall(t);
      }
    });
  };

  const triggerVirtualCall = (t) => {
    updateTaskStatus(t.id, 'calling');
    if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    const utterance = new SpeechSynthesisUtterance(`Hello! This is your AI Reminder. Task: ${t.message}`);
    utterance.onend = () => updateTaskStatus(t.id, 'completed');
    alert(`📢 ALERT: ${t.message}`);
    window.speechSynthesis.speak(utterance);
  };

  const testVirtualCall = () => {
    triggerVirtualCall({ message: "Test reminder working!", id: 'test', voice: 'virtual' });
  };

  const updateTaskStatus = async (id, status) => {
    if (id === 'test') return;
    try {
      await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const scheduledTime = new Date(`${date}T${time}`).toISOString();

    try {
      const res = await fetch('/api/schedule-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: task,
          phone: voice === 'whatsapp' ? whatsappPhone : null,
          scheduledTime,
          voice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Task scheduled successfully!', type: 'success' });
        setTask(''); setDate(''); setTime('');
        fetchTasks();
      } else {
        setMessage({ text: data.error || 'Failed to schedule.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchTasks();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-400/10';
      case 'calling': return 'text-blue-400 bg-blue-400/10 animate-pulse';
      case 'completed': return 'text-emerald-400 bg-emerald-400/10';
      case 'failed': return 'text-rose-400 bg-rose-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center py-12 px-6 space-y-12 [color-scheme:dark]">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
          AI Multi-Reminder
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Automated Text reminders on WhatsApp Business.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Left Column: Form */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-900/20 relative overflow-hidden h-fit group/form">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full group-hover/form:bg-indigo-500/30 transition-all duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full group-hover/form:bg-purple-500/30 transition-all duration-700"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label htmlFor="task" className="text-sm font-semibold text-slate-300 ml-1">Task Description</label>
              <input
                id="task"
                type="text"
                required
                placeholder="Finish the project..."
                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 hover:border-slate-600 transition-all placeholder:text-slate-500 text-lg shadow-inner"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="date" className="text-sm font-semibold text-slate-300 ml-1">Date</label>
                <input
                  id="date"
                  type="date"
                  required
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 hover:border-slate-600 transition-all text-slate-200 shadow-inner [color-scheme:dark]"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="time" className="text-sm font-semibold text-slate-300 ml-1">Time</label>
                <input
                  id="time"
                  type="time"
                  required
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 hover:border-slate-600 transition-all text-slate-200 shadow-inner [color-scheme:dark]"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {voice === 'whatsapp' && (
                <div className="space-y-3">
                  <label htmlFor="whatsapp-phone" className="text-sm font-semibold text-slate-300 ml-1">
                    WhatsApp Phone Number
                  </label>
                  <input id="whatsapp-phone" type="password" required placeholder="Phone (e.g. 91987...)" className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-slate-600 transition-all text-sm tracking-widest font-mono shadow-inner" value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} />
                </div>
              )}

              {voice === 'virtual' && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Offline Mode</label>
                  <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-6 py-4 text-slate-400 text-sm flex items-center shadow-inner">
                    <span className="mr-2">🔊</span> Browser speaker will be used.
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label htmlFor="voice-select" className="text-sm font-semibold text-slate-300 ml-1">Remind Via</label>
                <select
                  id="voice-select"
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 hover:border-slate-600 transition-all text-slate-200 appearance-none cursor-pointer shadow-inner"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                >
                  {VOICES.map(v => <option key={v.id} value={v.id} className="bg-[#1e293b]">{v.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="submit"
                disabled={loading || (voice === 'whatsapp' && !whatsappPhone)}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-900/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-wider relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative z-10">{loading ? 'Processing...' : 'Schedule Reminder'}</span>
              </button>

              <button
                type="button"
                onClick={testVirtualCall}
                className="w-full bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 hover:border-slate-500 hover:bg-slate-700/50 text-slate-300 font-bold py-5 rounded-2xl transition-all duration-300 uppercase tracking-wider text-xs flex items-center justify-center gap-2 group/test"
              >
                <span className="group-hover/test:scale-125 transition-transform duration-300">🔊</span> Test AI Speaker
              </button>
            </div>
          </form>

          {message.text && (
            <div className={`mt-8 p-5 rounded-2xl text-center text-sm font-bold border backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
              }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Right Column: Task List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-bold text-slate-200">Upcoming Tasks</h2>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-slate-400 hover:text-white transition-all disabled:opacity-50"
                title="Refresh Tasks"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? "animate-spin text-blue-400" : ""}>
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Live updates
              </span>
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {scheduledTasks.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl opacity-50">📅</span>
                </div>
                <p className="text-slate-400">No tasks scheduled yet.</p>
              </div>
            ) : (
              scheduledTasks.map((t) => (
                <div key={t.id} className="group bg-slate-900/40 backdrop-blur-md hover:bg-slate-800/60 border border-slate-800 hover:border-slate-600 rounded-3xl p-7 transition-all duration-300 relative hover:shadow-xl hover:shadow-indigo-500/10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-slate-100 leading-snug pr-8">{t.message}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
                        <span className="flex items-center bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="mr-2 text-indigo-400">🕒</span>
                          {new Date(t.scheduledTime).toLocaleString()}
                        </span>
                        <span className="flex items-center bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="mr-2 text-emerald-400">👤</span>
                          {VOICES.find(v => v.id === t.voice)?.name || 'Standard'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="opacity-0 group-hover:opacity-100 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white p-2.5 rounded-xl transition-all duration-300 absolute top-6 right-6"
                      aria-label="Delete task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    </button>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-5 border-t border-slate-800">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(t.status)}`}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {t.id.split('-')[0]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SEO & Voice Search Optimization Section */}
      <section className="w-full max-w-6xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl relative z-10">
        <h2 className="text-3xl font-black tracking-tight text-slate-100 mb-8">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-emerald-400">What is AI Multi-Reminder?</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              AI Multi-Reminder is an automated task management tool that sends you text reminders via WhatsApp Business and plays offline voice alerts directly through your browser.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-emerald-400">How do I schedule a WhatsApp reminder?</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              To schedule a WhatsApp reminder, simply enter your task description, select the date and time, input your WhatsApp phone number, and click 'Schedule Reminder'.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-emerald-400">Where can I receive my offline voice alerts?</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Offline voice alerts are played securely right within your web browser. Just keep the tab open, and the AI will speak your reminder aloud when the time comes.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-emerald-400">When should I use this AI assistant?</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Use this AI assistant whenever you need reliable, automated follow-ups for your business or personal tasks without manually checking the clock.
            </p>
          </div>
        </div>
      </section>

      {/* JSON-LD Schema for Voice Search and SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is AI Multi-Reminder?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "AI Multi-Reminder is an automated task management tool that sends you text reminders via WhatsApp Business and plays offline voice alerts directly through your browser."
                }
              },
              {
                "@type": "Question",
                "name": "How do I schedule a WhatsApp reminder?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "To schedule a WhatsApp reminder, simply enter your task description, select the date and time, input your WhatsApp phone number, and click 'Schedule Reminder'."
                }
              },
              {
                "@type": "Question",
                "name": "Where can I receive my offline voice alerts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Offline voice alerts are played securely right within your web browser. Just keep the tab open, and the AI will speak your reminder aloud when the time comes."
                }
              },
              {
                "@type": "Question",
                "name": "When should I use this AI assistant?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use this AI assistant whenever you need reliable, automated follow-ups for your business or personal tasks without manually checking the clock."
                }
              }
            ]
          })
        }}
      />
    </main>
  );
}
