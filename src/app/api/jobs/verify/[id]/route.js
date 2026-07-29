import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'NUB-Bridge-Bot/1.0' }
    });
    clearTimeout(timeout);
    return { valid: res.ok, status: res.status };
  } catch (e) {
    return { valid: false, status: 0, error: e.message };
  }
}

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function analyzeJob(job) {
  const flags = [];
  const breakdown = {};

  const desc = (job.description || '').trim();
  const req = (job.requirements || '').trim();
  const skills = job.skills || [];
  const descWords = wordCount(desc);
  const reqWords = wordCount(req);

  // --- Completeness (0-25) ---
  // Score each field individually with partial credit
  let comp = 0;
  if (job.title && job.title.trim().length > 0) comp += 3;
  if (job.title && job.title.trim().length > 10) comp += 1;
  if (job.company && job.company.trim().length > 0) comp += 3;
  if (job.location && job.location.trim().length > 0) comp += 2;
  if (job.salary && job.salary.trim().length > 0) comp += 2;
  if (job.applicationUrlOrEmail && job.applicationUrlOrEmail.trim().length > 0) comp += 3;
  if (job.applicationDeadline) comp += 2;
  if (desc.length > 0) comp += 2;
  if (desc.length > 50) comp += 1;
  if (desc.length > 200) comp += 1;
  if (skills.length > 0) comp += 2;
  if (skills.length >= 3) comp += 1;
  if (req.length > 0) comp += 2;
  if (job.workplaceType && job.workplaceType !== 'On-site') comp += 1;
  comp = Math.min(25, comp);
  breakdown.completeness = comp;

  if (comp < 10) flags.push('Job posting is missing many essential fields');
  else if (comp < 15) flags.push('Job posting could be more complete');

  // --- Content Quality (0-25) ---
  let qual = 0;
  if (descWords > 0) qual += 2;
  if (descWords > 30) qual += 3;
  if (descWords > 80) qual += 4;
  if (descWords > 150) qual += 3;
  if (descWords > 300) qual += 2;
  if (descWords > 500) qual += 1;
  if (desc.includes('\n') || desc.includes('•') || desc.includes('-')) qual += 2;
  if (reqWords > 0) qual += 2;
  if (reqWords > 20) qual += 2;
  if (reqWords > 50) qual += 2;
  qual = Math.min(25, qual);
  breakdown.quality = qual;

  if (descWords < 10) flags.push('Job description is too short to be informative');
  if (descWords > 1000) flags.push('Job description is unusually long');
  if (reqWords < 5 && req.length > 0) flags.push('Requirements are very brief');
  if (!desc) flags.push('No job description provided');
  if (!req) flags.push('No qualifications listed');

  // --- Consistency & Legitimacy (0-25) ---
  let cons = 12;
  if (job.title && job.title.length >= 5) cons += 2;
  if (job.title && job.title.length <= 80) cons += 1;
  if (job.company && job.company.length >= 2) cons += 1;
  if (job.company && job.company.length <= 60) cons += 1;
  if (skills.length > 0 && skills.length <= 15) cons += 2;
  if (skills.length > 0 && skills.length <= 8) cons += 1;
  if (job.postedBy && job.postedBy !== 'Anonymous' && job.postedBy !== 'Anonymous Alumni') cons += 3;
  if (job.salary && /\d/.test(job.salary)) cons += 2;
  if (desc.toLowerCase().includes(job.title?.toLowerCase() || '')) cons += 1;
  cons = Math.min(25, cons);
  breakdown.consistency = cons;

  if (job.title && job.title.length > 80) flags.push('Job title is unusually long');
  if (job.company && job.company.length > 60) flags.push('Company name is unusually long');
  if (skills.length > 15) flags.push('Too many skills listed — may be keyword stuffing');
  if (job.postedBy === 'Anonymous' || job.postedBy === 'Anonymous Alumni') flags.push('Poster identity is anonymous');

  // --- Freshness & Deadline (0-25) ---
  let fresh = 12;
  if (job.createdAt) {
    const ageDays = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 1) fresh += 5;
    else if (ageDays <= 3) fresh += 4;
    else if (ageDays <= 7) fresh += 3;
    else if (ageDays <= 14) fresh += 2;
    else if (ageDays <= 30) fresh += 1;
    else if (ageDays > 90) fresh -= 5;
  }
  if (job.applicationDeadline) {
    const deadline = new Date(job.applicationDeadline);
    const now = new Date();
    const daysLeft = (deadline - now) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) {
      fresh -= 10;
      flags.push('Application deadline has passed');
    } else if (daysLeft < 3) {
      fresh += 2;
      flags.push('Deadline is very soon');
    } else if (daysLeft <= 30) {
      fresh += 3;
    } else if (daysLeft <= 90) {
      fresh += 1;
    } else if (daysLeft > 365) {
      fresh -= 3;
    }
  } else {
    fresh -= 5;
    flags.push('No application deadline set');
  }
  fresh = Math.max(0, Math.min(25, fresh));
  breakdown.freshness = fresh;

  const total = comp + qual + cons + fresh;

  let badge;
  if (total >= 70) badge = 'Verified';
  else if (total >= 40) badge = 'Unverified';
  else badge = 'Suspicious';

  return {
    trustScore: Math.min(100, total),
    badge,
    breakdown,
    flags,
  };
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid job ID." }, { status: 400 });
    }

    const collection = await getCollection('jobs');
    const job = await collection.findOne({ _id: new ObjectId(id) });

    if (!job) {
      return NextResponse.json({ message: "Job not found." }, { status: 404 });
    }

    let linkStatus = 'missing';
    let linkDetail = '';

    if (job.applicationUrlOrEmail && job.applicationUrlOrEmail.trim()) {
      const val = job.applicationUrlOrEmail.trim();
      const isUrl = val.startsWith('http://') || val.startsWith('https://');
      if (isUrl) {
        const check = await checkUrl(val);
        linkStatus = check.valid ? 'valid' : 'invalid';
        linkDetail = check.valid ? `Accessible (HTTP ${check.status})` : `Not reachable (HTTP ${check.status || 'timeout'})`;
      } else {
        linkStatus = 'email';
        linkDetail = 'Email address provided';
      }
    }

    const analysis = analyzeJob(job);

    let linkBonus = 0;
    if (linkStatus === 'valid') linkBonus = 8;
    else if (linkStatus === 'invalid') linkBonus = -20;
    else if (linkStatus === 'email') linkBonus = 2;
    else linkBonus = -10;

    const finalScore = Math.max(0, Math.min(100, analysis.trustScore + linkBonus));

    let finalBadge;
    if (finalScore >= 70) finalBadge = 'Verified';
    else if (finalScore >= 40) finalBadge = 'Unverified';
    else finalBadge = 'Suspicious';

    if (linkStatus === 'invalid') analysis.flags.push('Application link is not reachable');
    if (linkStatus === 'missing') analysis.flags.push('No application link provided');
    if (linkStatus === 'valid') analysis.flags.push('Application link is accessible');

    const verification = {
      trustScore: finalScore,
      badge: finalBadge,
      breakdown: analysis.breakdown,
      linkStatus,
      linkDetail,
      analysis: `Job scored ${finalScore}/100 — ${linkStatus === 'valid' ? 'link verified' : linkStatus === 'invalid' ? 'link unreachable' : linkStatus === 'email' ? 'email provided' : 'no link'}. ${finalBadge} based on completeness, content quality, legitimacy, and freshness.`,
      flags: analysis.flags,
      verifiedAt: new Date().toISOString(),
    };

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { verification, updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ message: "Job verified", verification });
  } catch (error) {
    console.error("Job verification error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
