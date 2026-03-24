import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { settingsApi } from '../services/api';
import { Settings as SettingsType } from '../types';
import { getApiError } from '../lib/utils';

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful document assistant. Answer questions based ONLY on the provided document content.\nIf the answer cannot be found in the provided context, respond with: "Sorry, I couldn\'t find that information in the document."';

export function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsApi
      .get()
      .then(s => {
        setSettings(s);
        if (s.model) setModel(s.model);
        if (s.systemPrompt) setSystemPrompt(s.systemPrompt);
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await settingsApi.update({
        apiKey: apiKey || undefined,
        model,
        systemPrompt,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Reload to show masked key
      const updated = await settingsApi.get();
      setSettings(updated);
      setApiKey('');
    } catch (err) {
      setError(getApiError(err, 'Failed to save settings.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to defaults?')) return;
    setIsResetting(true);
    try {
      await settingsApi.reset();
      setApiKey('');
      setModel('gpt-4o-mini');
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setSettings(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(getApiError(err, 'Failed to reset settings.'));
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <Loader2 size={24} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] p-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <div className="h-4 w-px bg-[#2a2a2a]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-white font-semibold">Settings</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
            <CheckCircle2 size={15} />
            Settings saved successfully
          </div>
        )}

        <div className="space-y-5">
          {/* API Key */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-1">OpenAI API Key</h2>
            <p className="text-gray-500 text-xs mb-4">
              Your API key is stored locally and used for document processing and chat.
              {settings?.hasApiKey && (
                <span className="ml-1 text-green-400">✓ Key configured ({settings.apiKey})</span>
              )}
            </p>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={settings?.hasApiKey ? 'Enter new key to replace existing…' : 'sk-...'}
                className="w-full bg-[#111111] border border-[#2a2a2a] text-white placeholder-gray-600 text-sm rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-orange-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-1">Language Model</h2>
            <p className="text-gray-500 text-xs mb-4">Choose which OpenAI model to use for answers.</p>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full bg-[#111111] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
            >
              {MODEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-1">System Prompt</h2>
            <p className="text-gray-500 text-xs mb-4">
              Customize how the AI assistant behaves when answering questions.
            </p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={5}
              className="w-full bg-[#111111] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 transition-colors resize-none scrollbar-thin"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save settings
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-gray-400 hover:text-white font-medium text-sm rounded-lg px-4 py-2.5 transition-colors"
            >
              {isResetting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RotateCcw size={15} />
              )}
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
