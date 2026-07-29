const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function analyzeProfile(profile, type) {
  const flags = [];
  let score = 0;

  const isAlumni = type === 'alumni';

  const requiredFields = isAlumni
    ? ['fullName', 'email', 'degree', 'graduationYear', 'currentLocation', 'jobTitle', 'organization', 'bio', 'skills']
    : ['fullName', 'email', 'studentId', 'department', 'semester', 'batch', 'bio', 'skills'];

  const filledRequired = requiredFields.filter(f => {
    const val = profile[f];
    return val && String(val).trim().length > 0;
  });
  const completeness = Math.round((filledRequired.length / requiredFields.length) * 25);
  score += completeness;
  if (completeness < 15) flags.push('Profile is missing many required fields');

  const socialLinks = isAlumni
    ? [profile.linkedinUrl, profile.facebookUrl, profile.twitterUrl]
    : [profile.linkedinUrl, profile.githubUrl];
  const validLinks = socialLinks.filter(u => u && typeof u === 'string' && u.startsWith('http'));
  const socialScore = Math.min(25, validLinks.length * 10);
  score += socialScore;
  if (validLinks.length === 0) flags.push('No social media links provided');

  const bio = profile.bio || '';
  let bioScore = 0;
  if (bio.length > 150) bioScore = 25;
  else if (bio.length > 100) bioScore = 22;
  else if (bio.length > 50) bioScore = 16;
  else if (bio.length > 20) bioScore = 10;
  else if (bio.length > 0) bioScore = 5;
  score += bioScore;
  if (bioScore < 12) flags.push('Bio is too short or missing');

  let consistencyScore = 25;
  if (isAlumni) {
    if (!profile.graduationYear) consistencyScore -= 5;
    if (!profile.jobTitle) consistencyScore -= 3;
    if (!profile.organization) consistencyScore -= 3;
  } else {
    if (!profile.semester) consistencyScore -= 5;
    if (!profile.batch) consistencyScore -= 3;
    if (!profile.department) consistencyScore -= 3;
  }
  score += consistencyScore;

  if (profile.profilePictureUrl && typeof profile.profilePictureUrl === 'string' && profile.profilePictureUrl.startsWith('http')) {
    score = Math.min(100, score + 2);
  }

  let badge;
  if (score >= 70) badge = 'Verified';
  else if (score >= 40) badge = 'Unverified';
  else badge = 'Suspicious';

  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      const aiResult = await callOpenAI(profile, type);
      if (aiResult && typeof aiResult.trustScore === 'number') {
        return {
          trustScore: aiResult.trustScore,
          badge: aiResult.badge || badge,
          breakdown: aiResult.breakdown || {
            completeness,
            socialLinks: socialScore,
            bioQuality: bioScore,
            consistency: consistencyScore,
          },
          analysis: aiResult.analysis || `AI-verified: Profile ${badge.toLowerCase()}.`,
          flags: aiResult.flags || flags,
          verifiedAt: new Date().toISOString(),
          method: 'ai',
        };
      }
    } catch (e) {
      console.error("OpenAI error, using rule-based:", e.message);
    }
  }

  return {
    trustScore: Math.min(100, score),
    badge,
    breakdown: {
      completeness,
      socialLinks: socialScore,
      bioQuality: bioScore,
      consistency: consistencyScore,
    },
    analysis: `Profile is ${badge.toLowerCase()} based on completeness (${completeness}/25), social links (${socialScore}/25), bio quality (${bioScore}/25), and consistency (${consistencyScore}/25).`,
    flags,
    verifiedAt: new Date().toISOString(),
    method: 'rule-based',
  };
}

async function callOpenAI(profile, type) {
  const isAlumni = type === 'alumni';
  const fields = isAlumni
    ? `Name: ${profile.fullName}\nEmail: ${profile.email}\nDegree: ${profile.degree || 'N/A'}\nGraduation Year: ${profile.graduationYear || 'N/A'}\nLocation: ${profile.currentLocation || 'N/A'}\nOrganization: ${profile.organization || 'N/A'}\nJob Title: ${profile.jobTitle || 'N/A'}\nLinkedIn: ${profile.linkedinUrl || 'N/A'}\nBio: ${profile.bio || 'N/A'}\nSkills: ${profile.skills || 'N/A'}\nProfile Picture: ${profile.profilePictureUrl ? 'Yes' : 'No'}`
    : `Name: ${profile.fullName}\nEmail: ${profile.email}\nStudent ID: ${profile.studentId || 'N/A'}\nDepartment: ${profile.department || 'N/A'}\nSemester: ${profile.semester || 'N/A'}\nBatch: ${profile.batch || 'N/A'}\nGitHub: ${profile.githubUrl || 'N/A'}\nLinkedIn: ${profile.linkedinUrl || 'N/A'}\nBio: ${profile.bio || 'N/A'}\nSkills: ${profile.skills || 'N/A'}\nProfile Picture: ${profile.profilePictureUrl ? 'Yes' : 'No'}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You analyze university profile authenticity. Respond with JSON only.'
        },
        {
          role: 'user',
          content: `Analyze this ${type} profile for a Northern University Bangladesh alumni network. Score 0-100 trust score. Respond JSON: {"trustScore":0-100,"badge":"Verified|Unverified|Suspicious","breakdown":{"completeness":0-25,"socialLinks":0-25,"bioQuality":0-25,"consistency":0-25},"analysis":"1-2 sentence explanation","flags":["any suspicious patterns or empty array"]}\n\n${fields}`
        }
      ],
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI ${response.status}`);
  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty response');
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON');
  return JSON.parse(match[0]);
}
