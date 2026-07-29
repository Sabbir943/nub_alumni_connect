import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are the NUB AI Assistant for Northern University Bangladesh's alumni & student network platform.

Your role:
- Help users navigate the platform (alumni directory, student directory, job portal, messaging, connections)
- Answer questions about alumni, students, and the university network
- Provide career guidance and professional advice
- Help users find specific alumni or students by name, skill, company, or graduation year

Platform features you know about:
- Alumni Directory: Browse and search alumni by name, skill, company, degree, graduation year, location
- Student Directory: Browse and search students by name, department, skills, batch
- Job Portal: Alumni can post jobs, students and alumni can browse and apply
- Messaging: Users can message each other directly
- Follow System: Users can follow/unfollow each other to build their network
- Profile Verification: AI-powered profile verification with trust scores (Verified/Unverified/Suspicious)
- Profile Creation: Alumni fill in job title, organization, degree, graduation year, skills, bio, social links
- Dashboard: Overview with connections, profile status, verification status

Rules:
- Be concise and helpful (2-3 sentences max per response)
- Be friendly and professional
- If you don't know something specific, guide them to the right directory page
- Never make up alumni or student data
- For specific profile searches, tell them to use the search bar in the directory pages`;

function ruleBasedResponse(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.match(/\b(hi|hello|hey|assalam|good\s*(morning|afternoon|evening))\b/)) {
    return "Hello! Welcome to NUB Alumni Network. I can help you find alumni, explore the directory, or navigate the platform. What would you like to know?";
  }

  if (msg.match(/\b(what|how|about|work|this|platform|site|nub\s*bridge)\b/) && msg.match(/\b(do|does|is|can|this|it|site|platform|app)\b/)) {
    return "NUB Bridge is Northern University Bangladesh's alumni & student network platform. You can browse alumni and student directories, connect with professionals, find job opportunities, and message other members. Try visiting the Alumni Directory or Student Directory to explore!";
  }

  if (msg.match(/\b(alumni|graduate|senior|old\s*student)\b/) && msg.match(/\b(find|search|browse|look|who|list|directory)\b/)) {
    return "You can browse our Alumni Directory to find graduates. Use the search bar to filter by name, skills, company, degree, or graduation year. Each profile shows verification status, job details, and contact information.";
  }

  if (msg.match(/\b(student|batch|semester|department|current)\b/) && msg.match(/\b(find|search|browse|look|who|list|directory)\b/)) {
    return "Visit the Student Directory to browse current students. You can search by name, department, skills, or batch. Student profiles include their department, semester, and skills.";
  }

  if (msg.match(/\b(job|career|work|hire|recruit|opening|position)\b/)) {
    return "Check out our Job Board! Alumni can post job openings and both students and alumni can browse opportunities. You can find it in the navigation bar under 'Job Board'.";
  }

  if (msg.match(/\b(connect|follow|message|chat|contact|reach)\b/)) {
    return "You can connect with alumni and students by clicking the Follow button on their profile cards. To message someone, visit their profile and use the messaging feature. Check your dashboard for your connections.";
  }

  if (msg.match(/\b(verif|trust|score|badge|ai\s*verif|profile\s*quality)\b/)) {
    return "Our AI verification system analyzes profiles for completeness, social links, bio quality, and consistency. Profiles get a trust score (0-100) and a badge: Verified (70+), Unverified (40-69), or Suspicious (<40). You can verify any profile by clicking 'Verify with AI' on their card!";
  }

  if (msg.match(/\b(thank|thanks|tysm|appreciate)\b/)) {
    return "You're welcome! Happy to help. Let me know if you have any other questions about the NUB alumni network.";
  }

  if (msg.match(/\b(bye|goodbye|see\s*you|take\s*care)\b/)) {
    return "Goodbye! Feel free to come back anytime you need help with the NUB alumni network. Take care!";
  }

  if (msg.match(/\b(help|guide|assist|support|what\s*can)\b/)) {
    return "I can help you with: 1) Finding alumni or students in the directories, 2) Navigating the job portal, 3) Understanding profile verification, 4) Connecting with other members, 5) General platform questions. Just ask!";
  }

  return "I'm here to help you navigate the NUB Alumni Network! You can ask me about finding alumni, exploring the student directory, job opportunities, connecting with members, or how the platform works. What would you like to know?";
}

export async function POST(request) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      const reply = ruleBasedResponse(lastUserMessage);
      return NextResponse.json({ message: reply });
    }

    const systemMessage = {
      role: 'system',
      content: SYSTEM_PROMPT + (context?.userName ? `\n\nCurrent user: ${context.userName} (${context.userEmail})` : '')
    };

    const apiMessages = [systemMessage, ...messages.slice(-10)];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 300,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      const reply = ruleBasedResponse(lastUserMessage);
      return NextResponse.json({ message: reply });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {}
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
