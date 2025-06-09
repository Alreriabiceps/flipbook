import React, { useEffect, useState, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { 
  FaChevronLeft, FaChevronRight, FaVolumeMute, FaVolumeUp, FaThList, 
  FaBook, FaLinkedin, FaExternalLinkAlt, 
  FaCopyright, FaUniversalAccess, FaShieldAlt
} from 'react-icons/fa';

const Viewing = () => {
  const [images, setImages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const flipBookRef = useRef();
  const [selectedPage, setSelectedPage] = useState(0);
  const [showToc, setShowToc] = useState(false);
  
  // Lazy loading states
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [imageElements, setImageElements] = useState({});


  // Flip sound files
  const flipSounds = [
    '/flip.mp3',
    '/flip2.mp3',
    '/flip3.mp3',
    '/flip4.mp3',
    '/flip5.mp3',
  ];
  const [muted, setMuted] = useState(false);
  const flipSound = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    fetch(`${import.meta.env.VITE_API_URL}/api/images`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Find the highest pageIndex to determine total pages
          const maxPage = data.reduce((max, img) => Math.max(max, img.pageIndex), 0);
          const imgs = Array(maxPage + 1).fill(null);
          data.forEach(img => {
            if (typeof img.pageIndex === 'number') {
              imgs[img.pageIndex] = { url: img.url, pageName: img.pageName };
            }
          });
          setImages(imgs);
          setTotalPages(imgs.length);
        } else {
          setError('No flipbook content found. Please create some pages first.');
        }
      })
      .catch(err => {
        console.error('Error loading flipbook:', err);
        setError('Failed to load flipbook. Please check your connection and try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getPageLabel = (idx) => {
    if (images[idx] && images[idx].pageName && images[idx].pageName.trim()) return images[idx].pageName;
    if (idx === 0) return 'Cover';
    if (idx === totalPages - 1) return 'Closing';
    return `Page ${idx}`;
  };

  const handleFlip = (e) => {
    setSelectedPage(e.data);
    
    // Preload nearby pages when user flips
    preloadNearbyPages(e.data);
    
    if (!muted && typeof Audio !== 'undefined') {
      const randomSound = flipSounds[Math.floor(Math.random() * flipSounds.length)];
      flipSound.current = new Audio(randomSound);
      flipSound.current.currentTime = 0;
      flipSound.current.play();
    }
  };

  // Next/Previous page
  const goToPage = (page) => {
    if (flipBookRef.current && flipBookRef.current.pageFlip) {
      flipBookRef.current.pageFlip().flip(page);
    }
  };
  const handlePrev = () => {
    if (selectedPage > 0) goToPage(selectedPage - 1);
  };
  const handleNext = () => {
    if (selectedPage < totalPages - 1) goToPage(selectedPage + 1);
  };



  // Responsive book size
  const getResponsiveDimensions = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;
    
    if (isMobile) {
      return {
        width: Math.min(screenWidth - 32, 340),
        height: Math.min(screenHeight * 0.6, 450),
        minWidth: 280,
        maxWidth: 340,
        minHeight: 360,
        maxHeight: 450
      };
    } else if (isTablet) {
      return {
        width: 500,
        height: 650,
        minWidth: 400,
        maxWidth: 500,
        minHeight: 520,
        maxHeight: 650
      };
    } else {
      return {
        width: 600,
        height: 800,
        minWidth: 400,
        maxWidth: 1000,
        minHeight: 520,
        maxHeight: 1000
      };
    }
  };

  const bookDimensions = getResponsiveDimensions();

  // Lazy loading functions
  const preloadNearbyPages = (currentPage) => {
    const nearbyPages = [];
    const backgroundPages = [];
    const range = 2; // Load 2 pages before and after current page immediately
    
    // Separate nearby pages (high priority) from background pages (low priority)
    for (let i = 0; i < totalPages; i++) {
      if (images[i] && images[i].url && !loadedImages.has(i) && !loadingImages.has(i)) {
        if (i >= Math.max(0, currentPage - range) && i <= Math.min(totalPages - 1, currentPage + range)) {
          nearbyPages.push(i);
        } else {
          backgroundPages.push(i);
        }
      }
    }
    
    // Load nearby pages immediately
    nearbyPages.forEach(pageIndex => loadImage(pageIndex, true));
    
    // Load background pages with delay to avoid overwhelming
    backgroundPages.forEach((pageIndex, index) => {
      setTimeout(() => {
        if (!loadedImages.has(pageIndex) && !loadingImages.has(pageIndex)) {
          loadImage(pageIndex, false);
        }
      }, index * 200); // 200ms delay between each background load
    });
  };

  const loadImage = async (pageIndex, isHighPriority = false) => {
    if (loadedImages.has(pageIndex) || loadingImages.has(pageIndex) || !images[pageIndex]?.url) {
      return;
    }

    setLoadingImages(prev => new Set([...prev, pageIndex]));
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Log loading progress for debugging
      if (isHighPriority) {
        console.log(`🚀 High priority loading page ${pageIndex + 1}`);
      } else {
        console.log(`⏳ Background loading page ${pageIndex + 1}`);
      }
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          setImageElements(prev => ({ ...prev, [pageIndex]: img }));
          setLoadedImages(prev => new Set([...prev, pageIndex]));
          setLoadingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(pageIndex);
            return newSet;
          });
          
          if (isHighPriority) {
            console.log(`✅ High priority loaded page ${pageIndex + 1}`);
          } else {
            console.log(`✅ Background loaded page ${pageIndex + 1}`);
          }
          resolve();
        };
        
        img.onerror = () => {
          setLoadingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(pageIndex);
            return newSet;
          });
          console.warn(`❌ Failed to load page ${pageIndex + 1}`);
          reject();
        };
        
        img.src = images[pageIndex].url;
      });
    } catch (error) {
      console.warn(`Failed to load image for page ${pageIndex}:`, error);
    }
  };

  // Load initial pages when images data is available
  useEffect(() => {
    if (images.length > 0 && totalPages > 0) {
      console.log(`📚 Starting to load flipbook with ${totalPages} pages`);
      // Load first few pages immediately, then all others in background
      preloadNearbyPages(0);
    }
  }, [images, totalPages]);

  // Preload nearby pages when selected page changes
  useEffect(() => {
    if (images.length > 0) {
      preloadNearbyPages(selectedPage);
    }
  }, [selectedPage, images]);

      return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Responsive Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FaBook className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">ECAGraduationProg2025</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Professional Reading Experience</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <div className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">Read-Only Mode</span>
                <span className="sm:hidden">View</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Responsive Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-8 px-2 sm:px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center px-4">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-blue-700 font-medium text-base sm:text-lg text-center">Loading your flipbook...</p>
            <p className="text-gray-600 text-xs sm:text-sm mt-2 text-center">Please wait while we prepare your content</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center max-w-sm sm:max-w-md text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FaBook className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Unable to Load</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        ) : (
        <>
          {/* Responsive Progress Bar */}
          <div className="w-full max-w-5xl mx-auto mb-3 sm:mb-4 px-4">
            <div className="h-2 sm:h-3 bg-gray-200 rounded-full shadow-inner">
              <div
                className="h-2 sm:h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${((selectedPage + 1) / (totalPages || 1)) * 100}%` }}
              />
            </div>
            <div className="text-center text-xs sm:text-sm text-gray-700 mt-1 sm:mt-2 font-medium">
              <div className="flex items-center justify-center gap-2">
                <span className="hidden sm:inline">
                  {getPageLabel(selectedPage)} ({selectedPage + 1} of {totalPages})
                </span>
                <span className="sm:hidden">
                  {selectedPage + 1} / {totalPages}
                </span>
                
                {/* Loading progress indicator */}
                {loadedImages.size < totalPages && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {loadedImages.size}/{totalPages} loaded
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Responsive Flipbook Container */}
          <div className="w-full flex justify-center items-center max-w-7xl">
            <div
              className="relative w-full h-full flex justify-center items-center max-w-5xl"
              style={{
                perspective: "2500px",
                transformStyle: "preserve-3d",
              }}
            >
              <HTMLFlipBook
                ref={flipBookRef}
                width={bookDimensions.width}
                height={bookDimensions.height}
                size="stretch"
                minWidth={bookDimensions.minWidth}
                maxWidth={bookDimensions.maxWidth}
                minHeight={bookDimensions.minHeight}
                maxHeight={bookDimensions.maxHeight}
                maxShadowOpacity={0.6}
                showCover={true}
                mobileScrollSupport={true}
                useMouseEvents={true}
                swipeDistance={30}
                clickEventForward={true}
                usePortrait={window.innerWidth < 768}
                drawShadow={true}
                flippingTime={window.innerWidth < 768 ? 600 : 800}
                className="mx-auto relative z-10 shadow-xl hover:shadow-2xl transition-shadow duration-300"
                style={{ 
                  transformStyle: "preserve-3d",
                  touchAction: 'pan-y'
                }}
                onFlip={handleFlip}
              >
                {images.map((img, idx) => {
                  const isLoaded = loadedImages.has(idx);
                  const isLoading = loadingImages.has(idx);
                  const hasImage = img && img.url;
                  
                  return (
                    <div
                      key={idx}
                      className="page flex items-center justify-center"
                      style={{
                        background: 'black',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      onClick={() => {
                        if (hasImage && !isLoaded && !isLoading) {
                          loadImage(idx, true); // Manual clicks get high priority
                        }
                      }}
                    >
                      {hasImage ? (
                        <>
                          {/* Blur placeholder while loading */}
                          {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse">
                              {isLoading ? (
                                <div className="flex flex-col items-center justify-center text-white/60">
                                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mb-2"></div>
                                  <span className="text-sm">Loading...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-white/40">
                                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-2">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-xs">Tap to load</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Actual image */}
                          {isLoaded && (
                            <img
                              src={img.url}
                              alt={`Page ${idx} image`}
                              className="transition-opacity duration-500 ease-in-out"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                opacity: isLoaded ? 1 : 0,
                              }}
                              onLoad={() => {
                                // Ensure the image is marked as loaded
                                setLoadedImages(prev => new Set([...prev, idx]));
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'white', fontSize: '1.2rem', opacity: 0.5 }}>
                          {`No image uploaded for ${getPageLabel(idx)}`}
                        </span>
                      )}
                      

                    </div>
                  );
                })}
              </HTMLFlipBook>
            </div>
          </div>
          {/* Mobile-Responsive Enhanced Control Bar */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 text-gray-700 border-gray-300 backdrop-blur-md shadow-xl rounded-xl flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 z-50 border transition-all duration-300">
            
            {/* Previous Button */}
            <button
              onClick={handlePrev}
              className="p-2 sm:p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-40 transition-all duration-200 touch-manipulation"
              disabled={selectedPage === 0}
              title="Previous Page"
            >
              <FaChevronLeft size={window.innerWidth < 768 ? 12 : 14} />
            </button>
            
            {/* Table of Contents Button */}
            <button
              onClick={() => setShowToc((s) => !s)}
              className={`p-2 sm:p-2.5 rounded-full ${
                showToc 
                  ? 'bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
              } text-white transition-all duration-200 touch-manipulation`}
              title={showToc ? 'Hide Table of Contents' : 'Show Table of Contents'}
            >
              <FaThList size={window.innerWidth < 768 ? 12 : 14} />
            </button>
            
            {/* Mute Button */}
            <button
              onClick={() => setMuted((m) => !m)}
              className={`p-2 sm:p-2.5 rounded-full ${
                muted 
                  ? 'bg-gray-500' 
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
              } text-white transition-all duration-200 touch-manipulation`}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <FaVolumeMute size={window.innerWidth < 768 ? 12 : 14} /> : <FaVolumeUp size={window.innerWidth < 768 ? 12 : 14} />}
            </button>
            
            {/* Next Button */}
            <button
              onClick={handleNext}
              className="p-2 sm:p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-40 transition-all duration-200 touch-manipulation"
              disabled={selectedPage === totalPages - 1}
              title="Next Page"
            >
              <FaChevronRight size={window.innerWidth < 768 ? 12 : 14} />
            </button>
          </div>
          {/* Enhanced Table of Contents Modal */}
          {showToc && (
            <div 
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
              onClick={() => setShowToc(false)}
            >
              <div 
                className="bg-white text-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto border transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                    <FaThList className="w-5 h-5" />
                    Table of Contents
                  </h3>
                  <button
                    onClick={() => setShowToc(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  {totalPages} pages • Currently on page {selectedPage + 1}
                </div>
                
                <ul className="space-y-2">
                  {images.map((_, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => { goToPage(idx); setShowToc(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                          selectedPage === idx 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        <span className="font-medium">{getPageLabel(idx)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selectedPage === idx 
                            ? 'bg-white/20' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
        )}
      </div>

      {/* Mobile-Responsive Professional Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Brand Section */}
              <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg flex-shrink-0">
                    <FaBook className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold">Flipbook Editor</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Professional Publishing Platform</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  Version 2.1.0 • Viewer Mode
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Reading Features</h4>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 text-gray-300">
                    <FaBook className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Interactive Reading</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <FaVolumeUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Audio Feedback</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <FaThList className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Table of Contents</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <FaUniversalAccess className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Accessibility</span>
                  </div>
                </div>
              </div>

              {/* Contact & Links */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Connect</h4>
                <div className="space-y-2 sm:space-y-3">
                  <a
                    href="https://www.linkedin.com/in/russelle-roxas-173831334/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 text-gray-300 hover:text-blue-400 transition-colors group"
                  >
                    <FaLinkedin className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Russelle Roxas</span>
                    <FaExternalLinkAlt className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60" />
                  </a>
                  
                  <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                    <FaShieldAlt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Secure Viewing</span>
                  </div>
                </div>
                
                <div className="pt-3 sm:pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400 text-xs">
                    <FaCopyright className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                    <span className="text-xs">2025 Flipbook Editor. All rights reserved.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-Responsive Bottom Status Bar */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs text-gray-400">
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-center sm:text-left">
                  <span className="hidden sm:inline">Built with React + Vite</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Styled with Tailwind CSS</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Powered by react-pageflip</span>
                  <span className="sm:hidden">React • Vite • Tailwind • react-pageflip</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">System Online</span>
                </div>
              </div>
            </div>
                      </div>
          </footer>
    </div>
  );
};

export default Viewing;