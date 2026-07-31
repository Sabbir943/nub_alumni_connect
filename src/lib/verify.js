const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'NUB-Verification-Bot/1.0' },
    });
    clearTimeout(timeout);
    return { valid: res.ok, status: res.status };
  } catch (e) {
    return { valid: false, status: 0, error: e.message };
  }
}

function validateStudentId(studentId) {
  if (!studentId || typeof studentId !== 'string') return { valid: false, length: 0 };
  const digits = studentId.replace(/\D/g, '');
  return { valid: digits.length === 11, length: digits.length };
}

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

  const linksToCheck = isAlumni
    ? [
        { key: 'linkedin', url: profile.linkedinUrl, label: 'LinkedIn' },
        { key: 'facebook', url: profile.facebookUrl, label: 'Facebook' },
        { key: 'twitter', url: profile.twitterUrl, label: 'Twitter/X' },
      ]
    : [
        { key: 'linkedin', url: profile.linkedinUrl, label: 'LinkedIn' },
        { key: 'github', url: profile.githubUrl, label: 'GitHub' },
      ];

  const linkResults = await Promise.all(
    linksToCheck.map(async ({ key, url, label }) => {
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return { key, url: url || '', label, valid: false, status: 0, error: 'missing', checked: false };
      }
      const result = await checkUrl(url);
      return { key, url, label, valid: result.valid, status: result.status, error: result.error || null, checked: true };
    })
  );

  const checkedLinks = linkResults.filter(l => l.checked);
  const validLinks = linkResults.filter(l => l.valid);
  const invalidLinks = linkResults.filter(l => l.checked && !l.valid);
  const missingLinks = linkResults.filter(l => !l.checked);

  let socialScore = 0;
  if (checkedLinks.length > 0) {
    socialScore = Math.round((validLinks.length / checkedLinks.length) * 25);
  }
  if (invalidLinks.length > 0) {
    socialScore = Math.max(0, socialScore - invalidLinks.length * 8);
  }
  if (missingLinks.length > 0 && invalidLinks.length === 0) {
    socialScore = Math.max(0, socialScore - missingLinks.length * 5);
  }
  score += socialScore;

  if (invalidLinks.length > 0) {
    flags.push(`${invalidLinks.length} link(s) are not reachable: ${invalidLinks.map(l => l.label).join(', ')}`);
  }
  if (validLinks.length === checkedLinks.length && checkedLinks.length > 0) {
    flags.push('All social links verified and accessible');
  }
  if (missingLinks.length > 0) {
    flags.push(`${missingLinks.length} social link(s) not provided`);
  }

  let idScoreBonus = 0;
  if (!isAlumni) {
    const idValidation = validateStudentId(profile.studentId);
    if (idValidation.valid) {
      idScoreBonus = 5;
      flags.push('Student ID verified (11 digits)');
    } else if (profile.studentId) {
      idScoreBonus = -5;
      flags.push(`Student ID is ${idValidation.length} digits (expected 11)`);
    } else {
      idScoreBonus = -3;
      flags.push('No student ID provided');
    }
    score += idScoreBonus;
  }

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

  score = Math.max(0, Math.min(100, score));

  const hasInvalidLinks = invalidLinks.length > 0;
  let badge;
  if (score >= 70 && !hasInvalidLinks) badge = 'Verified';
  else if (score < 40 || hasInvalidLinks) badge = 'Suspicious';
  else badge = 'Unverified';

  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      const aiResult = await callOpenAI(profile, type, linkResults);
      if (aiResult && typeof aiResult.trustScore === 'number') {
        let aiBadge = aiResult.badge || badge;
        if (hasInvalidLinks && aiBadge === 'Verified') aiBadge = 'Suspicious';
        return {
          trustScore: aiResult.trustScore,
          badge: aiBadge,
          breakdown: aiResult.breakdown || {
            completeness,
            socialLinks: socialScore,
            bioQuality: bioScore,
            consistency: consistencyScore,
          },
          linkValidation: linkResults.map(l => ({
            label: l.label,
            url: l.url,
            valid: l.valid,
            status: l.status,
            error: l.error,
          })),
          analysis: aiResult.analysis || `AI-verified: Profile ${badge.toLowerCase()}.`,
          flags: aiResult.flags || flags,
          verifiedAt: new Date().toISOString(),
          method: 'ai',
        };
      }
    } catch (e) {
      console.error('OpenAI error, using rule-based:', e.message);
    }
  }

  return {
    trustScore: score,
    badge,
    breakdown: {
      completeness,
      socialLinks: socialScore,
      bioQuality: bioScore,
      consistency: consistencyScore,
    },
    linkValidation: linkResults.map(l => ({
      label: l.label,
      url: l.url,
      valid: l.valid,
      status: l.status,
      error: l.error,
    })),
    analysis: `Profile scored ${score}/100 — ${validLinks.length}/${checkedLinks.length} links verified. ${badge} based on completeness, social links, bio quality, and consistency.`,
    flags,
    verifiedAt: new Date().toISOString(),
    method: 'rule-based',
  };
}

async function callOpenAI(profile, type, linkResults) {
  const isAlumni = type === 'alumni';

  const linkStatusText = linkResults
    .map(l => `  ${l.label}: ${l.url || 'N/A'} — ${l.valid ? 'VALID (HTTP ' + l.status + ')' : l.checked ? 'INVALID (HTTP ' + l.status + ')' : 'NOT PROVIDED'}`)
    .join('\n');

  const studentIdInfo = !isAlumni && profile.studentId
    ? `\nStudent ID: ${profile.studentId} (${profile.studentId.replace(/\D/g, '').length === 11 ? 'VALID - 11 digits' : 'INVALID - ' + profile.studentId.replace(/\D/g, '').length + ' digits'})`
    : '';

  const fields = isAlumni
    ? `Name: ${profile.fullName}\nEmail: ${profile.email}\nDegree: ${profile.degree || 'N/A'}\nGraduation Year: ${profile.graduationYear || 'N/A'}\nLocation: ${profile.currentLocation || 'N/A'}\nOrganization: ${profile.organization || 'N/A'}\nJob Title: ${profile.jobTitle || 'N/A'}\nBio: ${profile.bio || 'N/A'}\nSkills: ${profile.skills || 'N/A'}\nProfile Picture: ${profile.profilePictureUrl ? 'Yes' : 'No'}`
    : `Name: ${profile.fullName}\nEmail: ${profile.email}\nDepartment: ${profile.department || 'N/A'}\nSemester: ${profile.semester || 'N/A'}\nBatch: ${profile.batch || 'N/A'}\nBio: ${profile.bio || 'N/A'}\nSkills: ${profile.skills || 'N/A'}\nProfile Picture: ${profile.profilePictureUrl ? 'Yes' : 'No'}${studentIdInfo}`;

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
          content: 'You analyze university profile authenticity for a Northern University Bangladesh alumni network. You have access to real HTTP link validation results. IMPORTANT: If ANY social link is invalid/unreachable, the badge MUST be "Suspicious" or "Unverified", NEVER "Verified". Respond with JSON only.',
        },
        {
          role: 'user',
          content: `Analyze this ${type} profile for authenticity. Here are the REAL link validation results:\n${linkStatusText}\n\nProfile data:\n${fields}\n\nScore 0-100 trust score. Rules:\n- If any link is INVALID, badge must be "Suspicious" (score < 40) or "Unverified" (score 40-69)\n- Only award "Verified" if ALL links are VALID and score >= 70\n- Student ID must be exactly 11 digits for full marks\n\nRespond JSON: {"trustScore":0-100,"badge":"Verified|Unverified|Suspicious","breakdown":{"completeness":0-25,"socialLinks":0-25,"bioQuality":0-25,"consistency":0-25},"analysis":"1-2 sentence explanation","flags":["any suspicious patterns or empty array"]}`,
        },
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
