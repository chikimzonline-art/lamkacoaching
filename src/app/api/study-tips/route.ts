import { NextRequest, NextResponse } from 'next/server';
import { callGeminiAPI, extractTextFromResponse } from '@/lib/gemini';

const STUDY_TIPS_PROMPT = `You are an expert academic advisor and study coach for students preparing for competitive exams in India (SSC, Banking, UPSC, State PSC) and computer certification courses (CCC, Tally, Web Design). 

Generate exactly 3 practical, actionable study tips in JSON format. Each tip should have:
- "title": A short catchy title (max 8 words)
- "description": A detailed tip (2-3 sentences) with specific, actionable advice
- "category": One of: "Time Management", "Study Technique", "Exam Strategy", "Health & Focus", "Motivation"
- "emoji": A relevant single emoji

Make the tips diverse - cover different categories. Be specific and practical. Avoid generic advice.
Respond ONLY with valid JSON array, no other text.`;

interface StudyTip {
  title: string;
  description: string;
  category: string;
  emoji: string;
}

const FALLBACK_TIPS: Record<string, StudyTip[]> = {
  default: [
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
    {
      title: 'Feynman Technique',
      description: 'Explain a concept to a child or someone else using simple language. This exposes gaps in your understanding and simplifies complex ideas.',
      category: 'Study Technique',
      emoji: '🗣️',
    },
    {
      title: 'Spaced Repetition System',
      description: 'Review your notes at expanding intervals (1 day, 3 days, 7 days, 30 days). This prevents the forgetting curve and cements facts in long-term memory.',
      category: 'Study Technique',
      emoji: '📅',
    },
    {
      title: 'Healthy Sleep Cycle',
      description: 'Get 7-8 hours of sleep before exams. Sleep is essential for memory consolidation; pulling an all-nighter reduces cognitive capacity by up to 30%.',
      category: 'Health & Focus',
      emoji: '😴',
    },
  ],
  ssc: [
    {
      title: 'Master Previous Year Questions (PYQs)',
      description: 'SSC CGL repeats concepts and question patterns frequently. Solved papers from the last 5-10 years should be your primary resource to identify high-yield topics.',
      category: 'Exam Strategy',
      emoji: '📚',
    },
    {
      title: 'Improve Math Calculation Speed',
      description: 'Practice mental arithmetic, Vedic maths tricks, tables up to 30, and squares/cubes daily. Saving 10-15 seconds per quant question gives you a massive advantage in Tier 1 and Tier 2.',
      category: 'Study Technique',
      emoji: '⚡',
    },
    {
      title: 'Sectional Mock Tests Daily',
      description: 'Take sectional tests for English, Reasoning, and Quant to improve speed and accuracy. Focus on managing your time so you do not get stuck on tough puzzles.',
      category: 'Time Management',
      emoji: '⏱️',
    },
    {
      title: 'Daily English Vocab & Idioms',
      description: 'Dedicate 20 minutes every morning to memorize synonyms, antonyms, one-word substitutions, and idioms. English is high-scoring and saves time for Maths.',
      category: 'Study Technique',
      emoji: '🗣️',
    },
    {
      title: 'Reasoning Trick Mastery',
      description: 'Learn standard shortcuts for Syllogism, Blood Relations, and Coding-Decoding. Aim to complete the entire Reasoning section in under 15 minutes.',
      category: 'Time Management',
      emoji: '🧩',
    },
    {
      title: 'Revise Static GK & Current Affairs',
      description: 'Make concise notes on History, Polity, Geography, and science. GK is the fastest section; you either know the answer or you don\'t.',
      category: 'Exam Strategy',
      emoji: '🏛️',
    },
  ],
  banking: [
    {
      title: 'Focus on Speed & Accuracy',
      description: 'Banking exams (SBI, IBPS) are highly competitive time-bound tests. Practice sectional timing daily and never compromise accuracy for speed, as negative marking is penalizing.',
      category: 'Exam Strategy',
      emoji: '🎯',
    },
    {
      title: 'Daily Current Affairs Quiz',
      description: 'General Awareness section can make or break your selection. Read a daily financial news summary and solve a 15-minute quiz on current affairs to keep your knowledge fresh.',
      category: 'Study Technique',
      emoji: '📰',
    },
    {
      title: 'Daily Practice of Puzzles & DI',
      description: 'Data Interpretation and Puzzles/Seating Arrangements carry maximum weightage. Solve at least 3-5 high-level DI sets and puzzles every single day to build pattern recognition.',
      category: 'Study Technique',
      emoji: '🧩',
    },
    {
      title: 'Master Simplification & Approximation',
      description: 'Solve 20 calculation questions daily. Speed in simplification, number series, and quadratic equations is crucial to clearing Prelims cutoffs.',
      category: 'Study Technique',
      emoji: '➕',
    },
    {
      title: 'Read Financial & Economic News',
      description: 'Read the business page of national dailies daily. This helps in both the General Awareness section and English Reading Comprehension.',
      category: 'Study Technique',
      emoji: '📈',
    },
    {
      title: 'Sectional Time Management',
      description: 'Prelims has strict 20-minute sectional limits. Practice switching gears quickly and skipping time-consuming puzzles to maximize attempts.',
      category: 'Time Management',
      emoji: '⏱️',
    },
  ],
  ccc: [
    {
      title: 'Understand LibreOffice Shortcuts',
      description: 'A significant portion of the NIELIT CCC exam tests keyboard shortcuts for LibreOffice Writer, Calc, and Impress. Create a cheat sheet and practice them daily.',
      category: 'Study Technique',
      emoji: '⌨️',
    },
    {
      title: 'Attempt Online CCC Mock Tests',
      description: 'Familiarize yourself with the online test interface. Practice mock exams with 100 questions within the 90-minute limit to manage your time efficiently.',
      category: 'Exam Strategy',
      emoji: '💻',
    },
    {
      title: 'Focus on Cyber Security & Digital Finance',
      description: 'Modern CCC syllabus emphasizes digital financial tools (UPI, AEPS, USSD) and basic cyber security. Memorize key terms, full forms, and basic concepts.',
      category: 'Study Technique',
      emoji: '🔒',
    },
    {
      title: 'Focus on LibreOffice Calc Formulas',
      description: 'Memorize basic formulas like SUM, AVERAGE, IF, and COUNT in LibreOffice Calc. These are frequently asked in the true/false and MCQ sections.',
      category: 'Study Technique',
      emoji: '📊',
    },
    {
      title: 'Learn Internet & Email Protocols',
      description: 'Understand the differences between SMTP, POP3, IMAP, HTTP, and FTP. Memorize standard port numbers and web browser functionalities.',
      category: 'Study Technique',
      emoji: '🌐',
    },
    {
      title: 'Understand Modern Tech Terms',
      description: 'Learn basic concepts of IoT, Big Data, Cloud Computing, Virtual Reality, and AI. This is a newly expanded section in the NIELIT syllabus.',
      category: 'Study Technique',
      emoji: '🤖',
    },
  ],
  tally: [
    {
      title: 'Memorize Tally Shortcut Keys',
      description: 'Speed is key in accounting. Memorize basic functional shortcuts like F2 (Date), F4 (Contra), F5 (Payment), F6 (Receipt), F7 (Journal), F8 (Sales), and F9 (Purchase).',
      category: 'Study Technique',
      emoji: '⌨️',
    },
    {
      title: 'Practice GST Ledger Creation',
      description: 'Understand the difference between CGST, SGST, and IGST calculations. Practice creating ledgers and configuring tax rates correctly for goods and services.',
      category: 'Study Technique',
      emoji: '📊',
    },
    {
      title: 'Regular Bank Reconciliation practice',
      description: 'Practice matching bank statements with company accounts in Tally Prime. This is one of the most critical daily tasks for any professional accountant.',
      category: 'Time Management',
      emoji: '🏦',
    },
    {
      title: 'Master Voucher Entry Types',
      description: 'Know exactly when to use F4 Contra (bank-to-cash), F5 Payment, F6 Receipt, and F7 Journal (non-cash entries). Misclassifying entries is a common accounting error.',
      category: 'Study Technique',
      emoji: '📝',
    },
    {
      title: 'Practice Inventory Management',
      description: 'Learn how to configure Stock Groups, Categories, Units of Measure, and Godowns. This is critical for businesses tracking physical goods.',
      category: 'Study Technique',
      emoji: '📦',
    },
    {
      title: 'Learn Shortcut Commands for Reports',
      description: 'Use Alt+F1 for detailed view, Alt+F2 to change periods, and Alt+C to add columns. Mastering report navigation saves hours of manual work.',
      category: 'Time Management',
      emoji: '⚡',
    },
  ],
  upsc: [
    {
      title: 'Read Newspapers with Syllabus in Mind',
      description: 'When reading The Hindu or Indian Express, filter articles using the UPSC Mains syllabus. If an article doesn’t map to GS Paper I, II, III, or IV, skip it to save time.',
      category: 'Study Technique',
      emoji: '📰',
    },
    {
      title: 'Write One Answer Every Day',
      description: 'Do not wait to finish the syllabus to start answer writing. Start writing one answer daily from previous year papers. Focus on structure, introduction, body, and conclusion.',
      category: 'Exam Strategy',
      emoji: '✍️',
    },
    {
      title: 'Consolidate and Revise Core Books',
      description: 'Limit your study resources. Read standard reference books (Laxmikanth, Spectrum, etc.) 5-10 times instead of reading 10 different books once. Revision is key to retention.',
      category: 'Study Technique',
      emoji: '📚',
    },
    {
      title: 'Syllabus is your Compass',
      description: 'Memorize the UPSC syllabus. Whenever you read anything, ask yourself which GS paper and topic it aligns with. This prevents studying irrelevant materials.',
      category: 'Exam Strategy',
      emoji: '🧭',
    },
    {
      title: 'Incorporate Map Work Daily',
      description: 'Spend 10 minutes locating places in the news on a world and national map. Map-based questions in Geography and International Relations are highly scoring.',
      category: 'Study Technique',
      emoji: '🗺️',
    },
    {
      title: 'Integrate Prelims and Mains Prep',
      description: 'Do not study for Prelims and Mains in isolation. Build analytical concepts for Mains, and extract facts from them for Prelims.',
      category: 'Exam Strategy',
      emoji: '🔗',
    },
  ],
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getFallbackTips(topicStr: string): StudyTip[] {
  const normalized = (topicStr || '').toLowerCase();
  let pool = FALLBACK_TIPS['default'];
  if (normalized.includes('ssc')) pool = FALLBACK_TIPS['ssc'];
  else if (normalized.includes('banking')) pool = FALLBACK_TIPS['banking'];
  else if (normalized.includes('ccc')) pool = FALLBACK_TIPS['ccc'];
  else if (normalized.includes('tally')) pool = FALLBACK_TIPS['tally'];
  else if (normalized.includes('upsc')) pool = FALLBACK_TIPS['upsc'];
  
  return shuffleArray(pool).slice(0, 3);
}

export async function POST(request: NextRequest) {
  let topic = '';
  try {
    const body = await request.json();
    topic = body?.topic || '';
  } catch {
    // Body parsing failed or was empty, ignore and use default
  }

  try {
    const userPrompt = topic
      ? `Generate 3 study tips specifically for: ${topic}`
      : 'Generate 3 general study tips for competitive exam preparation';

    // Call Gemini API with structured JSON output schema
    const result = await callGeminiAPI({
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      systemInstruction: {
        parts: [{ text: STUDY_TIPS_PROMPT }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          description: 'Array containing exactly 3 practical study tips',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING', description: 'A short catchy title (max 8 words)' },
              description: { type: 'STRING', description: 'A detailed tip (2-3 sentences) with specific, actionable advice' },
              category: { 
                type: 'STRING', 
                enum: ['Time Management', 'Study Technique', 'Exam Strategy', 'Health & Focus', 'Motivation'] 
              },
              emoji: { type: 'STRING', description: 'A relevant single emoji' }
            },
            required: ['title', 'description', 'category', 'emoji']
          }
        }
      }
    });

    const response = extractTextFromResponse(result);

    // Try to parse the response as JSON
    try {
      const tips = JSON.parse(response);
      return NextResponse.json({ tips: Array.isArray(tips) ? tips : [tips], fallback: false });
    } catch {
      // If JSON parsing fails, use structured fallback tips
      console.warn('Failed to parse Gemini response as JSON. Falling back.');
      return NextResponse.json({ tips: getFallbackTips(topic), fallback: true });
    }
  } catch (error) {
    console.error('Study tips API error (using fallback):', error);
    // If Gemini fails entirely (e.g. rate limits), gracefully return high-quality topic-specific tips
    return NextResponse.json({ tips: getFallbackTips(topic), fallback: true });
  }
}
