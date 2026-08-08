const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function getPlatformFromUrl(url) {
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('github.com')) return 'github';
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  return 'unknown';
}

function extractUsernameFromUrl(url) {
  try {
    var parsed = new URL(url);
    var path = parsed.pathname;

    var linkedinMatch = path.match(/\/in\/([^\/\?]+)/);
    if (linkedinMatch) return { platform: 'linkedin', username: linkedinMatch[1] };

    var pubMatch = path.match(/\/pub\/([^\/\?]+)/);
    if (pubMatch) return { platform: 'linkedin', username: pubMatch[1] };

    var githubMatch = path.match(/^\/([^\/\?]+)\/?$/);
    if (githubMatch) return { platform: 'github', username: githubMatch[1] };

    var fbMatch = path.match(/^\/([^\/\?]+)\/?$/);
    if (fbMatch) return { platform: 'facebook', username: fbMatch[1] };

    var twMatch = path.match(/^\/([^\/\?]+)\/?$/);
    if (twMatch) return { platform: 'twitter', username: twMatch[1] };

    return { platform: 'unknown', username: null };
  } catch (e) {
    return { platform: 'unknown', username: null };
  }
}

function normalizeForComparison(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[._]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function usernameMatchesProfileName(username, fullName) {
  if (!username || !fullName) return { match: false, confidence: 0 };

  var cleanUsername = normalizeForComparison(username.replace(/[-_]/g, ' '));
  var cleanName = normalizeForComparison(fullName);
  var nameParts = cleanName.split(' ').filter(function(p) { return p.length >= 2; });

  if (!cleanUsername || nameParts.length === 0) return { match: false, confidence: 0 };

  if (cleanUsername === cleanName) return { match: true, confidence: 100 };
  if (cleanUsername === nameParts.join('')) return { match: true, confidence: 95 };

  var fullNameNoSpace = nameParts.join('');
  var reversedParts = nameParts.slice().reverse().join('');
  if (cleanUsername === fullNameNoSpace) return { match: true, confidence: 95 };
  if (cleanUsername === reversedParts) return { match: true, confidence: 90 };
  if (cleanUsername === reversedParts.replace(/\s/g, '')) return { match: true, confidence: 90 };

  var matches = 0;
  for (var i = 0; i < nameParts.length; i++) {
    if (cleanUsername.includes(nameParts[i])) matches++;
  }
  var matchRatio = matches / nameParts.length;

  if (matchRatio >= 0.5) return { match: true, confidence: Math.round(matchRatio * 80) };

  for (var j = 0; j < nameParts.length; j++) {
    if (cleanUsername === nameParts[j]) return { match: true, confidence: 60 };
  }

  var usernameNoDigits = cleanUsername.replace(/[0-9]/g, '');
  for (var k = 0; k < nameParts.length; k++) {
    if (nameParts[k].length >= 4 && usernameNoDigits === nameParts[k]) {
      return { match: true, confidence: 55 };
    }
  }

  for (var m = 0; m < nameParts.length; m++) {
    if (nameParts[m].length >= 5 && usernameNoDigits.startsWith(nameParts[m])) {
      return { match: true, confidence: 50 };
    }
  }

  return { match: false, confidence: Math.round(matchRatio * 40) };
}

function extractPageInfo(html) {
  if (!html) return {};
  var info = {};

  var titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) info.pageTitle = titleMatch[1].trim();

  var ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (ogTitle) info.ogTitle = ogTitle[1].trim();

  var ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  if (ogDesc) info.ogDescription = ogDesc[1].trim();

  var descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  if (descMatch) info.description = descMatch[1].trim();

  var githubName = html.match(/itemprop="name"[^>]*>([^<]+)/i)
    || html.match(/class="[^"]*p-name[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<span[^>]*class="[^"]*fn[^"]*"[^>]*>([^<]+)/i);
  if (githubName) info.profileName = githubName[1].trim();

  var bodyText = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 3000);
  info.bodyPreview = bodyText;

  return info;
}

async function fetchPageContent(url) {
  try {
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 12000);
    var res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: BROWSER_HEADERS,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, status: res.status, content: '', error: 'HTTP ' + res.status };
    }

    var contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { ok: true, status: res.status, content: '', contentType: contentType };
    }

    var arrayBuffer = await res.arrayBuffer();
    var bytes = new Uint8Array(arrayBuffer).slice(0, 8000);
    var text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return { ok: true, status: res.status, content: text, contentType: contentType };
  } catch (e) {
    return { ok: false, status: 0, content: '', error: e.message };
  }
}

var BLOCKED_PLATFORMS = ['linkedin', 'facebook', 'twitter'];

function isBlockedByPlatform(platform, status) {
  if (platform === 'linkedin' && (status === 999 || status === 0)) return true;
  if (platform === 'facebook' && (status === 400 || status === 403 || status === 0)) return true;
  if (platform === 'twitter' && (status === 403 || status === 0)) return true;
  return false;
}

async function checkUrl(url) {
  var platform = getPlatformFromUrl(url);
  var urlInfo = extractUsernameFromUrl(url);

  if (!url.startsWith('http')) {
    return { valid: false, status: 0, error: 'Invalid URL', platform: platform, username: null, content: '' };
  }

  var page = await fetchPageContent(url);

  if (!page.ok && isBlockedByPlatform(platform, page.status)) {
    return {
      valid: false,
      status: page.status || 0,
      platform: platform,
      username: urlInfo.username,
      content: '',
      error: platform.charAt(0).toUpperCase() + platform.slice(1) + ' blocks automated access',
      needsNameCheck: true,
    };
  }

  return {
    valid: page.ok,
    status: page.status,
    platform: platform,
    username: urlInfo.username,
    content: page.content || '',
    error: page.error || null,
    needsNameCheck: false,
  };
}

function validateStudentId(studentId) {
  if (!studentId || typeof studentId !== 'string') return { valid: false, length: 0 };
  var digits = studentId.replace(/\D/g, '');
  return { valid: digits.length === 11, length: digits.length };
}

function nameAppearsInContent(fullName, pageInfo, content) {
  var nameLower = normalizeForComparison(fullName);
  var nameParts = nameLower.split(' ').filter(function(p) { return p.length >= 2; });
  if (nameParts.length === 0) return false;

  var sources = [
    pageInfo.pageTitle,
    pageInfo.ogTitle,
    pageInfo.description,
    pageInfo.ogDescription,
    pageInfo.profileName,
    pageInfo.bodyPreview,
  ].filter(Boolean).join(' ').toLowerCase();

  if (sources.includes(nameLower)) return true;

  var matched = 0;
  for (var i = 0; i < nameParts.length; i++) {
    if (sources.includes(nameParts[i])) matched++;
  }
  return matched >= Math.ceil(nameParts.length * 0.5);
}

export async function analyzeProfile(profile, type) {
  var flags = [];
  var score = 0;
  var isAlumni = type === 'alumni';

  var requiredFields = isAlumni
    ? ['fullName', 'email', 'degree', 'graduationYear', 'currentLocation', 'jobTitle', 'organization', 'bio', 'skills']
    : ['fullName', 'email', 'studentId', 'department', 'semester', 'batch', 'bio', 'skills'];

  var filledRequired = requiredFields.filter(function(f) {
    var val = profile[f];
    return val && String(val).trim().length > 0;
  });
  var completeness = Math.round((filledRequired.length / requiredFields.length) * 25);
  score += completeness;
  if (completeness < 15) flags.push('Profile is missing many required fields');

  var linksToCheck = isAlumni
    ? [
        { key: 'linkedin', url: profile.linkedinUrl, label: 'LinkedIn' },
        { key: 'facebook', url: profile.facebookUrl, label: 'Facebook' },
        { key: 'twitter', url: profile.twitterUrl, label: 'Twitter/X' },
      ]
    : [
        { key: 'linkedin', url: profile.linkedinUrl, label: 'LinkedIn' },
        { key: 'github', url: profile.githubUrl, label: 'GitHub' },
      ];

  var linkResults = await Promise.all(
    linksToCheck.map(async function(item) {
      var key = item.key;
      var url = item.url;
      var label = item.label;

      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return {
          key: key, url: url || '', label: label, valid: false, status: 0,
          error: 'missing', checked: false, content: '', platform: key,
          username: null, pageInfo: {}, needsNameCheck: false,
        };
      }

      var result = await checkUrl(url);
      var pageInfo = extractPageInfo(result.content);
      var nameInPage = nameAppearsInContent(profile.fullName, pageInfo, result.content);

      var usernameCheck = { match: false, confidence: 0 };
      if (result.username) {
        usernameCheck = usernameMatchesProfileName(result.username, profile.fullName);
      }

      var isValid = result.valid;
      var error = result.error;

      if (result.needsNameCheck) {
        if (result.username && usernameCheck.match && usernameCheck.confidence >= 50) {
          isValid = true;
          error = null;
        } else if (result.username) {
          isValid = false;
          error = 'URL username "' + result.username + '" does not match profile name "' + profile.fullName + '"';
        } else {
          isValid = false;
          error = 'Could not verify - platform blocks automated access and no username found';
        }
      }

      if (isValid && result.content && result.content.length > 100 && !nameInPage && !result.username) {
        isValid = false;
        error = 'Page exists but does not contain the name "' + profile.fullName + '"';
      }

      return {
        key: key, url: url, label: label, valid: isValid, status: result.status,
        error: error || (!isValid ? 'HTTP ' + result.status : null),
        checked: true, platform: result.platform, username: result.username,
        content: result.content || '', pageInfo: pageInfo,
        needsNameCheck: result.needsNameCheck, nameMatch: nameInPage,
        usernameCheck: usernameCheck,
      };
    })
  );

  var checkedLinks = linkResults.filter(function(l) { return l.checked; });
  var validLinks = linkResults.filter(function(l) { return l.valid; });
  var invalidLinks = linkResults.filter(function(l) { return l.checked && !l.valid; });
  var missingLinks = linkResults.filter(function(l) { return !l.checked; });

  var socialScore = 0;
  if (checkedLinks.length > 0) {
    socialScore = Math.round((validLinks.length / checkedLinks.length) * 25);
  }
  if (invalidLinks.length > 0) {
    socialScore = Math.max(0, socialScore - invalidLinks.length * 10);
  }
  if (missingLinks.length > 0 && invalidLinks.length === 0) {
    socialScore = Math.max(0, socialScore - missingLinks.length * 5);
  }
  score += socialScore;

  for (var i = 0; i < invalidLinks.length; i++) {
    flags.push(invalidLinks[i].label + ' link is invalid: ' + invalidLinks[i].error);
  }
  for (var j = 0; j < linkResults.length; j++) {
    var lr = linkResults[j];
    if (lr.checked && lr.valid && !lr.nameMatch && !lr.needsNameCheck) {
      flags.push(lr.label + ' page exists but name could not be confirmed');
    }
  }
  if (validLinks.length === checkedLinks.length && checkedLinks.length > 0) {
    flags.push('All social links verified and accessible');
  }
  if (missingLinks.length > 0) {
    flags.push(missingLinks.length + ' social link(s) not provided');
  }

  var idScoreBonus = 0;
  if (!isAlumni) {
    var idValidation = validateStudentId(profile.studentId);
    if (idValidation.valid) {
      idScoreBonus = 5;
      flags.push('Student ID verified (11 digits)');
    } else if (profile.studentId) {
      idScoreBonus = -5;
      flags.push('Student ID is ' + idValidation.length + ' digits (expected 11)');
    } else {
      idScoreBonus = -3;
      flags.push('No student ID provided');
    }
    score += idScoreBonus;
  }

  var bio = profile.bio || '';
  var bioScore = 0;
  if (bio.length > 150) bioScore = 25;
  else if (bio.length > 100) bioScore = 22;
  else if (bio.length > 50) bioScore = 16;
  else if (bio.length > 20) bioScore = 10;
  else if (bio.length > 0) bioScore = 5;
  score += bioScore;
  if (bioScore < 12) flags.push('Bio is too short or missing');

  var consistencyScore = 25;
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

  var hasInvalidLinks = invalidLinks.length > 0;
  var badge;
  if (score >= 70 && !hasInvalidLinks) badge = 'Verified';
  else if (score < 40 || hasInvalidLinks) badge = 'Suspicious';
  else badge = 'Unverified';

  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      var aiResult = await callOpenAI(profile, type, linkResults);
      if (aiResult && typeof aiResult.trustScore === 'number') {
        var aiBadge = aiResult.badge || badge;
        if (hasInvalidLinks && aiBadge === 'Verified') aiBadge = 'Suspicious';
        return {
          trustScore: aiResult.trustScore,
          badge: aiBadge,
          breakdown: aiResult.breakdown || { completeness: completeness, socialLinks: socialScore, bioQuality: bioScore, consistency: consistencyScore },
          linkValidation: linkResults.map(function(l) {
            return { label: l.label, url: l.url, valid: l.valid, status: l.status, error: l.error };
          }),
          analysis: aiResult.analysis || 'AI-verified: Profile ' + badge.toLowerCase() + '.',
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
    badge: badge,
    breakdown: { completeness: completeness, socialLinks: socialScore, bioQuality: bioScore, consistency: consistencyScore },
    linkValidation: linkResults.map(function(l) {
      return { label: l.label, url: l.url, valid: l.valid, status: l.status, error: l.error };
    }),
    analysis: 'Profile scored ' + score + '/100 - ' + validLinks.length + '/' + checkedLinks.length + ' links verified. ' + badge + '.',
    flags: flags,
    verifiedAt: new Date().toISOString(),
    method: 'rule-based',
  };
}

async function callOpenAI(profile, type, linkResults) {
  var isAlumni = type === 'alumni';

  var linkDetails = linkResults.map(function(l) {
    var parts = ['  ' + l.label + ': ' + (l.url || 'N/A')];
    if (l.checked) {
      parts.push('    HTTP Status: ' + (l.status || 'N/A') + (l.valid ? ' (reachable)' : ' (unreachable)'));
      if (l.username) {
        parts.push('    URL Username: ' + l.username);
        if (l.usernameCheck) {
          parts.push('    Username Match: ' + (l.usernameCheck.match ? 'YES (confidence: ' + l.usernameCheck.confidence + '%)' : 'NO'));
        }
      }
      if (l.pageInfo && l.pageInfo.pageTitle) parts.push('    Page Title: ' + l.pageInfo.pageTitle);
      if (l.pageInfo && l.pageInfo.ogTitle) parts.push('    OG Title: ' + l.pageInfo.ogTitle);
      if (l.pageInfo && l.pageInfo.description) parts.push('    Description: ' + l.pageInfo.description.slice(0, 200));
      if (l.pageInfo && l.pageInfo.ogDescription) parts.push('    OG Description: ' + l.pageInfo.ogDescription.slice(0, 200));
      if (l.pageInfo && l.pageInfo.profileName) parts.push('    Profile Name on Page: ' + l.pageInfo.profileName);
      if (l.nameMatch) parts.push('    Profile Name Found on Page: YES');
      if (l.error) parts.push('    Error: ' + l.error);
      if (l.content && l.content.length > 50) {
        var cleanContent = l.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1000);
        parts.push('    Page Content: ' + cleanContent);
      }
    } else {
      parts.push('    Status: NOT PROVIDED');
    }
    return parts.join('\n');
  }).join('\n');

  var studentIdInfo = '';
  if (!isAlumni && profile.studentId) {
    var digitCount = profile.studentId.replace(/\D/g, '').length;
    studentIdInfo = '\nStudent ID: ' + profile.studentId + ' (' + (digitCount === 11 ? 'VALID - 11 digits' : 'INVALID - ' + digitCount + ' digits') + ')';
  }

  var fields;
  if (isAlumni) {
    fields = 'Name: ' + profile.fullName + '\nEmail: ' + profile.email + '\nDegree: ' + (profile.degree || 'N/A') + '\nGraduation Year: ' + (profile.graduationYear || 'N/A') + '\nLocation: ' + (profile.currentLocation || 'N/A') + '\nOrganization: ' + (profile.organization || 'N/A') + '\nJob Title: ' + (profile.jobTitle || 'N/A') + '\nBio: ' + (profile.bio || 'N/A') + '\nSkills: ' + (profile.skills || 'N/A');
  } else {
    fields = 'Name: ' + profile.fullName + '\nEmail: ' + profile.email + '\nDepartment: ' + (profile.department || 'N/A') + '\nSemester: ' + (profile.semester || 'N/A') + '\nBatch: ' + (profile.batch || 'N/A') + '\nBio: ' + (profile.bio || 'N/A') + '\nSkills: ' + (profile.skills || 'N/A') + studentIdInfo;
  }

  var response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You verify profile authenticity for a university alumni network. You receive profile data and real link validation results including page titles, descriptions, usernames extracted from URLs, and scraped page content. YOUR JOB: For each social link, determine if it ACTUALLY BELONGS to the profile owner. DO THIS BY: 1) Check if the URL username matches the profile name. 2) Check page titles and descriptions for the profile name. 3) Check the scraped page content for the profile name. 4) If a link returns 404/403 -> INVALID. 5) If a link is blocked (999) -> judge by URL username only. 6) If the page shows a DIFFERENT person name -> INVALID. CRITICAL: A link that loads fine but belongs to someone ELSE is STILL INVALID. If ANY link is invalid, badge MUST be Suspicious or Unverified.'
        },
        {
          role: 'user',
          content: 'Verify this ' + type + ' profile:\n\nPROFILE:\n' + fields + '\n\nLINKS:\n' + linkDetails + '\n\nDoes each link belong to this person? Respond JSON: {"trustScore":0-100,"badge":"Verified|Unverified|Suspicious","breakdown":{"completeness":0-25,"socialLinks":0-25,"bioQuality":0-25,"consistency":0-25},"analysis":"explanation","flags":["issues found"]}',
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) throw new Error('OpenAI ' + response.status);
  var data = await response.json();
  var content = data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error('Empty response');
  content = content.trim();
  var match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON');
  return JSON.parse(match[0]);
}
