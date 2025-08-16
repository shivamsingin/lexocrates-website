import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Select from 'react-select';
import { useDropzone } from 'react-dropzone';
import { 
  Save, 
  Eye, 
  Upload, 
  X, 
  Search,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BlogEditor = ({ post, onSave, onCancel }) => {
  const [isPreview, setIsPreview] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      metaDescription: post?.metaDescription || '',
      focusKeywords: post?.focusKeywords || [],
      content: post?.content || '',
      excerpt: post?.excerpt || '',
      category: post?.category || '',
      tags: post?.tags || [],
      status: post?.status || 'draft',
      schemaMarkup: post?.schemaMarkup || '',
      internalLinks: post?.internalLinks || [],
      externalLinks: post?.externalLinks || []
    }
  });

  const watchedTitle = watch('title');
  const watchedMetaDescription = watch('metaDescription');
  const watchedContent = watch('content');

  // Auto-generate slug from title
  useEffect(() => {
    if (watchedTitle && !post?.slug) {
      const slug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [watchedTitle, setValue, post?.slug]);

  // SEO Analysis
  const analyzeSEO = async () => {
    setIsAnalyzing(true);
    try {
      const formData = watch();
      const response = await axios.post('/api/blog/analyze-seo', {
        title: formData.title,
        metaDescription: formData.metaDescription,
        focusKeywords: formData.focusKeywords,
        content: formData.content,
        images: uploadedImages,
        internalLinks: formData.internalLinks,
        externalLinks: formData.externalLinks
      });
      setSeoAnalysis(response.data.data);
      toast.success('SEO analysis completed');
    } catch (error) {
      toast.error('Failed to analyze SEO');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Image upload
  const onDrop = async (acceptedFiles) => {
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post('/api/blog/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedImages(prev => [...prev, ...response.data.data]);
      toast.success('Images uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload images');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  // Form submission
  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const postData = {
        ...data,
        images: uploadedImages,
        seoAnalysis
      };

      if (post?._id) {
        await axios.put(`/api/blog/${post._id}`, postData);
        toast.success('Post updated successfully');
      } else {
        await axios.post('/api/blog', postData);
        toast.success('Post created successfully');
      }

      onSave();
    } catch (error) {
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = [
    { value: 'Strategy', label: 'Strategy' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Best Practices', label: 'Best Practices' },
    { value: 'Compliance & Security', label: 'Compliance & Security' },
    { value: 'Industry Trends', label: 'Industry Trends' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  const getSEOScoreColor = (score) => {
    if (score >= 80) return 'seo-score-excellent';
    if (score >= 60) return 'seo-score-good';
    return 'seo-score-poor';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {post ? 'Edit Post' : 'Create New Post'}
              </h1>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className="btn-outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isPreview ? 'Edit' : 'Preview'}
                </button>
                <button
                  onClick={analyzeSEO}
                  disabled={isAnalyzing}
                  className="btn-secondary"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'SEO Analysis'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                </div>
                <div className="card-body space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      {...register('title', { required: 'Title is required' })}
                      className="input mt-1"
                      placeholder="Enter post title..."
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {watchedTitle?.length || 0}/60 characters
                    </p>
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Slug *
                    </label>
                    <input
                      type="text"
                      {...register('slug', { required: 'Slug is required' })}
                      className="input mt-1"
                      placeholder="post-url-slug"
                    />
                    {errors.slug && (
                      <p className="mt-1 text-sm text-danger-600">{errors.slug.message}</p>
                    )}
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Meta Description *
                    </label>
                    <textarea
                      {...register('metaDescription', { required: 'Meta description is required' })}
                      rows={3}
                      className="textarea mt-1"
                      placeholder="Enter meta description for SEO..."
                    />
                    {errors.metaDescription && (
                      <p className="mt-1 text-sm text-danger-600">{errors.metaDescription.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {watchedMetaDescription?.length || 0}/160 characters
                    </p>
                  </div>

                  {/* Focus Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Focus Keywords
                    </label>
                    <Controller
                      name="focusKeywords"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={[]}
                          placeholder="Add focus keywords..."
                          className="mt-1"
                          classNamePrefix="react-select"
                          noOptionsMessage={() => "Type to add keywords"}
                          onInputChange={(inputValue) => {
                            if (inputValue && !field.value.find(k => k.value === inputValue)) {
                              const newOption = { value: inputValue, label: inputValue };
                              field.onChange([...field.value, newOption]);
                            }
                          }}
                        />
                      )}
                    />
                  </div>

                  {/* Category and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <Controller
                        name="category"
                        control={control}
                        rules={{ required: 'Category is required' }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={categoryOptions}
                            placeholder="Select category..."
                            className="mt-1"
                            classNamePrefix="react-select"
                          />
                        )}
                      />
                      {errors.category && (
                        <p className="mt-1 text-sm text-danger-600">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={statusOptions}
                            placeholder="Select status..."
                            className="mt-1"
                            classNamePrefix="react-select"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Content</h3>
                </div>
                <div className="card-body">
                  {isPreview ? (
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: watchedContent }} />
                    </div>
                  ) : (
                    <Controller
                      name="content"
                      control={control}
                      rules={{ required: 'Content is required' }}
                      render={({ field }) => (
                        <ReactQuill
                          {...field}
                          theme="snow"
                          placeholder="Write your content here..."
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              [{ 'color': [] }, { 'background': [] }],
                              ['link', 'image'],
                              ['clean']
                            ]
                          }}
                        />
                      )}
                    />
                  )}
                  {errors.content && (
                    <p className="mt-1 text-sm text-danger-600">{errors.content.message}</p>
                  )}
                </div>
              </div>

              {/* Images */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Images</h3>
                </div>
                <div className="card-body">
                  <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Drag & drop images here, or click to select files
                    </p>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url}
                            alt={image.altText || ''}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Alt text"
                            value={image.altText || ''}
                            onChange={(e) => {
                              const updatedImages = [...uploadedImages];
                              updatedImages[index].altText = e.target.value;
                              setUploadedImages(updatedImages);
                            }}
                            className="mt-2 input text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Post'}
                </button>
              </div>
            </form>
          </div>

          {/* SEO Analysis Panel */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">SEO Analysis</h3>
              </div>
              <div className="card-body">
                {seoAnalysis ? (
                  <div className="space-y-4">
                    {/* SEO Score */}
                    <div className="text-center">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getSEOScoreColor(seoAnalysis.seoScore)}`}>
                        {seoAnalysis.seoScore}/100
                      </div>
                      <p className="mt-2 text-sm text-gray-600">SEO Score</p>
                    </div>

                    {/* Analysis Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Title Length</span>
                        <span className={`text-sm font-medium ${seoAnalysis.titleCheck?.valid ? 'text-success-600' : 'text-danger-600'}`}>
                          {seoAnalysis.titleCheck?.length || 0}/60
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Meta Description</span>
                        <span className={`text-sm font-medium ${seoAnalysis.metaDescriptionCheck?.valid ? 'text-success-600' : 'text-danger-600'}`}>
                          {seoAnalysis.metaDescriptionCheck?.length || 0}/160
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Keyword Density</span>
                        <span className="text-sm font-medium text-gray-900">
                          {seoAnalysis.keywordDensity?.density?.toFixed(2) || 0}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Word Count</span>
                        <span className="text-sm font-medium text-gray-900">
                          {seoAnalysis.contentMetrics?.wordCount || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Reading Time</span>
                        <span className="text-sm font-medium text-gray-900">
                          {seoAnalysis.contentMetrics?.readingTime || 0} min
                        </span>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {seoAnalysis.suggestions?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Suggestions</h4>
                        <ul className="space-y-1">
                          {seoAnalysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <AlertCircle className="h-4 w-4 text-warning-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-600">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click "SEO Analysis" to analyze your content
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Google Preview</h3>
              </div>
              <div className="card-body">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="text-blue-600 text-sm truncate">
                    {watchedTitle ? `https://lexocrates.com/blog/${watch('slug')}` : 'https://lexocrates.com/blog/...'}
                  </div>
                  <div className="text-xl text-blue-600 font-medium mt-1 truncate">
                    {watchedTitle || 'Your post title will appear here'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {watchedMetaDescription || 'Your meta description will appear here'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
