'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, GraduationCap, Megaphone, HelpCircle, X, ArrowRight, Clock, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface CourseResult {
  id: string;
  name: string;
  duration: string | null;
  totalFee: number;
  description: string | null;
  departmentName: string;
}

interface NoticeResult {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

interface FaqResult {
  id: string;
  question: string;
  answer: string;
}

interface SearchResult {
  courses: CourseResult[];
  notices: NoticeResult[];
  faqs: FaqResult[];
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ─────────────────────────────────────────────
   SearchButton Component
   ───────────────────────────────────────────── */
export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-lg h-9 w-9"
      onClick={onClick}
      aria-label="Search"
    >
      <Search className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    </Button>
  );
}

/* ─────────────────────────────────────────────
   GlobalSearch Overlay
   ───────────────────────────────────────────── */
export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchResult>({ courses: [], notices: [], faqs: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const dataFetchedRef = useRef(false);

  // Fetch all data when search opens (only first time)
  useEffect(() => {
    if (open && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      Promise.all([
        fetch('/api/public/courses').then(r => r.json()).catch(() => ({ departments: [] })),
        fetch('/api/public/notices').then(r => r.json()).catch(() => ({ notices: [] })),
        fetch('/api/public/faqs').then(r => r.json()).catch(() => ({ faqs: [] })),
      ]).then(([coursesData, noticesData, faqsData]) => {
        // Flatten courses with department names
        const courses: CourseResult[] = (coursesData.departments || []).flatMap(
          (dept: { name: string; courses: { id: string; name: string; duration: string | null; totalFee: number; description: string | null }[] }) =>
            dept.courses.map(c => ({ ...c, departmentName: dept.name }))
        );
        const notices: NoticeResult[] = (noticesData.notices || []);
        const faqs: FaqResult[] = (faqsData.faqs || []);
        setData({ courses, notices, faqs });
      });
    }
  }, [open]);

  // Focus input when opened + reset state
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset query and selection when search closes
  const handleClose = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setQuery('');
      setSelectedIndex(-1);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleClose(!open);
      }
      if (e.key === 'Escape' && open) {
        handleClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  // Filter results based on query
  const filteredResults = useCallback(() => {
    if (!query.trim()) return { courses: [], notices: [], faqs: [] };

    const q = query.toLowerCase().trim();

    const courses = data.courses.filter(
      c => c.name.toLowerCase().includes(q) ||
           c.departmentName.toLowerCase().includes(q) ||
           (c.description && c.description.toLowerCase().includes(q))
    ).slice(0, 5);

    const notices = data.notices.filter(
      n => n.title.toLowerCase().includes(q) ||
           n.content.toLowerCase().includes(q)
    ).slice(0, 3);

    const faqs = data.faqs.filter(
      f => f.question.toLowerCase().includes(q) ||
           f.answer.toLowerCase().includes(q)
    ).slice(0, 3);

    return { courses, notices, faqs };
  }, [query, data]);

  const results = filteredResults();
  const totalResults = results.courses.length + results.notices.length + results.faqs.length;

  // Build flat list for keyboard navigation
  const flatResults = [
    ...results.courses.map(c => ({ type: 'course' as const, id: c.id, data: c })),
    ...results.notices.map(n => ({ type: 'notice' as const, id: n.id, data: n })),
    ...results.faqs.map(f => ({ type: 'faq' as const, id: f.id, data: f })),
  ];

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < flatResults.length) {
      e.preventDefault();
      const item = flatResults[selectedIndex];
      if (item.type === 'course') {
        window.location.href = `/register?courseId=${item.id}`;
      } else if (item.type === 'notice') {
        window.location.href = '/notices';
      } else if (item.type === 'faq') {
        // Just close — FAQ is inline
        handleClose(false);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
          >
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search courses, notices, FAQs..."
                  className="flex-1 text-lg bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                />
                {query && (
                  <button
                    onClick={() => { setQuery(''); setSelectedIndex(-1); inputRef.current?.focus(); }}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
                {!query.trim() && (
                  <div className="px-5 py-12 text-center">
                    <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Type to search across courses, notices, and FAQs</p>
                    <p className="text-gray-300 dark:text-gray-600 text-xs mt-2">
                      Press <kbd className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">Ctrl+K</kbd> anytime to open search
                    </p>
                  </div>
                )}

                {query.trim() && loading && (
                  <div className="px-5 py-8 text-center">
                    <div className="h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Searching...</p>
                  </div>
                )}

                {query.trim() && !loading && totalResults === 0 && (
                  <div className="px-5 py-12 text-center">
                    <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No results found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different search term</p>
                  </div>
                )}

                {query.trim() && !loading && totalResults > 0 && (
                  <div className="py-2">
                    {/* Courses */}
                    {results.courses.length > 0 && (
                      <div className="mb-1">
                        <div className="px-5 py-2 flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 text-cyan-500" />
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Courses</span>
                        </div>
                        {results.courses.map((course, i) => {
                          const flatIndex = i;
                          return (
                            <a
                              key={course.id}
                              href={`/register?courseId=${course.id}`}
                              data-index={flatIndex}
                              className={`flex items-center gap-3 px-5 py-3 mx-2 rounded-lg transition-colors cursor-pointer ${
                                selectedIndex === flatIndex
                                  ? 'bg-cyan-50 dark:bg-cyan-950/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                              }`}
                            >
                              <div className="h-9 w-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                                <GraduationCap className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{course.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{course.departmentName}</span>
                                  {course.duration && (
                                    <>
                                      <span className="text-gray-300 dark:text-gray-600">·</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                                        <Clock className="h-3 w-3" />{course.duration}
                                      </span>
                                    </>
                                  )}
                                  <span className="text-gray-300 dark:text-gray-600">·</span>
                                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">{formatINR(course.totalFee)}</span>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {/* Notices */}
                    {results.notices.length > 0 && (
                      <div className="mb-1">
                        <div className="px-5 py-2 flex items-center gap-2">
                          <Megaphone className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notices</span>
                        </div>
                        {results.notices.map((notice, i) => {
                          const flatIndex = results.courses.length + i;
                          return (
                            <a
                              key={notice.id}
                              href="/notices"
                              data-index={flatIndex}
                              className={`flex items-center gap-3 px-5 py-3 mx-2 rounded-lg transition-colors cursor-pointer ${
                                selectedIndex === flatIndex
                                  ? 'bg-cyan-50 dark:bg-cyan-950/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                              }`}
                            >
                              <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{notice.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{notice.content.slice(0, 80)}...</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {/* FAQs */}
                    {results.faqs.length > 0 && (
                      <div className="mb-1">
                        <div className="px-5 py-2 flex items-center gap-2">
                          <HelpCircle className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">FAQs</span>
                        </div>
                        {results.faqs.map((faq, i) => {
                          const flatIndex = results.courses.length + results.notices.length + i;
                          return (
                            <button
                              key={faq.id}
                              data-index={flatIndex}
                              onClick={() => handleClose(false)}
                              className={`flex items-center gap-3 px-5 py-3 mx-2 rounded-lg transition-colors cursor-pointer w-full text-left ${
                                selectedIndex === flatIndex
                                  ? 'bg-cyan-50 dark:bg-cyan-950/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                              }`}
                            >
                              <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{faq.question}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{faq.answer.slice(0, 80)}...</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              {query.trim() && totalResults > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px]">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px]">esc</kbd>
                    Close
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
