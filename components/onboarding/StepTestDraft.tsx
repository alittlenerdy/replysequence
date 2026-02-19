'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Check, Mail, User, Clock, ArrowRight } from 'lucide-react';

interface StepTestDraftProps {
  draftGenerated: boolean;
  onDraftGenerated: () => void;
}

const SAMPLE_MEETING = {
  topic: 'Q1 Partnership Discussion',
  attendees: ['You', 'Sarah Chen (Acme Corp)'],
  date: 'Today at 2:00 PM',
  transcript: `Sarah: Thanks for taking the time to meet today. I think there's a lot of potential here for a partnership.

You: Absolutely, I've been looking forward to this. Your product would be a great fit for our customers.

Sarah: Great! So, we should schedule a follow-up for next Tuesday to review the contract details. Does that work for you?

You: Sounds perfect. I'll send over the updated proposal by Friday so you have time to review before our call.

Sarah: That would be great. Looking forward to it!`,
};

const SAMPLE_DRAFT = {
  subject: 'Following up on Q1 Partnership Discussion',
  body: `Hi Sarah,

Great connecting today! I really enjoyed our conversation about the partnership opportunity.

As discussed, I'll send over the updated proposal by Friday so you have time to review it before our follow-up call.

I've also added our meeting to the calendar for next Tuesday to review the contract details.

Looking forward to moving this partnership forward!

Best regards`,
};

export function StepTestDraft({
  draftGenerated,
  onDraftGenerated,
}: StepTestDraftProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDraft, setShowDraft] = useState(draftGenerated);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showContinue, setShowContinue] = useState(draftGenerated);

  // Countdown effect after draft is shown
  useEffect(() => {
    if (showDraft && countdown === null && !showContinue) {
      setCountdown(3);
    }
  }, [showDraft, countdown, showContinue]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setShowContinue(true);
    }
  }, [countdown]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const startTime = Date.now();

    try {
      // Call the actual API to generate a sample draft
      const res = await fetch('/api/onboarding/generate-sample-draft', {
        method: 'POST',
      });

      if (res.ok) {
        const endTime = Date.now();
        setGenerationTime((endTime - startTime) / 1000);
        setShowDraft(true);
        // Don't auto-advance - wait for user to click Continue
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      // Fallback to demo mode
      setTimeout(() => {
        const endTime = Date.now();
        setGenerationTime((endTime - startTime) / 1000);
        setShowDraft(true);
        // Don't auto-advance - wait for user to click Continue
      }, 1500);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    onDraftGenerated();
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          See it in action
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-lg mx-auto"
        >
          Watch how ReplySequence generates a follow-up email from a meeting transcript
        </motion.p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sample Meeting */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
                Sample Meeting
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Topic:</span>
                <span className="text-white font-medium">{SAMPLE_MEETING.topic}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Attendees:</span>
                <span className="text-white">{SAMPLE_MEETING.attendees.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">{SAMPLE_MEETING.date}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Transcript</p>
                <div className="text-sm text-gray-300 whitespace-pre-line bg-gray-800/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {SAMPLE_MEETING.transcript}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Generated Draft */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-gray-900/50 border rounded-2xl overflow-hidden transition-all duration-300 ${
              showDraft ? 'border-indigo-500/50' : 'border-gray-700'
            }`}
          >
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  showDraft ? 'bg-indigo-500/20' : 'bg-indigo-500/20'
                }`}>
                  <Mail className={`w-4 h-4 ${showDraft ? 'text-indigo-400' : 'text-indigo-400'}`} />
                </div>
                Generated Draft
                {showDraft && generationTime && (
                  <span className="ml-auto text-xs text-indigo-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Generated in {generationTime.toFixed(1)}s
                  </span>
                )}
              </h3>
            </div>
            <div className="p-4">
              <AnimatePresence mode="wait">
                {!showDraft && !isGenerating && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <Mail className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-500 mb-6">Click the button below to generate</p>
                    <button
                      onClick={handleGenerate}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-500/25"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate Draft Email
                    </button>
                  </motion.div>
                )}

                {isGenerating && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full" />
                      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="mt-4 text-indigo-400 font-medium">Generating your draft...</p>
                    <p className="text-sm text-gray-500 mt-1">AI is analyzing the transcript</p>
                  </motion.div>
                )}

                {showDraft && (
                  <motion.div
                    key="draft"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Subject:</span>
                      <span className="text-white font-medium">{SAMPLE_DRAFT.subject}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="text-sm text-gray-300 whitespace-pre-line bg-gray-800/50 rounded-lg p-3">
                        {SAMPLE_DRAFT.body}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-400">Ready to send!</span>
                      </div>

                      {/* Countdown and Continue button */}
                      <AnimatePresence mode="wait">
                        {countdown !== null && countdown > 0 && (
                          <motion.div
                            key="countdown"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 text-gray-400"
                          >
                            <span className="text-sm">Review your draft...</span>
                            <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium">
                              {countdown}
                            </span>
                          </motion.div>
                        )}

                        {showContinue && (
                          <motion.button
                            key="continue"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleContinue}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-500/25"
                          >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
