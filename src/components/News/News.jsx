import { useState, useEffect } from 'react';
import { fetchNews } from '../../utils/api';
import './News.css';

function News() {
  const [news, setNews] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await fetchNews();
        setNews(data);
      } catch (error) {
        console.error('Failed to load news:', error);
      }
    };
    loadNews();
  }, []);

  useEffect(() => {
    if (!news?.news) return;

    const now = new Date();
    const activeNews = news.news.filter(newsItem => {
      if (!newsItem.active) return false;
      const startDate = new Date(newsItem.startDate);
      const durationMs = (newsItem.duration.days * 24 * 60 * 60 * 1000) +
                         (newsItem.duration.hours * 60 * 60 * 1000) +
                         (newsItem.duration.minutes * 60 * 1000);
      const endDate = new Date(startDate.getTime() + durationMs);
      return now >= startDate && now <= endDate;
    }).sort((a, b) => a.priority - b.priority);

    if (activeNews.length === 0) return;

    if (activeNews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % activeNews.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [news]);

  if (!news?.news) return null;

  const now = new Date();
  const activeNews = news.news.filter(newsItem => {
    if (!newsItem.active) return false;
    const startDate = new Date(newsItem.startDate);
    const durationMs = (newsItem.duration.days * 24 * 60 * 60 * 1000) +
                       (newsItem.duration.hours * 60 * 60 * 1000) +
                       (newsItem.duration.minutes * 60 * 1000);
    const endDate = new Date(startDate.getTime() + durationMs);
    return now >= startDate && now <= endDate;
  }).sort((a, b) => a.priority - b.priority);

  if (activeNews.length === 0) return null;

  return (
    <div className="news-container">
      {activeNews.map((newsItem, index) => (
        <p
          key={index}
          className={`news-message news-priority-${newsItem.priority} ${
            index === currentIndex ? 'active' : index < currentIndex ? 'next' : ''
          }`}
        >
          {newsItem.message}
        </p>
      ))}
    </div>
  );
}

export default News;

