import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';
import { scrapeLinkedInIndiaJobs, scrapeFreelanceAndRemoteJobs } from '../scrapers/jobScraper.js';

const router = express.Router();

// GET: Unified Job Search combining RapidAPI JSearch + Native India Scraper
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { location, role, page = '1', mode = 'all' } = req.query;

    const user = await User.findById(req.userId);
    const resumeDoc = await ResumeAnalysis.findOne({ userId: req.userId });

    const targetLocation = location || user?.preferredLocation || 'India';

    let targetRole = role;
    if (!targetRole && resumeDoc?.analysis?.recommendedSearchKeywords?.length) {
      targetRole = resumeDoc.analysis.recommendedSearchKeywords[0];
    } else if (!targetRole && resumeDoc?.analysis?.suggestedJobRoles?.length) {
      targetRole = resumeDoc.analysis.suggestedJobRoles[0];
    } else if (!targetRole) {
      targetRole = 'Software Developer';
    }

    const searchQuery = `${targetRole} in ${targetLocation}`;

    // 1. Fetch from our own Native Scrapers in parallel (LinkedIn India + Remote/Freelance)
    const [scrapedLinkedInJobs, scrapedFreelanceJobs] = await Promise.all([
      scrapeLinkedInIndiaJobs(targetRole, targetLocation),
      scrapeFreelanceAndRemoteJobs(targetRole)
    ]);

    // 2. Fetch from RapidAPI JSearch
    let jsearchJobs = [];
    try {
      const rapidResponse = await axios.get('https://jsearch.p.rapidapi.com/search-v2', {
        params: {
          query: searchQuery,
          num_pages: page,
          country: 'in',
          date_posted: 'all'
        },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'
        },
        timeout: 10000
      });
      jsearchJobs = (rapidResponse.data?.data || []).map((j) => ({
        ...j,
        source: 'JSearch (Google/Indeed)'
      }));
    } catch (jSearchErr) {
      console.warn('JSearch API notice:', jSearchErr.message);
    }

    // Merge and prioritize results
    const combinedJobs = [
      ...scrapedLinkedInJobs,
      ...scrapedFreelanceJobs,
      ...jsearchJobs
    ];

    res.json({
      queryUsed: searchQuery,
      targetRole,
      targetLocation,
      count: combinedJobs.length,
      data: combinedJobs
    });
  } catch (error) {
    console.error('Job aggregation error:', error.message);
    res.status(500).json({
      message: 'Failed to fetch jobs.',
      details: error.message
    });
  }
});

export default router;
