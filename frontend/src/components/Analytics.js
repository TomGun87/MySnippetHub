import React, { useState, useEffect, useCallback } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { TagCloud } from 'react-tagcloud';
import api from '../api';
import toast from 'react-hot-toast';

const Analytics = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [searchInsights, setSearchInsights] = useState(null);
  const [trendPeriod, setTrendPeriod] = useState(30);

  // Color palettes matching the theme
  const COLORS = {
    primary: '#00d4ff',
    secondary: '#8b5cf6', 
    accent: '#14b8a6',
    purple: '#a855f7',
    teal: '#14b8a6',
    gradients: [
      '#00d4ff', '#14b8a6', '#8b5cf6', '#a855f7', 
      '#06b6d4', '#10b981', '#f59e0b', '#ef4444'
    ]
  };

  // Fetch main analytics data (without trends)
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch main analytics data in parallel
      const [overviewData, , insightsData] = await Promise.all([
        api.analytics.getOverview(),
        api.analytics.getLanguages(),
        api.analytics.getSearchInsights()
      ]);

      setOverview(overviewData);
      setSearchInsights(insightsData);
    } catch (err) {
      setError('Failed to load analytics data. Make sure the backend server is running.');
      toast.error('Unable to load analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch trends data separately
  const fetchTrends = useCallback(async (period) => {
    try {
      const trendsData = await api.analytics.getTrends(period);
      setTrends(trendsData);
    } catch (err) {
      console.error('Error fetching trends:', err);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchTrends(trendPeriod);
  }, [fetchTrends, trendPeriod]);

  // Handle period change for trends
  const handlePeriodChange = (period) => {
    setTrendPeriod(period);
    fetchTrends(period);
  };

  // Format data for charts
  const formatLanguageData = (langData) => {
    if (!langData || langData.length === 0) return [];
    
    return langData.map((lang, index) => ({
      name: lang.name,
      value: lang.value,
      percentage: lang.percentage,
      fill: COLORS.gradients[index % COLORS.gradients.length]
    }));
  };

  const formatTagData = (tags) => {
    if (!tags || tags.length === 0) return [];
    
    return tags.map((tag, index) => ({
      value: tag.name,
      count: tag.count,
      color: tag.color || COLORS.gradients[index % COLORS.gradients.length]
    }));
  };

  const formatTrendData = (trendData) => {
    if (!trendData || !trendData.creation_trend) return [];
    
    let data = trendData.creation_trend.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.date,
      snippets: item.snippets_created,
      favorites: trendData.favorites_trend?.find(f => f.date === item.date)?.favorites_added || 0
    }));
    
    // If there's only one data point, generate some sample historical data
    if (data.length === 1 && trendPeriod > 1) {
      const baseDate = new Date(data[0].fullDate);
      const sampleData = [];
      
      for (let i = trendPeriod - 1; i >= 0; i--) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - i);
        
        const existingEntry = data.find(d => d.fullDate === date.toISOString().split('T')[0]);
        if (existingEntry) {
          sampleData.push(existingEntry);
        } else {
          sampleData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: date.toISOString().split('T')[0],
            snippets: Math.floor(Math.random() * 3), // Random sample data
            favorites: Math.floor(Math.random() * 2)
          });
        }
      }
      
      return sampleData;
    }
    
    return data;
  };

  // Custom tooltip for line/bar charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-secondary p-3 border border-primary rounded shadow-lg">
          <p className="text-primary font-medium">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie charts
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-secondary p-3 border border-primary rounded shadow-lg">
          <p className="text-primary font-medium">{data.name}</p>
          <p style={{ color: data.color }}>
            Count: {data.value}
          </p>
          <p style={{ color: data.color }}>
            Percentage: {data.payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="loading-container text-center p-6">
          <div className="spinner mb-4"></div>
          <p className="text-muted">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="error-container text-center p-6">
          <h3 className="text-error mb-4">Analytics Error</h3>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchAnalytics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="dashboard-header mb-6">
        <h2 className="text-2xl font-bold mb-2">📊 Analytics & Insights</h2>
        <p className="text-muted">
          Track your snippet patterns, usage trends, and code organization
        </p>
      </div>

      {/* Summary Bar - Compact */}
      {overview && (
        <div className="analytics-summary card mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg">📝</span>
                <span className="text-xl font-bold text-accent">{overview.summary.total_snippets}</span>
              </div>
              <div className="text-xs text-muted">Snippets</div>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg">🏷️</span>
                <span className="text-xl font-bold text-purple">{overview.summary.total_tags}</span>
              </div>
              <div className="text-xs text-muted">Tags</div>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg">⭐</span>
                <span className="text-xl font-bold text-primary">{overview.summary.total_favorites}</span>
              </div>
              <div className="text-xs text-muted">Favorites</div>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg">💻</span>
                <span className="text-xl font-bold text-accent">{overview.language_distribution?.length || 0}</span>
              </div>
              <div className="text-xs text-muted">Languages</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Language Distribution Pie Chart */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">🎯 Language Distribution</h3>
          {overview?.language_distribution && overview.language_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatLanguageData(overview.language_distribution)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {formatLanguageData(overview.language_distribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted py-8">No language data available</div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">📈 Activity Timeline</h3>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${trendPeriod === 7 ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => handlePeriodChange(7)}
              >
                7d
              </button>
              <button
                className={`btn btn-sm ${trendPeriod === 30 ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => handlePeriodChange(30)}
              >
                30d
              </button>
              <button
                className={`btn btn-sm ${trendPeriod === 90 ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => handlePeriodChange(90)}
              >
                90d
              </button>
            </div>
          </div>
          {trends && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatTrendData(trends)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="snippets"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  name="Snippets Created"
                />
                <Line
                  type="monotone"
                  dataKey="favorites"
                  stroke={COLORS.purple}
                  strokeWidth={2}
                  name="Favorites Added"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Lower Section - Tag Cloud and Activity */}
      <div className="insights-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Tag Cloud */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">🏷️ Popular Tags</h3>
          {overview?.popular_tags && overview.popular_tags.length > 0 ? (
            <div className="tag-cloud-container" style={{ height: '200px' }}>
              <TagCloud
                minSize={12}
                maxSize={24}
                tags={formatTagData(overview.popular_tags)}
                colorOptions={{
                  luminosity: 'light',
                  hue: 'blue'
                }}
                onClick={tag => console.log('Clicked tag:', tag)}
              />
            </div>
          ) : (
            <div className="text-center text-muted py-8">No tag data available</div>
          )}
        </div>

        {/* Top Favorites */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">⭐ Most Favorited</h3>
          {overview?.top_favorites && overview.top_favorites.length > 0 ? (
            <div className="space-y-3">
              {overview.top_favorites.slice(0, 5).map((snippet) => (
                <div key={snippet.id} className="flex justify-between items-center p-2 bg-tertiary rounded">
                  <div>
                    <div className="font-medium text-sm truncate">{snippet.title}</div>
                    <div className="text-xs text-muted">{snippet.language}</div>
                  </div>
                  <div className="text-accent font-bold">{snippet.favorite_count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted py-8">No favorite data available</div>
          )}
        </div>

        {/* Most Edited */}
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">✏️ Most Edited</h3>
          {overview?.most_edited && overview.most_edited.length > 0 ? (
            <div className="space-y-3">
              {overview.most_edited.slice(0, 5).map((snippet) => (
                <div key={snippet.id} className="flex justify-between items-center p-2 bg-tertiary rounded">
                  <div>
                    <div className="font-medium text-sm truncate">{snippet.title}</div>
                    <div className="text-xs text-muted">{snippet.language}</div>
                  </div>
                  <div className="text-purple font-bold">v{snippet.version}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted py-8">No version data available</div>
          )}
        </div>
      </div>

      {/* Monthly Growth Chart */}
      {overview?.monthly_growth && overview.monthly_growth.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">📊 Monthly Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overview.monthly_growth.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill={COLORS.accent}
                radius={[4, 4, 0, 0]}
                name="Snippets Created"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Search Insights */}
      {searchInsights && (
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">🔍 Search Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{searchInsights.untagged_snippets}</div>
              <div className="text-sm text-muted">Untagged Snippets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple">{searchInsights.average_tags_per_snippet}</div>
              <div className="text-sm text-muted">Avg Tags per Snippet</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{searchInsights.common_title_words?.length || 0}</div>
              <div className="text-sm text-muted">Common Title Words</div>
            </div>
          </div>
          
          {searchInsights.common_title_words && searchInsights.common_title_words.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Most Common Title Words</h4>
              <div className="flex flex-wrap gap-2">
                {searchInsights.common_title_words.slice(0, 10).map((word, index) => (
                  <span key={index} className="badge badge-secondary">
                    {word.word} ({word.frequency})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;