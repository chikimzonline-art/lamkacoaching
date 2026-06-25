import { NextRequest, NextResponse } from 'next/server';
import { callGeminiAPI, extractTextFromResponse } from '@/lib/gemini';
import { db } from '@/lib/db';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (data.resetAt < now) {
      rateLimitMap.delete(ip);
    }
  }
}


const SYSTEM_PROMPT =
  `You are a helpful assistant for Lamka Coaching Center. You help students with queries about courses, fees, cabin bookings, exam preparation, and general information. Be friendly, concise, and encouraging. The center offers competitive exam coaching (SSC, Banking, UPSC), computer training (CCC, Tally, Web Design), and study cabin facilities. Located in Lamka, Manipur.

IMPORTANT RULES & GUIDELINES:
1. **Course Details vs. Batch Details**:
   - When users ask about course fees, duration, or general information, you MUST ONLY provide the standard course details (e.g. standard fee and duration) listed under the "Course Details" section.
   - Do NOT volunteer or quote batch-specific fees, timings, or seats from the "Upcoming/Active Batches" section (such as ₹5000 for CCC or specific batch timings) as general course information, since these vary and are not standard.
   - If a student asks about active/upcoming batch start dates, timings, or specific batch fees, tell them the standard course details, but strongly advise/suggest that they contact the coaching center directly (provide the phone number/email) or visit the office to confirm the latest/active batch schedules, available timings, and specific batch enrollment details. Avoid fabricating or giving unnecessary/confusing batch-specific details.

2. **Study Cabin Availability**:
   - A cabin has two types of bookings: "Exclusive" (monthly full-day booking) and "Hourly" (slotted bookings).
   - If a cabin is exclusively booked ("Occupied (Exclusive Booked)"), it means the cabin is reserved for the whole day, and is STRICTLY UNAVAILABLE for both monthly and hourly bookings. You MUST state that it is fully occupied and not available for any bookings. Do NOT say it is available for hourly bookings.
   - If a cabin is "Free for Monthly Booking", it means it can be booked monthly. If there are any "Booked hourly slots today" listed for it, those specific time slots are occupied and unavailable for other students today until their booking ends. It is only available for hourly bookings during slots that are NOT booked.
   - Always be precise, factual, and clear about which slots/cabins are available or unavailable. Never output contradictory status information.`;

const MAX_CONTEXT_MESSAGES = 18;

function getFallbackChatResponse(

  settingsMap?: Record<string, string>,
  departments?: any[],
  batches?: any[],
  cabinDetailsList?: any[]
): string {
  let resp = `I apologize, but our AI assistant is currently rate-limited or experiencing high traffic. Here is the latest live information from our database:\n\n`;

  const phone = settingsMap?.['business_phone'] || 'Not provided';
  const email = settingsMap?.['business_email'] || 'Not provided';
  const address = settingsMap?.['business_address'] || 'Not provided';

  resp += `📞 **Contact Info:**\n`;
  resp += `- **Phone:** ${phone}\n`;
  resp += `- **Email:** ${email}\n`;
  resp += `- **Address:** ${address}\n\n`;

  if (departments && departments.length > 0) {
    resp += `📚 **Courses Offered:**\n`;
    departments.forEach((dept) => {
      if (dept.courses && dept.courses.length > 0) {
        resp += `**${dept.name}**:\n`;
        dept.courses.forEach((c: any) => {
          resp += `- ${c.name}: Fee: ₹${c.totalFee / 100} | Duration: ${c.duration || 'N/A'}\n`;
        });
      }
    });
    resp += `\n`;
  }

  if (batches && batches.length > 0) {
    resp += `⏱️ **Active/Upcoming Batches:**\n`;
    batches.forEach((b: any) => {
      resp += `- ${b.courseName} (${b.department}): Fee: ₹${b.fee} | Timing: ${b.timing} | Seats left: ${b.seats} | Status: ${b.status}\n`;
    });
    resp += `\n`;
  }

  if (cabinDetailsList && cabinDetailsList.length > 0) {
    resp += `🏢 **Study Cabins & Availability:**\n`;
    resp += `- Reserved Monthly Rate: ₹${settingsMap?.['monthly_rate'] || '3000'} | Shifts: Morning (5am-10am): ₹${settingsMap?.['shift_morning_rate'] || '500'}, Day (10am-5pm): ₹${settingsMap?.['shift_day_rate'] || '800'}, Night (5pm-12am): ₹${settingsMap?.['shift_night_rate'] || '800'} | Registration Fee: ₹${settingsMap?.['booking_registration_fee'] || '500'}\n`;
    cabinDetailsList.forEach((c: any) => {
      const floorStr = c.floor === 1 ? '1st' : c.floor === 2 ? '2nd' : c.floor === 3 ? '3rd' : `${c.floor}th`;
      let statusStr = '';
      if (c.isOccupiedReserved) {
        statusStr = 'Occupied (Reserved today)';
      } else {
        const shiftStatus = c.shiftsBookedToday && c.shiftsBookedToday.length > 0
          ? `Booked shifts: ${c.shiftsBookedToday.join(', ')}`
          : 'No shifts booked today';
        statusStr = `Available for Reserved | ${shiftStatus}`;
      }
      resp += `- Cabin ${c.cabinNum} (${floorStr} Floor): ${statusStr}\n`;
    });
    resp += `\n`;
  }

  resp += `Please feel free to call us at ${phone === 'Not provided' ? 'our contact number' : phone} or visit our office for direct inquiries.`;
  return resp;
}

export async function POST(request: NextRequest) {
  // Rate limiting check
  if (Math.random() < 0.05) {
    cleanupRateLimitMap();
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const limit = 15;
  const windowMs = 60 * 1000;

  const current = rateLimitMap.get(ip);
  if (!current || current.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
  } else {
    current.count++;
    if (current.count > limit) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }
  }

  let sid = 'default';
  let settingsMap: Record<string, string> = {};
  let departments: any[] = [];
  let batches: any[] = [];
  let cabinDetailsList: any[] = [];

  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    sid = sessionId || 'default';

    // Save the user message to the database
    await db.chatMessage.create({
      data: {
        sessionId: sid,
        role: 'user',
        content: message.trim(),
      },
    });

    // Load the last 18 messages for this session from DB (to build context)
    const recentMessages = await db.chatMessage.findMany({
      where: { sessionId: sid },
      orderBy: { createdAt: 'desc' },
      take: MAX_CONTEXT_MESSAGES,
    });

    // Reverse to get chronological order
    const orderedMessages = recentMessages.reverse();

    // Fetch live settings (contact, rates)
    const settings = await db.setting.findMany({
      where: {
        key: {
          in: [
            'business_name',
            'business_phone',
            'business_email',
            'business_address',
            'business_description',
            'shift_morning_rate',
            'shift_day_rate',
            'shift_night_rate',
            'booking_registration_fee',
            'monthly_rate',
          ],
        },
      },
    });
    settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    // Fetch active courses with departments
    departments = await db.department.findMany({
      where: { status: 'active' },
      include: {
        courses: {
          where: { status: 'active' },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Fetch active upcoming batches
    batches = await db.batch.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch active cabins with bookings for availability
    const cabins = await db.cabin.findMany({
      where: { status: 'active' },
      include: {
        bookings: {
          where: { status: 'active' },
        },
      },
      orderBy: [{ floor: 'asc' }, { cabinNum: 'asc' }],
    });

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    cabinDetailsList = cabins.map((c) => {
      const activeReserved = c.bookings.find((b) => {
        if (b.type !== 'reserved') return false;
        const startLimit = new Date(b.startDate);
        startLimit.setHours(0, 0, 0, 0);
        if (startLimit > now) return false;
        if (!b.endDate) return true;
        const endLimit = new Date(b.endDate);
        endLimit.setHours(23, 59, 59, 999);
        return endLimit >= now;
      });
      const todayShift = c.bookings.filter((b) => {
        if (b.type !== 'shift') return false;
        const startLimit = new Date(b.startDate);
        startLimit.setHours(0, 0, 0, 0);
        if (startLimit > now) return false;
        if (!b.endDate) {
          return startLimit.getTime() === todayStart.getTime();
        } else {
          const endLimit = new Date(b.endDate);
          endLimit.setHours(23, 59, 59, 999);
          return endLimit >= now;
        }
      });
      return {
        cabinNum: c.cabinNum,
        floor: c.floor,
        isOccupiedReserved: !!activeReserved,
        shiftsBookedToday: todayShift.map((b) => `${b.startTime} to ${b.endTime}`),
      };
    });

    // Build dynamic prompt sections
    let dynamicPromptInfo = `\n\n### Current Live Center Info (Use this dynamic data to answer user queries):\n`;
    dynamicPromptInfo += `- **Name:** ${settingsMap['business_name'] || 'Lamka Coaching Center'}\n`;
    dynamicPromptInfo += `- **Phone:** ${settingsMap['business_phone'] || 'Not provided'}\n`;
    dynamicPromptInfo += `- **Email:** ${settingsMap['business_email'] || 'Not provided'}\n`;
    dynamicPromptInfo += `- **Address:** ${settingsMap['business_address'] || 'Not provided'}\n`;
    dynamicPromptInfo += `- **Description:** ${settingsMap['business_description'] || 'Coaching Center'}\n`;

    dynamicPromptInfo += `\n#### Course Details:\n`;
    if (departments.length === 0) {
      dynamicPromptInfo += `- No courses are currently listed as active.\n`;
    } else {
      departments.forEach((dept) => {
        dynamicPromptInfo += `\n**Department: ${dept.name}**\n`;
        dept.courses.forEach((course) => {
          dynamicPromptInfo += `- **${course.name}**: Fee: ₹${course.totalFee / 100}, Duration: ${course.duration || 'N/A'}. Description: ${course.description || 'No description'}\n`;
        });
      });
    }

    dynamicPromptInfo += `\n#### Upcoming/Active Batches:\n`;
    if (batches.length === 0) {
      dynamicPromptInfo += `- No upcoming batches are scheduled.\n`;
    } else {
      batches.forEach((b) => {
        dynamicPromptInfo += `- **${b.courseName}** (${b.department}): Fee: ₹${b.fee}, Timing: ${b.timing}, Seats Available: ${b.seats}, Status: ${b.status}\n`;
      });
    }

    dynamicPromptInfo += `\n#### Study Cabin Facilities & Availability:\n`;
    dynamicPromptInfo += `- **Pricing:** Monthly Reserved Rate: ₹${settingsMap['monthly_rate'] || '3000'} | Shifts: Morning (5am-10am): ₹${settingsMap['shift_morning_rate'] || '500'}, Day (10am-5pm): ₹${settingsMap['shift_day_rate'] || '800'}, Night (5pm-12am): ₹${settingsMap['shift_night_rate'] || '800'} | Registration Fee: ₹${settingsMap['booking_registration_fee'] || '500'} for all bookings.\n`;
    dynamicPromptInfo += `- **Available Cabins:**\n`;
    if (cabinDetailsList.length === 0) {
      dynamicPromptInfo += `- No study cabins are active currently.\n`;
    } else {
      cabinDetailsList.forEach((c) => {
        const floorStr = c.floor === 1 ? '1st' : c.floor === 2 ? '2nd' : c.floor === 3 ? '3rd' : `${c.floor}th`;
        let statusStr = '';
        if (c.isOccupiedReserved) {
          statusStr = 'Occupied (Reserved - strictly not available for any bookings today)';
        } else {
          const shiftStatus = c.shiftsBookedToday.length > 0
            ? `Booked shifts today: ${c.shiftsBookedToday.join(', ')}`
            : 'No shifts booked today (All shifts available)';
          statusStr = `Free for Reserved Booking | ${shiftStatus}`;
        }
        dynamicPromptInfo += `- **Cabin ${c.cabinNum}** (${floorStr} Floor): ${statusStr}\n`;
      });
    }

    const fullSystemPrompt = `${SYSTEM_PROMPT}${dynamicPromptInfo}`;

    // Map roles to Gemini roles ('assistant' -> 'model')
    const contents = orderedMessages.map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
      parts: [{ text: m.content }],
    }));

    // Call Gemini API
    const result = await callGeminiAPI({
      contents,
      systemInstruction: {
        parts: [{ text: fullSystemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
      }
    });

    // Extract model response
    const assistantMessage = extractTextFromResponse(result) || "I'm sorry, I couldn't generate a response. Please try again.";
    
    // Log the model used
    console.log(`[Chat API] Successfully responded using model: ${result?._usedModel || 'unknown'}`);

    // Save the assistant response to the database
    await db.chatMessage.create({
      data: {
        sessionId: sid,
        role: 'assistant',
        content: assistantMessage,
      },
    });

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Chat API error (using fallback):', error);
    try {
      const fallbackResp = getFallbackChatResponse(settingsMap, departments, batches, cabinDetailsList);
      
      // Save the assistant response to the database
      await db.chatMessage.create({
        data: {
          sessionId: sid,
          role: 'assistant',
          content: fallbackResp,
        },
      });

      return NextResponse.json({ response: fallbackResp });
    } catch (fallbackDbError) {
      console.error('Failed to generate fallback response:', fallbackDbError);
      return NextResponse.json(
        { error: 'Failed to generate response. Please try again later.' },
        { status: 500 }
      );
    }
  }
}
