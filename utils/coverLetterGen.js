function extractJobTitle(jd) {
  const patterns = [
    /(?:hiring|seeking|looking for|for a|role[:\s]+)\s+([A-Z][a-zA-Z\s]+?(?:Engineer|Developer|Designer|Scientist|Manager|Analyst|Architect|Lead|Director))/,
    /^([A-Z][a-zA-Z\s]+?(?:Engineer|Developer|Designer|Scientist|Manager|Analyst|Architect|Lead|Director))/m,
  ];
  for (const re of patterns) {
    const m = jd.match(re);
    if (m) return m[1].trim();
  }
  return 'Software Engineer';
}

function extractCompany(jd) {
  const patterns = [
    /join\s+([A-Z][a-zA-Z0-9\s&.']+?)(?:\s+as|\s+team|\s+is|\.|,)/,
    /([A-Z][a-zA-Z0-9\s&.']+?)\s+is\s+(?:looking|hiring|seeking)/,
    /about\s+([A-Z][a-zA-Z0-9\s&.']+?)(?:\s*[\n:])/,
  ];
  for (const re of patterns) {
    const m = jd.match(re);
    if (m) {
      const c = m[1].trim().replace(/[.,]+$/, '');
      if (c.length > 2 && c.length < 50) return c;
    }
  }
  return '';
}

function generate({ resumeText, jobText, candidateName, presentSkills = [] }) {
  const title = extractJobTitle(jobText);
  const company = extractCompany(jobText);
  const atCompany = company ? ` at ${company}` : '';
  const name = candidateName || '';

  const yearsMatch = resumeText.match(/(\d+)\+?\s*years?/i);
  const yearsStr = yearsMatch ? `${yearsMatch[1]}+ years of` : 'several years of';

  const top = presentSkills.slice(0, 4);
  const skillsPhrase =
    top.length === 0 ? 'modern software engineering tools and best practices' :
    top.length === 1 ? top[0] :
    top.length === 2 ? `${top[0]} and ${top[1]}` :
    `${top.slice(0, -1).join(', ')}, and ${top[top.length - 1]}`;

  const opening =
    `I am writing to express my strong interest in the ${title} position${atCompany}. ` +
    `With ${yearsStr} professional experience, I am confident that my technical ` +
    `background and problem-solving approach are an excellent fit for this opportunity.`;

  const body1 =
    `My hands-on expertise with ${skillsPhrase} directly aligns with the core requirements ` +
    `outlined in your job description. I have applied these technologies to build scalable, ` +
    `maintainable solutions that meet real business needs — consistently collaborating with ` +
    `cross-functional teams to ship reliable, production-grade software.`;

  const body2 =
    `I am particularly drawn to this role because it combines technical depth with meaningful ` +
    `impact. I thrive in environments that value clean code, continuous learning, and thoughtful ` +
    `engineering decisions. I adapt quickly to new tools and enjoy contributing to documentation, ` +
    `code reviews, and team processes alongside feature work.`;

  const closing =
    `I would welcome the opportunity to discuss how my background can contribute to your team's ` +
    `continued success. Thank you for considering my application, and I look forward to speaking with you.`;

  const signOff = name ? `Sincerely,\n${name}` : 'Sincerely,';

  return [opening, body1, body2, closing, signOff].join('\n\n');
}

module.exports = { generate };
