import SiteContent from '../models/SiteContent.js';
import { adminOnly } from '../middleware/adminOnly.js';

// Get site content (public)
export const getSiteContent = async (req, res) => {
  try {
    let content = await SiteContent.findOne();
    
    if (!content) {
      // Create default content if none exists
      content = await SiteContent.create({});
    }
    
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error fetching site content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site content',
      error: error.message
    });
  }
};

// Update site content (admin only)
export const updateSiteContent = async (req, res) => {
  try {
    let content = await SiteContent.findOne();
    
    if (!content) {
      content = await SiteContent.create(req.body);
    } else {
      // Update only provided fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
            // Merge nested objects
            content[key] = { ...content[key], ...req.body[key] };
          } else {
            content[key] = req.body[key];
          }
        }
      });
      
      await content.save();
    }
    
    res.json({
      success: true,
      message: 'Site content updated successfully',
      content
    });
  } catch (error) {
    console.error('Error updating site content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update site content',
      error: error.message
    });
  }
};

// Reset to default content (admin only)
export const resetSiteContent = async (req, res) => {
  try {
    await SiteContent.deleteMany({});
    const content = await SiteContent.create({});
    
    res.json({
      success: true,
      message: 'Site content reset to defaults',
      content
    });
  } catch (error) {
    console.error('Error resetting site content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset site content',
      error: error.message
    });
  }
};

