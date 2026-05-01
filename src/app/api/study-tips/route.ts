import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const STUDY_TIPS_PROMPT = `You are an expert academic advisor and study coach for students preparing for competitive exams in India (SSC, Banking, UPSC, State PSC) and computer certification courses (CCC, Tally, Web Design). 

Generate exactly 3 practical, actionable study tips in JSON format. Each tip should have:
- "title": A short catchy title (max 8 words)
- "description": A detailed tip (2-3 sentences) with specific, actionable advice
- "category": One of: "Time Management", "Study Technique", "Exam Strategy", "Health & Focus", "Motivation"
- "emoji": A relevant single emoji

Make the tips diverse - cover different categories. Be specific and practical. Avoid generic advice.
Respond ONLY with valid JSON array, no other text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;

    const userPrompt = topic
      ? `Generate 3 study tips specifically for: ${topic}`
      : 'Generate 3 general study tips for competitive exam preparation';

    const zai = await ZAI.create();
    const result = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: STUDY_TIPS_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });

    let response = '';
    if (result?.choices?.[0]?.message?.content) {
      response = result.choices[0].message.content;
    } else if (typeof result === 'string') {
      response = result;
    }

    // Try to parse the response as JSON
    try {
      // Extract JSON from the response (might have markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tips = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ tips });
      }
      // If no array found, try parsing the whole response
      const tips = JSON.parse(response);
      return NextResponse.json({ tips: Array.isArray(tips) ? tips : [tips] });
    } catch {
      // If JSON parsing fails, create structured tips from the text
      const tips = [
        {
          title: 'Study Smart',
          description: response.slice(0, 200),
          category: 'Study Technique',
          emoji: '📚',
        },
      ];
      return NextResponse.json({ tips });
    }
  } catch (error) {
    console.error('Study tips API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate study tips' },
      { status: 500 }
    );
  }
}
