const { ALL_SKILLS } = require('./skillsDb');

const STOP_WORDS = new Set([
  'the','and','for','are','with','this','that','have','from','they',
  'will','been','has','had','but','not','what','all','were','when',
  'there','their','which','one','you','can','her','was','our','out',
  'use','your','how','each','she','his','may','who','did','its','let',
  'new','over','also','into','than','then','some','them','any','two',
  'these','would','make','like','him','time','just','know','take',
  'year','good','little','world','very','still','should','through',
  'most','more','able','want','work','well','first','such','same',
  'about','after','being',
]);

function extractSkills(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const skill of ALL_SKILLS) {
    // word-boundary check: no alphanumeric immediately before or after
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
    if (re.test(lower)) found.add(skill);
  }
  return found;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function tfidfSimilarity(text1, text2) {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  if (!words1.length || !words2.length) return 0;

  const tf = (words) => {
    const freq = {};
    words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    return freq;
  };

  const tf1 = tf(words1);
  const tf2 = tf(words2);
  const vocab = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);

  let dot = 0, mag1 = 0, mag2 = 0;
  for (const w of vocab) {
    const df = (tf1[w] ? 1 : 0) + (tf2[w] ? 1 : 0);
    const idf = Math.log(3 / (df + 1)) + 1; // N=2 docs, smoothed
    const v1 = ((tf1[w] || 0) / words1.length) * idf;
    const v2 = ((tf2[w] || 0) / words2.length) * idf;
    dot += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }
  if (!mag1 || !mag2) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

function buildExplanation(pct, verdict, present, missing) {
  const topPresent = [...present].slice(0, 3);
  const topMissing = [...missing].slice(0, 3);

  const strengthStr = topPresent.length
    ? topPresent.slice(0, -1).join(', ') + (topPresent.length > 1 ? ` and ${topPresent[topPresent.length - 1]}` : topPresent[0])
    : 'general experience';

  const gapClause = topMissing.length
    ? ` Missing skills: ${topMissing.join(', ')} — consider adding these to close the gap.`
    : ' Their skill set covers all key requirements well.';

  return `${verdict} (${pct}% match). Strong expertise in ${strengthStr} aligns with the role.${gapClause}`;
}

function buildSuggestions(missing) {
  const tips = {
    docker: 'Learn Docker by containerising a personal project — free docs at docs.docker.com',
    kubernetes: 'Take the free CNCF Introduction to Kubernetes course on edX',
    aws: 'Start with AWS Free Tier and complete the AWS Cloud Practitioner Essentials',
    azure: 'Explore Azure free sandbox environments on Microsoft Learn',
    'machine learning': 'Work through fast.ai free Practical Deep Learning course',
    typescript: 'Add TypeScript to an existing JavaScript project — official handbook is free',
    graphql: 'Build a small GraphQL API using Apollo Server getting-started guide',
    terraform: 'Try HashiCorp Learn (free) to build your first Terraform configuration',
    'ci/cd': 'Set up GitHub Actions for a public repo — free and well-documented',
  };
  return [...missing].slice(0, 5).map(
    (skill) => tips[skill] || `Add ${skill} to your skill set via a small practice project`
  );
}

function analyzeMatch(resumeText, jobText) {
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jobText);

  const present = new Set([...resumeSkills].filter((s) => jdSkills.has(s)));
  const missing = new Set([...jdSkills].filter((s) => !resumeSkills.has(s)));

  const skillScore = jdSkills.size ? present.size / jdSkills.size : 0.5;
  const semantic = tfidfSimilarity(resumeText, jobText);
  const raw = skillScore * 0.65 + semantic * 0.35;
  const pct = Math.max(5, Math.min(97, Math.round(raw * 100)));

  const verdict =
    pct >= 75 ? 'Strong Match' :
    pct >= 55 ? 'Good Match' :
    pct >= 35 ? 'Partial Match' : 'Weak Match';

  const strengths = [];
  if (present.size) strengths.push(`Proficient in ${[...present].slice(0, 5).join(', ')}`);
  if (/\d+\+?\s*years?/i.test(resumeText)) {
    const m = resumeText.match(/(\d+)\+?\s*years?/i);
    if (m) strengths.push(`${m[1]}+ years of hands-on experience`);
  }
  if (/led|managed|mentored|architected/i.test(resumeText))
    strengths.push('Demonstrated leadership and senior-level ownership');
  if (/deployed|shipped|launched|production/i.test(resumeText))
    strengths.push('Track record of shipping production-ready work');

  return {
    match_percentage: pct,
    overall_verdict: verdict,
    explanation: buildExplanation(pct, verdict, present, missing),
    present_skills: [...present].sort(),
    missing_skills: [...missing].sort(),
    strengths: strengths.slice(0, 4),
    improvement_suggestions: buildSuggestions(missing),
  };
}

module.exports = { analyzeMatch };
