import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { LinkIcon, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Files = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [linkMap, setLinkMap] = useState({});

  const canCleanupTokens = user?.role === 'admin';

  const fetchFiles = async (p = page) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/files', { params: { page: p, limit } });
      const data = res.data?.data || {};
      setFiles(data.files || []);
      setTotal(data.pagination?.total || 0);
      setPage(data.pagination?.page || p);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const generateLink = async (fileId) => {
    try {
      const res = await axios.get(`/api/files/${fileId}`);
      const d = res.data?.data;
      if (d?.downloadUrl) {
        setLinkMap(prev => ({ ...prev, [fileId]: { url: d.downloadUrl, expires: d.downloadExpires } }));
        toast.success('Secure download link generated');
      } else {
        toast.error('Failed to generate link');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link');
    }
  };

  const copyLink = async (fileId) => {
    const link = linkMap[fileId]?.url;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + link);
      toast.success('Link copied to clipboard');
    } catch (_) {
      toast.error('Copy failed');
    }
  };

  const directDownload = (fileId) => {
    const link = linkMap[fileId]?.url;
    if (!link) {
      toast.error('Generate a link first');
      return;
    }
    window.open(link, '_blank');
  };

  const cleanupTokens = async () => {
    try {
      await axios.post('/api/files/tokens/cleanup');
      toast.success('Token cleanup triggered');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cleanup tokens');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <p className="text-gray-600">Generate secure download links and manage your files.</p>
        </div>
        {canCleanupTokens && (
          <button
            onClick={cleanupTokens}
            className="btn-secondary inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Cleanup Tokens
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">Total: {total}</div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Per page</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className="form-select"
              >
                {[10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No files found</td>
                  </tr>
                ) : (
                  files.map(file => (
                    <tr key={file.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{file.originalName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(file.fileSize / 1024).toFixed(1)} KB</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{file.mimeType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{file.uploadDate ? format(new Date(file.uploadDate), 'MMM dd, yyyy') : '-'}</td>
                      <td className="px-4 py-3"><span className="badge badge-secondary">{file.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => generateLink(file.id)}
                            className="btn-secondary inline-flex items-center"
                          >
                            <LinkIcon className="h-4 w-4 mr-2" /> Get link
                          </button>
                          <button
                            onClick={() => copyLink(file.id)}
                            disabled={!linkMap[file.id]?.url}
                            className="btn-secondary disabled:opacity-50"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => directDownload(file.id)}
                            disabled={!linkMap[file.id]?.url}
                            className="btn-primary inline-flex items-center disabled:opacity-50"
                          >
                            <Download className="h-4 w-4 mr-2" /> Download
                          </button>
                        </div>
                        {linkMap[file.id]?.expires && (
                          <div className="text-xs text-gray-500 mt-1">Expires: {format(new Date(linkMap[file.id].expires), 'PPpp')}</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => fetchFiles(page - 1)}
            >
              Previous
            </button>
            <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => fetchFiles(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Files;


