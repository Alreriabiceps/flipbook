import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import { FaChevronLeft, FaChevronRight, FaDownload, FaLock } from 'react-icons/fa';

const FlipbookViewer = () => {
  const { shareId } = useParams();
  const flipBookRef = useRef();
  
  const [flipbookData, setFlipbookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);

  useEffect(() => {
    loadFlipbook();
  }, [shareId]);

  const loadFlipbook = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${shareId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Flipbook not found. The link may be expired or invalid.');
        } else {
          setError('Failed to load flipbook. Please try again later.');
        }
        return;
      }

      const data = await response.json();
      
      // Check if password is required
      if (data.password && data.password !== '') {
        setShowPasswordPrompt(true);
        setFlipbookData(data);
      } else {
        setFlipbookData(data);
        trackView();
      }
    } catch (err) {
      console.error('Error loading flipbook:', err);
      setError('Failed to load flipbook. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (flipbookData && flipbookData.password === password) {
      setShowPasswordPrompt(false);
      trackView();
    } else {
      alert('Incorrect password. Please try again.');
    }
  };

  const trackView = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIndex: 0, shareId })
      });
    } catch (err) {
      console.log('Analytics tracking failed:', err);
    }
  };

  const handlePageFlip = (e) => {
    setSelectedPage(e.data);
  };

  const goToPreviousPage = () => {
    if (selectedPage > 0) {
      setSelectedPage(selectedPage - 1);
      if (flipBookRef.current?.pageFlip) {
        flipBookRef.current.pageFlip().flip(selectedPage - 1);
      }
    }
  };

  const goToNextPage = () => {
    const totalPages = flipbookData?.images?.length || 0;
    if (selectedPage < totalPages - 1) {
      setSelectedPage(selectedPage + 1);
      if (flipBookRef.current?.pageFlip) {
        flipBookRef.current.pageFlip().flip(selectedPage + 1);
      }
    }
  };

  const downloadFlipbook = async () => {
    if (!flipbookData?.settings?.allowDownload) {
      alert('Download is not allowed for this flipbook.');
      return;
    }
    // Trigger PDF export (you can implement this)
    alert('Download feature coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flipbook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl text-gray-400 mb-4">📖</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <FaLock className="text-4xl text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Protected Flipbook</h2>
            <p className="text-gray-600 mt-2">This flipbook requires a password to view.</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            
            <button
              onClick={handlePasswordSubmit}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-medium"
            >
              Access Flipbook
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!flipbookData || !flipbookData.images || flipbookData.images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">📖</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Empty Flipbook</h2>
          <p className="text-gray-600">This flipbook doesn't contain any pages yet.</p>
        </div>
      </div>
    );
  }

  const totalPages = flipbookData.images.length;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{flipbookData.name}</h1>
              <p className="text-sm text-gray-600">{flipbookData.description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Page Navigation */}
              <div className="flex items-center bg-gray-50 rounded-lg p-1">
                <button 
                  onClick={goToPreviousPage} 
                  className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" 
                  disabled={selectedPage === 0}
                >
                  <FaChevronLeft size={14} />
                </button>
                
                <div className="px-3 py-1 text-sm font-medium text-gray-700">
                  {selectedPage + 1} / {totalPages}
                </div>
                
                <button 
                  onClick={goToNextPage} 
                  className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" 
                  disabled={selectedPage === totalPages - 1}
                >
                  <FaChevronRight size={14} />
                </button>
              </div>

              {/* Download Button */}
              {flipbookData.settings?.allowDownload && (
                <button 
                  onClick={downloadFlipbook}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaDownload size={14} />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flipbook Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <HTMLFlipBook
            ref={flipBookRef}
            width={600}
            height={400}
            size="stretch"
            minWidth={300}
            maxWidth={800}
            minHeight={200}
            maxHeight={600}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            useMouseEvents={true}
            drawShadow={true}
            flippingTime={600}
            className="mx-auto shadow-2xl"
            onFlip={handlePageFlip}
          >
            {flipbookData.images.map((imageData, idx) => (
              <div
                key={idx}
                className="page flex items-center justify-center"
                style={{
                  background: 'white',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={imageData.url}
                  alt={imageData.altText || `Page ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                
                {/* Text Overlays */}
                {imageData.textOverlays && imageData.textOverlays.map((text) => (
                  <div
                    key={text.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${text.x}%`,
                      top: `${text.y}%`,
                      fontSize: `${text.fontSize}px`,
                      color: text.color,
                      fontFamily: text.fontFamily,
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      maxWidth: '80%',
                      wordWrap: 'break-word',
                    }}
                  >
                    {text.text}
                  </div>
                ))}


              </div>
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-300 py-4">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">
            Created with 💙 by Flipbook Editor • 
            <span className="ml-2">
              Shared on {new Date(flipbookData.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlipbookViewer; 