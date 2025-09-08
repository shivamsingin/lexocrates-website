import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const BlogList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, limit: 10, total: 0 });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const filters = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
    status: searchParams.get('status') || 'published',
    category: searchParams.get('category') || '',
    tag: searchParams.get('tag') || '',
    search: searchParams.get('search') || '',
    author: searchParams.get('author') || ''
  }), [searchParams]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/blog', { params: filters });
      setBlogs(res.data.blogs || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, limit: 10, total: 0 });
    } catch (e) {
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxonomy = async () => {
    try {
      const [c, t] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/tags')
      ]);
      setCategories(c.data.categories || []);
      setTags(t.data.tags || []);
    } catch (e) { /* noop */ }
  };

  useEffect(() => { fetchTaxonomy(); }, []);
  useEffect(() => { fetchBlogs(); }, [filters.page, filters.limit, filters.status, filters.category, filters.tag, filters.search, filters.author]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`/api/blog/${id}`);
      toast.success('Deleted');
      fetchBlogs();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Link to="/blog/new" className="btn-primary inline-flex items-center">
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 flex items-center border rounded px-2">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input className="w-full py-2 outline-none" placeholder="Search..." defaultValue={filters.search} onChange={(e)=>updateParam('search', e.target.value)} />
          </div>
          <select className="input" value={filters.status} onChange={(e)=>updateParam('status', e.target.value)}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select className="input" value={filters.category} onChange={(e)=>updateParam('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select className="input" value={filters.tag} onChange={(e)=>updateParam('tag', e.target.value)}>
            <option value="">All Tags</option>
            {tags.map(t => <option key={t.id} value={t.slug}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2">Title</th>
                <th className="py-2">Author</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-6" colSpan={5}>Loading...</td></tr>
              ) : blogs.length === 0 ? (
                <tr><td className="py-6" colSpan={5}>No posts found</td></tr>
              ) : (
                blogs.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="py-2">
                      <div className="font-medium">{b.title}</div>
                      <div className="text-xs text-gray-500">/{b.slug}</div>
                    </td>
                    <td className="py-2 text-sm">{b.author_name || '-'}</td>
                    <td className="py-2 text-sm capitalize">{b.status}</td>
                    <td className="py-2 text-sm">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <button className="btn-secondary mr-2" onClick={()=>navigate(`/blog/edit/${b.id}`)}>
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="btn-danger" onClick={()=>handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</div>
        <div className="space-x-2">
          <button className="btn-outline" disabled={pagination.page <= 1} onClick={()=>updateParam('page', String(pagination.page - 1))}>Prev</button>
          <button className="btn-outline" disabled={pagination.page >= pagination.pages} onClick={()=>updateParam('page', String(pagination.page + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default BlogList;


