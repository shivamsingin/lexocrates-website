import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Eye,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, postsRes] = await Promise.all([
          axios.get('/api/blog/stats'),
          axios.get('/api/blog?limit=5')
        ]);

        setStats(statsRes.data.data);
        setRecentPosts(postsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      published: 'badge-success',
      draft: 'badge-warning',
      archived: 'badge-secondary'
    };
    return badges[status] || 'badge-secondary';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to Lexocrates Admin Panel</p>
        </div>
        <Link
          to="/blog/new"
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.published || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-warning-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-warning-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.draft || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.categories?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Posts */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Posts</h3>
            <Link to="/blog" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-body">
            {recentPosts.length > 0 ? (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div key={post._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {post.title}
                      </h4>
                      <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <span className={`badge ${getStatusBadge(post.status)}`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/blog/edit/${post._id}`}
                      className="ml-4 text-sm text-primary-600 hover:text-primary-500"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No posts yet</p>
                <Link to="/blog/new" className="mt-4 btn-primary">
                  Create your first post
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Posts by Category</h3>
          </div>
          <div className="card-body">
            {stats?.categories && stats.categories.length > 0 ? (
              <div className="space-y-4">
                {stats.categories.map((category) => (
                  <div key={category._id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {category._id}
                    </span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${(category.count / stats.total) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">
                        {category.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No category data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
