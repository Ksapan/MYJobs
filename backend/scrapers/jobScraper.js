import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Clean & normalize text
 */
function cleanText(str) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

/**
 * Scrape Public LinkedIn Jobs in India (No Login Required)
 * Queries LinkedIn guest job search endpoint
 */
export async function scrapeLinkedInIndiaJobs(query = 'Full Stack Developer', location = 'Bengaluru') {
  try {
    const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location + ', India')}&start=0`;

    const res = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 8000
    });

    const $ = cheerio.load(res.data);
    const jobs = [];

    $('li').each((_, el) => {
      const title = cleanText($(el).find('.base-search-card__title').text());
      const employer = cleanText($(el).find('.base-search-card__subtitle').text());
      const loc = cleanText($(el).find('.job-search-card__location').text());
      const link = $(el).find('.base-card__full-link').attr('href') || '';
      const datePosted = $(el).find('time').attr('datetime') || new Date().toISOString();
      const logo = $(el).find('img.artdeco-entity-image').attr('data-delayed-url') || $(el).find('img').attr('src') || '';

      if (title && employer) {
        jobs.push({
          job_id: `li_${Math.random().toString(36).substring(2, 9)}`,
          source: 'LinkedIn India (Scraped)',
          job_title: title,
          employer_name: employer,
          employer_logo: logo,
          job_city: loc || location,
          job_country: 'India',
          job_apply_link: link,
          job_employment_type: 'Full Time',
          job_posted_at_datetime_utc: datePosted,
          job_description: `${title} role at ${employer} in ${loc || location}. Responsibilities include engineering scalable solutions, collaborating with cross-functional product teams, code reviews, and optimizing application performance.`
        });
      }
    });

    return jobs.slice(0, 15);
  } catch (err) {
    console.warn('[Scraper - LinkedIn India] Notice:', err.message);
    return [];
  }
}

/**
 * Scrape Remote / Freelance Tech Jobs (No Login Required)
 */
export async function scrapeFreelanceAndRemoteJobs(query = 'Developer') {
  try {
    // Queries remote freelance & tech openings from public feeds
    const res = await axios.get('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      timeout: 8000
    });

    if (!Array.isArray(res.data)) return [];

    const lowerQuery = query.toLowerCase();
    const jobs = [];

    // Filter jobs relevant to India/Remote tech work
    res.data.slice(1).forEach((item) => {
      const title = item.position || '';
      const tags = (item.tags || []).join(' ').toLowerCase();

      if (
        title.toLowerCase().includes(lowerQuery) ||
        tags.includes(lowerQuery) ||
        lowerQuery.split(' ').some((w) => tags.includes(w))
      ) {
        jobs.push({
          job_id: `rem_${item.id || Math.random().toString(36).substring(2, 9)}`,
          source: 'Remote & Freelance (Direct)',
          job_title: title,
          employer_name: item.company || 'Remote Employer',
          employer_logo: item.company_logo || '',
          job_city: 'Remote (India / Global)',
          job_country: 'India',
          job_apply_link: item.url || item.apply_url || 'https://remoteok.com',
          job_employment_type: item.contract ? 'Freelance / Contract' : 'Full Time Remote',
          job_posted_at_datetime_utc: item.date || new Date().toISOString(),
          job_description: cleanText(item.description || `${title} position at ${item.company}. Remote contract & full-time opportunities.`)
        });
      }
    });

    return jobs.slice(0, 10);
  } catch (err) {
    console.warn('[Scraper - Remote/Freelance] Notice:', err.message);
    return [];
  }
}

