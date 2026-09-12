import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are the NUB AI Assistant for Northern University Bangladesh's alumni & student network platform.

You have access to real-time search tools. When a user asks to find alumni, students, or jobs, use the appropriate tool to search the database and return actual results.

Your capabilities:
- Search alumni by name, company, degree, skills, or graduation year
- Search students by name, department, skills, or batch
- Search jobs by title, company, location, or job type
- Answer questions about the platform and its features
- Provide career guidance and professional advice

Rules:
- When users ask to find/search/look for people or jobs, ALWAYS use the search tools
- Present results clearly with key details
- Be concise and helpful (2-3 sentences summary + results)
- Be friendly and professional
- If no results found, suggest broadening the search or browsing the directory pages
- Never make up data — only use what the search tools return`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_alumni",
      description:
        "Search the alumni directory. Use when users ask to find alumni, graduates, seniors, or old students.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search term to match against name, company, degree, or skills",
          },
          limit: {
            type: "number",
            description: "Max results to return (default 5, max 10)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_students",
      description:
        "Search the student directory. Use when users ask to find current students, batch mates, or department members.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search term to match against name, department, skills, or batch",
          },
          limit: {
            type: "number",
            description: "Max results to return (default 5, max 10)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_jobs",
      description:
        "Search job postings. Use when users ask about job openings, internships, careers, hiring, or positions.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search term to match against title, company, location, or description",
          },
          jobType: {
            type: "string",
            description:
              "Filter by job type: Full-time, Part-time, Internship, Contract",
          },
          limit: {
            type: "number",
            description: "Max results to return (default 5, max 10)",
          },
        },
        required: ["query"],
      },
    },
  },
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function searchAlumni(query, limit = 5) {
  const col = await getCollection("alumni_directory");
  const safe = escapeRegex(query);
  const regex = { $regex: safe, $options: "i" };
  const docs = await col
    .find({
      $or: [
        { fullName: regex },
        { organization: regex },
        { degree: regex },
        { skills: regex },
        { jobTitle: regex },
      ],
    })
    .limit(Math.min(limit, 10))
    .toArray();
  return docs.map((d) => ({
    name: d.fullName,
    email: d.email,
    jobTitle: d.jobTitle || "",
    organization: d.organization || "",
    degree: d.degree || "",
    graduationYear: d.graduationYear || "",
    skills: Array.isArray(d.skills) ? d.skills.slice(0, 5) : [],
    location: d.currentLocation || "",
    verified: d.verification?.level || "unknown",
  }));
}

async function searchStudents(query, limit = 5) {
  const col = await getCollection("students");
  const safe = escapeRegex(query);
  const regex = { $regex: safe, $options: "i" };
  const docs = await col
    .find({
      $or: [
        { fullName: regex },
        { department: regex },
        { skills: regex },
        { batch: regex },
        { semester: regex },
      ],
    })
    .limit(Math.min(limit, 10))
    .toArray();
  return docs.map((d) => ({
    name: d.fullName,
    email: d.email,
    studentId: d.studentId || "",
    department: d.department || "",
    semester: d.semester || "",
    batch: d.batch || "",
    skills: Array.isArray(d.skills) ? d.skills.slice(0, 5) : [],
    location: d.location || "",
    verified: d.verification?.level || "unknown",
  }));
}

async function searchJobs(query, jobType, limit = 5) {
  const col = await getCollection("jobs");
  const safe = escapeRegex(query);
  const regex = { $regex: safe, $options: "i" };
  const filter = {
    $or: [
      { title: regex },
      { company: regex },
      { location: regex },
      { description: regex },
    ],
  };
  if (jobType) filter.jobType = jobType;
  const docs = await col
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 10))
    .toArray();
  return docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    company: d.company || "",
    location: d.location || "",
    jobType: d.jobType || "",
    workplaceType: d.workplaceType || "",
    salary: d.salary || d.salaryRange || "",
    postedAt: d.createdAt,
  }));
}

function executeToolCall(name, args) {
  switch (name) {
    case "search_alumni":
      return searchAlumni(args.query, args.limit || 5);
    case "search_students":
      return searchStudents(args.query, args.limit || 5);
    case "search_jobs":
      return searchJobs(args.query, args.jobType, args.limit || 5);
    default:
      return Promise.resolve({ error: `Unknown tool: ${name}` });
  }
}

async function parseStream(response) {
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let content = "";
  const functionCalls = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) content += delta.content;
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? functionCalls.length;
            if (!functionCalls[idx]) {
              functionCalls[idx] = {
                id: tc.id || "",
                name: tc.function?.name || "",
                arguments: "",
              };
            }
            if (tc.id) functionCalls[idx].id = tc.id;
            if (tc.function?.name) functionCalls[idx].name = tc.function.name;
            if (tc.function?.arguments)
              functionCalls[idx].arguments += tc.function.arguments;
          }
        }
      } catch {}
    }
  }
  return {
    content,
    functionCalls: functionCalls.filter((f) => f?.name).map((f) => ({
      ...f,
      arguments: JSON.parse(f.arguments || "{}"),
    })),
  };
}

function ruleBasedResponse(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.match(/\b(hi|hello|hey|assalam|good\s*(morning|afternoon|evening))\b/)) {
    return "Hello! Welcome to NUB Alumni Network. I can help you find alumni, explore the directory, or navigate the platform. What would you like to know?";
  }

  if (msg.match(/\b(what|how|about|work|this|platform|site|nub\s*bridge)\b/) && msg.match(/\b(do|does|is|can|this|it|site|platform|app)\b/)) {
    return "NUB Bridge is Northern University Bangladesh's alumni & student network platform. You can browse alumni and student directories, connect with professionals, find job opportunities, and message other members.";
  }

  if (msg.match(/\b(alumni|graduate|senior|old\s*student)\b/) && msg.match(/\b(find|search|browse|look|who|list|directory)\b/)) {
    return "You can browse our Alumni Directory to find graduates. Use the search bar to filter by name, skills, company, degree, or graduation year.";
  }

  if (msg.match(/\b(student|batch|semester|department|current)\b/) && msg.match(/\b(find|search|browse|look|who|list|directory)\b/)) {
    return "Visit the Student Directory to browse current students. You can search by name, department, skills, or batch.";
  }

  if (msg.match(/\b(job|career|work|hire|recruit|opening|position)\b/)) {
    return "Check out our Job Board! Alumni can post job openings and both students and alumni can browse opportunities.";
  }

  if (msg.match(/\b(connect|follow|message|chat|contact|reach)\b/)) {
    return "You can connect with alumni and students by clicking the Follow button on their profile cards. To message someone, visit their profile and use the messaging feature.";
  }

  if (msg.match(/\b(verif|trust|score|badge|ai\s*verif|profile\s*quality)\b/)) {
    return "Our AI verification system analyzes profiles for completeness, social links, bio quality, and consistency. Profiles get a trust score (0-100) and a badge: Verified (70+), Unverified (40-69), or Suspicious (<40).";
  }

  if (msg.match(/\b(thank|thanks|tysm|appreciate)\b/)) {
    return "You're welcome! Happy to help. Let me know if you have any other questions about the NUB alumni network.";
  }

  if (msg.match(/\b(bye|goodbye|see\s*you|take\s*care)\b/)) {
    return "Goodbye! Feel free to come back anytime you need help with the NUB alumni network. Take care!";
  }

  if (msg.match(/\b(help|guide|assist|support|what\s*can)\b/)) {
    return "I can help you with: 1) Finding alumni or students, 2) Searching job openings, 3) Navigating the platform, 4) Understanding profile verification, 5) Connecting with members. Just ask!";
  }

  return "I'm here to help you navigate the NUB Alumni Network! Try asking me to find alumni, search for students, or look up job openings. What would you like to know?";
}

export async function POST(request) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // ── Fallback: smart search when no OpenAI key ────────────────────────
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "your-openai-api-key-here") {
      const msg = lastUserMessage.toLowerCase();

      // Greetings / pure social
      if (msg.match(/\b(hi|hello|hey|assalam|good\s*(morning|afternoon|evening)|bye|goodbye|thanks|thank)\b/) && !msg.match(/\b(alumni|student|job|find|search)/)) {
        if (msg.match(/\b(thank|thanks)\b/)) return NextResponse.json({ message: "You're welcome! Happy to help. Let me know if you need anything else." });
        if (msg.match(/\b(bye|goodbye)\b/)) return NextResponse.json({ message: "Goodbye! Feel free to come back anytime." });
        return NextResponse.json({ message: "Hello! I can help you find alumni, students, or job opportunities. What are you looking for?" });
      }

      // Platform general questions (no search needed)
      if (msg.match(/\b(what|how)\b/) && msg.match(/\b(this|platform|site|app|nub\s*bridge|work|do|does|is|can)\b/) && !msg.match(/\b(alumni|student|job|find|search)/)) {
        return NextResponse.json({ message: "NUB Bridge is Northern University Bangladesh's alumni & student network. Browse directories, find jobs, connect with professionals, and message members." });
      }

      if (msg.match(/\b(help|what\s*can)\b/) && !msg.match(/\b(alumni|student|job|find|search)/)) {
        return NextResponse.json({ message: "I can: 1) Search alumni by name, company, skills, or degree, 2) Search students by name, department, or batch, 3) Find jobs by title, company, or type. Just ask!" });
      }

      // ── Everything below tries a DB search ─────────────────────────────
      const hasJobKeyword = msg.match(/\b(job|career|work|hire|recruit|opening|position|internship|vacancy|apply|hiring)\b/);
      const hasAlumniKeyword = msg.match(/\b(alumni|graduate|senior|old\s*student|batch\s*\d)\b/);
      const hasStudentKeyword = msg.match(/\b(student|batch|semester|department|cse|eee|bba|faculty|current)\b/);

      // Try all relevant search types and combine results
      const allResults = [];

      if (hasAlumniKeyword || (!hasStudentKeyword && !hasJobKeyword)) {
        try {
          const alumni = await searchAlumni(lastUserMessage, 5);
          if (alumni.length > 0) allResults.push({ type: "alumni", data: alumni });
        } catch {}
      }

      if (hasStudentKeyword || (!hasAlumniKeyword && !hasJobKeyword)) {
        try {
          const students = await searchStudents(lastUserMessage, 5);
          if (students.length > 0) allResults.push({ type: "student", data: students });
        } catch {}
      }

      if (hasJobKeyword || allResults.length === 0) {
        try {
          const jobs = await searchJobs(lastUserMessage, null, 5);
          if (jobs.length > 0) allResults.push({ type: "jobs", data: jobs });
        } catch {}
      }

      // Return combined results
      if (allResults.length > 0) {
        // If only one type found results, return that
        if (allResults.length === 1) {
          const r = allResults[0];
          const label = r.type === "alumni" ? "alumni" : r.type === "student" ? "students" : "jobs";
          return NextResponse.json({
            message: `Found ${r.data.length} ${label}:`,
            results: { type: r.type, data: r.data },
          });
        }
        // Multiple types: return the first one with a note
        const r = allResults[0];
        const label = r.type === "alumni" ? "alumni" : r.type === "student" ? "students" : "jobs";
        const otherLabels = allResults.slice(1).map(x => x.type === "alumni" ? "alumni" : x.type === "student" ? "students" : "jobs").join(" and ");
        return NextResponse.json({
          message: `Found ${r.data.length} ${label} (also found ${otherLabels}). Showing ${label} results:`,
          results: { type: r.type, data: r.data },
        });
      }

      // Nothing found at all
      return NextResponse.json({
        message: `I couldn't find anything matching "${lastUserMessage}". Try different keywords like a name, company, department, or job title.`,
      });
    }

    // ── OpenAI with function calling ─────────────────────────────────────
    const systemMessage = {
      role: "system",
      content:
        SYSTEM_PROMPT +
        (context?.userName
          ? `\n\nCurrent user: ${context.userName} (${context.userEmail})`
          : ""),
    };

    const apiMessages = [systemMessage, ...messages.slice(-10)];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        tools: TOOLS,
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      return NextResponse.json({ message: ruleBasedResponse(lastUserMessage) });
    }

    // ── Phase 1: parse stream ────────────────────────────────────────────
    const { content, functionCalls } = await parseStream(response);

    // ── No function calls → stream final answer directly ─────────────────
    if (functionCalls.length === 0) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── Phase 2: execute function calls ──────────────────────────────────
    const functionResults = await Promise.all(
      functionCalls.map(async (tc) => {
        try {
          const result = await executeToolCall(tc.name, tc.arguments);
          return { tool_call_id: tc.id, result };
        } catch (err) {
          console.error(`Tool ${tc.name} error:`, err);
          return {
            tool_call_id: tc.id,
            result: { error: `Search failed: ${err.message}` },
          };
        }
      })
    );

    // ── Phase 3: second OpenAI call with results → natural language ──────
    const toolMessages = functionCalls.map((tc, i) => ({
      role: "tool",
      tool_call_id: tc.id,
      content: JSON.stringify(functionResults[i].result),
    }));

    const secondResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            ...apiMessages,
            { role: "assistant", content: content || null, tool_calls: functionCalls.map((tc) => ({
                id: tc.id,
                type: "function",
                function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
              })) },
            ...toolMessages,
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!secondResponse.ok) {
      console.error("OpenAI second call failed:", secondResponse.status);
      // Return function results directly as fallback
      const combined = functionResults.map((r) => r.result).flat();
      const firstResult = functionResults[0]?.result;
      const type =
        firstResult?.length > 0 &&
        "department" in (firstResult[0] || {})
          ? "student"
          : firstResult?.length > 0 && "jobTitle" in (firstResult[0] || {})
            ? "alumni"
            : "jobs";
      return NextResponse.json({
        message: "Here are the results I found:",
        results: { type, data: combined },
      });
    }

    const secondData = await secondResponse.json();
    const finalContent =
      secondData.choices?.[0]?.message?.content || "Here are the results:";

    // ── Return: natural language + structured results for card rendering ─
    const firstResult = functionResults[0]?.result;
    const hasResults =
      Array.isArray(firstResult) && firstResult.length > 0;
    if (!hasResults) {
      return NextResponse.json({ message: finalContent });
    }

    const type =
      "department" in (firstResult[0] || {})
        ? "student"
        : "jobTitle" in (firstResult[0] || {})
          ? "alumni"
          : "jobs";

    return NextResponse.json({
      message: finalContent,
      results: { type, data: firstResult },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
