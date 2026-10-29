import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import Job from '../models/Job.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';
import {
  scrapeLinkedInIndia,
  scrapeFreelanceAndRemote,
  scrapeArbeitnowJobs,
  scrapeStartupIndiaJobs
} from '../scrapers/jobScraper.js';

const router = express.Router();

/**
 * 1. GET: FETCH SAVED JOBS FROM DATABASE WITH 10-PER-PAGE PAGINATION
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const { role, location } = req.query;
    const filter = {};

    if (role && role.trim()) {
      filter.$or = [
        { title: { $regex: role.trim(), $options: 'i' } },
        { searchKeywords: { $in: [new RegExp(role.trim(), 'i')] } },
        { description: { $regex: role.trim(), $options: 'i' } }
      ];
    }

    if (location && location.trim() && location.trim().toLowerCase() !== 'india') {
      const locClean = location.split(',')[0].trim();
      filter.location = { $regex: locClean, $options: 'i' };
    }

    const totalJobs = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalJobs / limit) || 1,
      totalJobs,
      data: jobs.map((j) => ({
        job_id: j.jobId,
        job_title: j.title,
        employer_name: j.company,
        employer_logo: j.logo,
        job_city: j.location,
        job_country: j.country,
        job_apply_link: j.applyLink,
        job_employment_type: j.employmentType,
        platformBadge: j.platformBadge || 'ATS Standard',
        job_posted_at_datetime_utc: j.postedDate || j.createdAt,
        job_description: j.description,
        requiredSkills: j.requiredSkills || [],
        source: j.source
      }))
    });
  } catch (error) {
    console.error('Fetch Jobs Error:', error);
    res.status(500).json({ message: 'Failed to retrieve jobs.' });
  }
});

/**
 * 2. GET: ON-DEMAND MULTI-ADAPTER SCRAPER & JSEARCH (Max 30 Jobs per search sync)
 * Merges: LinkedIn India + Freelance/Remote + Arbeitnow + Startup Ecosystem + JSearch
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { location, role, page = '1' } = req.query;
    const targetPage = Math.max(1, parseInt(page) || 1);
    const targetLimit = 10; // View 10 per page

    const user = await User.findById(req.userId);
    const resumeDoc = await ResumeAnalysis.findOne({ userId: req.userId });

    const targetLocation = location || user?.preferredLocation || 'India';

    let targetRole = role;
    if (!targetRole && resumeDoc?.analysis?.metrics?.recommendedKeywords?.length) {
      targetRole = resumeDoc.analysis.metrics.recommendedKeywords[0];
    } else if (!targetRole && resumeDoc?.analysis?.metrics?.suggestedJobRoles?.length) {
      targetRole = resumeDoc.analysis.metrics.suggestedJobRoles[0];
    } else if (!targetRole) {
      targetRole = 'Software Developer';
    }

    const searchQuery = `${targetRole} in ${targetLocation}`;

    // Run all 4 native scraping adapters concurrently
    const [liJobs, freelanceJobs, arbeitnowJobs, startupJobs] = await Promise.all([
      scrapeLinkedInIndia(targetRole, targetLocation),
      scrapeFreelanceAndRemote(targetRole),
      scrapeArbeitnowJobs(targetRole),
      scrapeStartupIndiaJobs(targetRole, targetLocation)
    ]);

    // Query RapidAPI JSearch
    let jsearchJobs = [];
    try {
      const rapidResponse = await axios.get('https://jsearch.p.rapidapi.com/search-v2', {
        params: {
          query: searchQuery,
          num_pages: '1',
          country: 'in',
          date_posted: 'all'
        },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'
        },
        timeout: 10000
      });

      jsearchJobs = (rapidResponse.data?.data || []).slice(0, 10).map((j) => ({
        ...j,
        source: 'JSearch (Google / Indeed / Glassdoor)',
        platformBadge: 'ATS Standard',
        requiredSkills: [targetRole, 'Agile', 'Code Review', 'Cloud Tools']
      }));
    } catch (jSearchErr) {
      console.warn('JSearch API notice:', jSearchErr.message);
    }

    // Merge all adapters and cap at max 30 jobs total
    const combined30Jobs = [
      ...liJobs,
      ...freelanceJobs,
      ...arbeitnowJobs,
      ...startupJobs,
      ...jsearchJobs
    ].slice(0, 30);

    // Upsert into MongoDB
    const bulkOps = combined30Jobs.map((item) => {
      const cleanId = item.job_id || `${item.job_title}_${item.employer_name}`.replace(/[^a-zA-Z0-9]/g, '_');
      return {
        updateOne: {
          filter: { jobId: cleanId },
          update: {
            $set: {
              jobId: cleanId,
              title: item.job_title,
              company: item.employer_name,
              logo: item.employer_logo || '',
              location: item.job_city || targetLocation,
              country: item.job_country || 'India',
              employmentType: item.job_employment_type || 'Full Time',
              platformBadge: item.platformBadge || 'ATS Standard',
              description: item.job_description || '',
              applyLink: item.job_apply_link || '',
              source: item.source || 'Scraper',
              requiredSkills: item.requiredSkills || [targetRole],
              postedDate: item.job_posted_at_datetime_utc ? new Date(item.job_posted_at_datetime_utc) : new Date(),
              searchKeywords: [targetRole.toLowerCase(), targetLocation.toLowerCase()]
            }
          },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      await Job.bulkWrite(bulkOps).catch((e) => console.warn('BulkWrite note:', e.message));
    }

    // Return the latest 10 jobs for Page 1 (out of up to 30)
    const filter = {
      $or: [
        { title: { $regex: targetRole, $options: 'i' } },
        { searchKeywords: { $in: [new RegExp(targetRole, 'i')] } }
      ]
    };

    const totalJobs = await Job.countDocuments(filter);
    const skip = (targetPage - 1) * targetLimit;

    const pageResults = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(targetLimit)
      .lean();

    res.json({
      success: true,
      queryUsed: searchQuery,
      targetRole,
      targetLocation,
      page: targetPage,
      limit: targetLimit,
      totalPages: Math.ceil(totalJobs / targetLimit) || 1,
      totalJobs,
      syncedCount: combined30Jobs.length,
      data: pageResults.map((j) => ({
        job_id: j.jobId,
        job_title: j.title,
        employer_name: j.company,
        employer_logo: j.logo,
        job_city: j.location,
        job_country: j.country,
        job_apply_link: j.applyLink,
        job_employment_type: j.employmentType,
        platformBadge: j.platformBadge || 'ATS Standard',
        job_posted_at_datetime_utc: j.postedDate || j.createdAt,
        job_description: j.description,
        requiredSkills: j.requiredSkills || [],
        source: j.source
      }))
    });
  } catch (error) {
    console.error('Multi-adapter search error:', error.message);
    res.status(500).json({ message: 'Search failed.', details: error.message });
  }
});

export default router;
