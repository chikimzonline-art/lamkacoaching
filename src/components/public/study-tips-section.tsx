'use client';

import { useState } from 'react';
import { Lightbulb, Loader2, RefreshCw, Sparkles, Clock, Brain, Target, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StudyTip {
  title: string;
  description: string;
  category: string;
  emoji: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Time Management': <Clock className="h-4 w-4" />,
  'Study Technique': <Brain className="h-4 w-4" />,
  'Exam Strategy': <Target className="h-4 w-4" />,
  'Health & Focus': <Heart className="h-4 w-4" />,
  'Motivation': <Zap className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  'Time Management': 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'Study Technique': 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  'Exam Strategy': 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  'Health & Focus': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  'Motivation': 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
};

const defaultTips: StudyTip[] = [
  {
    title: 'Active Recall Practice',
    description: 'Instead of re-reading notes, close your book and try to recall the key points. This strengthens neural pathways and improves long-term retention significantly.',
    category: 'Study Technique',
    emoji: '🧠',
  },
  {
    title: 'Pomodoro Technique',
    description: 'Study in focused 25-minute blocks followed by 5-minute breaks. After 4 blocks, take a longer 15-30 minute break. This maintains concentration and prevents burnout.',
    category: 'Time Management',
    emoji: '⏰',
  },
  {
    title: 'Mock Test Analysis',
    description: 'After every mock test, spend twice as much time analyzing your mistakes as you spent taking the test. Focus on understanding why you got questions wrong and how to avoid similar errors.',
    category: 'Exam Strategy',
    emoji: '🎯',
  },
];

export default function StudyTipsSection() {
  const [tips, setTips] = useState<StudyTip[]>(defaultTips);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  const topics = [
    { label: 'General', value: '' },
    { label: 'SSC CGL', value: 'SSC CGL exam preparation' },
    { label: 'Banking', value: 'Banking exam preparation IBPS SBI' },
    { label: 'CCC Course', value: 'CCC computer course certification' },
    { label: 'Tally', value: 'Tally Prime accounting software' },
    { label: 'UPSC', value: 'UPSC civil services exam preparation' },
  ];

  const fetchTips = async (topic: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/study-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch tips');
      }

      const data = await res.json();
      if (data && Array.isArray(data.tips) && data.tips.length > 0) {
        setTips(data.tips);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch {
      toast.error('Could not generate tips. Showing default tips.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTips(selectedTopic);
  };

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    fetchTips(topic);
  };

  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-100/30 dark:bg-cyan-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Study Tips
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Smart Study,{' '}
            <span className="text-cyan-600 dark:text-cyan-400">Better Results</span>
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Get personalized study tips powered by AI. Select your exam or course to receive tailored advice.
          </p>
        </div>

        {/* Topic Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {topics.map((topic) => (
            <button
              key={topic.label}
              onClick={() => handleTopicChange(topic.value)}
              disabled={loading}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${selectedTopic === topic.value
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                disabled:opacity-50
              `}
            >
              {topic.label}
            </button>
          ))}
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-white dark:bg-gray-800 animate-pulse"
              >
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
            ))
          ) : (
            tips.map((tip, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Category badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-4 ${categoryColors[tip.category] || 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'}`}>
                  {categoryIcons[tip.category] || <Lightbulb className="h-4 w-4" />}
                  {tip.category}
                </div>

                {/* Title with emoji */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">{tip.emoji}</span>
                  {tip.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {tip.description}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Tips...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Get New Tips
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
