import React, { createContext, useContext, useState, useEffect } from 'react';
import siteContentService from '../services/siteContentService';

const SiteContentContext = createContext();

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider');
  }
  return context;
};

export const SiteContentProvider = ({ children }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const siteContent = await siteContentService.getSiteContent();
      setContent(siteContent);
    } catch (err) {
      console.error('Error loading site content:', err);
      setError(err.message);
      // Set default content on error
      setContent({
        organizationName: 'Sun Valley Mega Health Center',
        organizationTagline: 'Your Community\'s Trusted for Health'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const updateContent = async (newContent) => {
    try {
      const updated = await siteContentService.updateSiteContent(newContent);
      setContent(updated);
      return updated;
    } catch (err) {
      console.error('Error updating site content:', err);
      throw err;
    }
  };

  const resetContent = async () => {
    try {
      const reset = await siteContentService.resetSiteContent();
      setContent(reset);
      return reset;
    } catch (err) {
      console.error('Error resetting site content:', err);
      throw err;
    }
  };

  const value = {
    content,
    loading,
    error,
    updateContent,
    resetContent,
    refreshContent: fetchContent
  };

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
};

