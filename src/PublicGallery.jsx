import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Eye, TrendingUp, Palette, Grid3x3, Camera, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const SUPABASE_URL = 'https://cqnyuuickdkcaadeyrri.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbnl1dWlja2RrY2FhZGV5cnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzM2NTksImV4cCI6MjA4MTI0OTY1OX0.yLme_z7wWPWoJ7D9sqdbgvgdFDemMbWvSBeNmbdZ4UI';

const PublicGallery = () => {
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);
  const [selectedDesignStyles, setSelectedDesignStyles] = useState([]);
  const [selectedColorSchemes, setSelectedColorSchemes] = useState([]);
  const [sortBy, setSortBy] = useState('recently-added');
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);

  const contentTypes = ['Tutorial', 'Vlog', 'Gaming', 'Education', 'Review', 'Commentary', 'Entertainment'];
  const designStyles = ['Minimalist', 'Bold', 'Cinematic', 'Clean', 'Dramatic', 'Playful'];
  const colorSchemes = ['Blue/Purple', 'Dark/Moody', 'Warm/Natural', 'Vibrant/Saturated', 'Blue/Tech', 'Warm/Gold', 'Dark/Blue', 'Red/Dramatic'];

  useEffect(() => {
    loadApprovedThumbnails();
    checkAuth();
    
    const handleNewApproval = () => {
      console.log('New thumbnail approved, refreshing...');
      loadApprovedThumbnails();
    };
    
    window.addEventListener('thumbnailApproved', handleNewApproval);
    return () => window.removeEventListener('thumbnailApproved', handleNewApproval);
  }, []);

  useEffect(() => {
    if (user) {
      loadSavedItems();
    }
  }, [user]);

  const checkAuth = () => {
    const session = localStorage.getItem('supabase.auth.token');
    if (session) {
      try {
        const data = JSON.parse(session);
        setUser(data.user);
      } catch (e) {
        localStorage.removeItem('supabase.auth.token');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('supabase.auth.token');
    setUser(null);
    setSavedItems([]);
    setShowSaved(false);
  };

  const loadSavedItems = async () => {
    if (!user) return;
    
    try {
      const session = JSON.parse(localStorage.getItem('supabase.auth.token'));
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_collections?user_id=eq.${user.id}&select=thumbnail_id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      setSavedItems(data.map(item => item.thumbnail_id));
    } catch (error) {
      console.error('Error loading saved items:', error);
    }
  };

  const handleSave = async (thumbnailId) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      const session = JSON.parse(localStorage.getItem('supabase.auth.token'));
      
      if (savedItems.includes(thumbnailId)) {
        // Unsave
        await fetch(`${SUPABASE_URL}/rest/v1/user_collections?user_id=eq.${user.id}&thumbnail_id=eq.${thumbnailId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        setSavedItems(prev => prev.filter(id => id !== thumbnailId));
      } else {
        // Save
        await fetch(`${SUPABASE_URL}/rest/v1/user_collections`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: user.id,
            thumbnail_id: thumbnailId
          })
        });
        setSavedItems(prev => [...prev, thumbnailId]);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (authMode === 'signup') {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword
          })
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error_description || result.message || 'Signup failed');
        }
        
        setAuthMessage('Check your email to confirm your account!');
        setAuthEmail('');
        setAuthPassword('');
      } else {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword
          })
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error_description || result.message || 'Login failed');
        }
        
        localStorage.setItem('supabase.auth.token', JSON.stringify(result));
        setUser(result.user);
        setShowAuth(false);
        loadSavedItems();
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
    window.location.href = redirectUrl;
  };

  const loadApprovedThumbnails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/thumbnails?status=eq.approved&order=approved_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      const data = await response.json();
      console.log('✅ Loaded approved thumbnails from Supabase:', data.length);
      setThumbnails(data || []);
    } catch (error) {
      console.error('Error loading thumbnails:', error);
      setThumbnails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatViewCount = (count) => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const toggleContentType = (type) => {
    setSelectedContentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleDesignStyle = (style) => {
    setSelectedDesignStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const toggleColorScheme = (scheme) => {
    setSelectedColorSchemes(prev =>
      prev.includes(scheme) ? prev.filter(s => s !== scheme) : [...prev, scheme]
    );
  };

  const clearAllFilters = () => {
    setSelectedContentTypes([]);
    setSelectedDesignStyles([]);
    setSelectedColorSchemes([]);
    setSearchQuery('');
  };

  const filteredThumbnails = useMemo(() => {
    let filtered = showSaved 
      ? thumbnails.filter(thumb => savedItems.includes(thumb.id))
      : thumbnails.filter(thumb => {
      const matchesSearch = searchQuery === '' || 
        thumb.color_scheme?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thumb.face_position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thumb.text_density?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thumb.composition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thumb.lighting_style?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesContentType = selectedContentTypes.length === 0 || selectedContentTypes.includes(thumb.content_type);
      const matchesDesignStyle = selectedDesignStyles.length === 0 || selectedDesignStyles.includes(thumb.design_style);
      const matchesColorScheme = selectedColorSchemes.length === 0 || selectedColorSchemes.includes(thumb.color_scheme);
      
      return matchesSearch && matchesContentType && matchesDesignStyle && matchesColorScheme;
    });

    if (sortBy === 'views') {
      filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    } else if (sortBy === 'ctr') {
      filtered.sort((a, b) => (b.ctr_estimate || 0) - (a.ctr_estimate || 0));
    } else {
      filtered.sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));
    }

    return filtered;
  }, [searchQuery, selectedContentTypes, selectedDesignStyles, selectedColorSchemes, sortBy, thumbnails, showSaved, savedItems]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedThumbnail) return;
      
      const currentIndex = filteredThumbnails.findIndex(t => t.id === selectedThumbnail.id);
      
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSelectedThumbnail(filteredThumbnails[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && currentIndex < filteredThumbnails.length - 1) {
        setSelectedThumbnail(filteredThumbnails[currentIndex + 1]);
      } else if (e.key === 'Escape') {
        setSelectedThumbnail(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedThumbnail, filteredThumbnails]);

  const navigateNext = () => {
    const currentIndex = filteredThumbnails.findIndex(t => t.id === selectedThumbnail.id);
    if (currentIndex < filteredThumbnails.length - 1) {
      setSelectedThumbnail(filteredThumbnails[currentIndex + 1]);
    }
  };

  const navigatePrev = () => {
    const currentIndex = filteredThumbnails.findIndex(t => t.id === selectedThumbnail.id);
    if (currentIndex > 0) {
      setSelectedThumbnail(filteredThumbnails[currentIndex - 1]);
    }
  };

  const activeFilterCount = selectedContentTypes.length + selectedDesignStyles.length + selectedColorSchemes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">ThumbnailVault</h1>
              <p className="text-slate-400 text-sm">Visual-first inspiration • Live from Supabase</p>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {showSaved && (
                    <button
                      onClick={() => setShowSaved(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                    >
                      ← Back to All
                    </button>
                  )}
                  {!showSaved && (
                    <button
                      onClick={() => setShowSaved(true)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                      <Bookmark className="w-4 h-4" />
                      My Saved ({savedItems.length})
                    </button>
                  )}
                  <div className="relative group">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user.email}
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
              
              <div className="text-slate-400 text-sm">{filteredThumbnails.length} thumbnails</div>
              
              <div className="flex items-center gap-2 bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/50">
                <ArrowUpDown className="w-4 h-4 text-purple-400" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-none text-slate-300 text-sm focus:outline-none cursor-pointer">
                  <option value="recently-added">Recently Added</option>
                  <option value="views">Most Views</option>
                  <option value="ctr">Highest CTR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by visual style: 'face close-up', 'red background', 'minimal text'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {activeFilterCount > 0 && (
            <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-medium">Active Filters ({activeFilterCount})</span>
                <button onClick={clearAllFilters} className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors">
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedContentTypes.map(type => (
                  <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                    {type}
                    <button onClick={() => toggleContentType(type)} className="hover:text-purple-100">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedDesignStyles.map(style => (
                  <span key={style} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                    {style}
                    <button onClick={() => toggleDesignStyle(style)} className="hover:text-blue-100">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedColorSchemes.map(scheme => (
                  <span key={scheme} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                    {scheme}
                    <button onClick={() => toggleColorScheme(scheme)} className="hover:text-green-100">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Grid3x3 className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300 text-sm font-medium">Content Type</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map(type => (
                  <button key={type} onClick={() => toggleContentType(type)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedContentTypes.includes(type) ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 text-sm font-medium">Design Style</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {designStyles.map(style => (
                  <button key={style} onClick={() => toggleDesignStyle(style)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedDesignStyles.includes(style) ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'}`}>
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-green-400" />
                <span className="text-slate-300 text-sm font-medium">Color Scheme</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colorSchemes.map(scheme => (
                  <button key={scheme} onClick={() => toggleColorScheme(scheme)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedColorSchemes.includes(scheme) ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'}`}>
                    {scheme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Loading from Supabase...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredThumbnails.map(thumb => (
                <div key={thumb.id} className="group cursor-pointer relative">
                  <div className="relative overflow-hidden rounded-lg bg-slate-800 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1">
                    {/* Save button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(thumb.id);
                      }}
                      className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-all ${
                        savedItems.includes(thumb.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${savedItems.includes(thumb.id) ? 'fill-current' : ''}`} />
                    </button>

                    <div className="aspect-video relative overflow-hidden" onClick={() => setSelectedThumbnail(thumb)}>
                      <img src={thumb.thumbnail_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-medium mb-2 line-clamp-2">{thumb.title}</p>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-white/80">
                              <Eye className="w-3 h-3" />
                              {formatViewCount(thumb.view_count)}
                            </div>
                            {thumb.ctr_estimate && (
                              <div className="flex items-center gap-1 text-green-300">
                                <TrendingUp className="w-3 h-3" />
                                {thumb.ctr_estimate}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredThumbnails.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-400 text-lg">No thumbnails match your filters</p>
                <p className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedThumbnail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedThumbnail(null)}>
          <div className="bg-slate-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            {filteredThumbnails.findIndex(t => t.id === selectedThumbnail.id) > 0 && (
              <button onClick={navigatePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all z-10 hover:scale-110">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {filteredThumbnails.findIndex(t => t.id === selectedThumbnail.id) < filteredThumbnails.length - 1 && (
              <button onClick={navigateNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all z-10 hover:scale-110">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="relative">
              <button onClick={() => setSelectedThumbnail(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10">
                <X className="w-5 h-5" />
              </button>
              
              <img src={selectedThumbnail.thumbnail_url} alt={selectedThumbnail.title} className="w-full aspect-video object-cover rounded-t-xl" />
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedThumbnail.title}</h2>
              <p className="text-slate-400 mb-6">by {selectedThumbnail.creator}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-300 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Views</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatViewCount(selectedThumbnail.view_count)}</p>
                </div>
                
                {selectedThumbnail.ctr_estimate && (
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-300 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">CTR</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedThumbnail.ctr_estimate}%</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {selectedThumbnail.content_type && (
                  <div>
                    <span className="text-slate-400 text-sm font-medium">Content Type: </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30">
                      {selectedThumbnail.content_type}
                    </span>
                  </div>
                )}
                
                {selectedThumbnail.design_style && (
                  <div>
                    <span className="text-slate-400 text-sm font-medium">Design Style: </span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30">
                      {selectedThumbnail.design_style}
                    </span>
                  </div>
                )}
                
                {selectedThumbnail.color_scheme && (
                  <div>
                    <span className="text-slate-400 text-sm font-medium">Color Scheme: </span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full border border-green-500/30">
                      {selectedThumbnail.color_scheme}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center text-slate-500 text-xs">
                Use ← → arrow keys or click arrows to navigate
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicGallery;
