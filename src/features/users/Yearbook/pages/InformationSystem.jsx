import React, { useState, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

const DEFAULT_NUM_PAGES = 6;
const CLOUD_NAME = 'dsyvgz1tu'; // <-- Your Cloudinary cloud name
const UPLOAD_PRESET = 'graduates';    // <-- Your unsigned preset

const InformationSystem = () => {
  // Store image URLs for each page
  const [numPages, setNumPages] = useState(DEFAULT_NUM_PAGES);
  const [images, setImages] = useState(Array(DEFAULT_NUM_PAGES).fill(null));
  const [selectedPage, setSelectedPage] = useState(0);
  const bookContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Handle image upload for the selected page (Cloudinary)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    setUploading(true);
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        const newImages = [...images];
        newImages[selectedPage] = data.secure_url;
        setImages(newImages);
      } else {
        alert('Upload failed!');
      }
    } catch (err) {
      alert('Upload error!');
    } finally {
      setUploading(false);
    }
  };

  // Add a new page
  const handleAddPage = () => {
    setImages((prev) => [...prev, null]);
    setNumPages((prev) => prev + 1);
  };

  // Remove the last page (if more than 1)
  const handleRemovePage = () => {
    if (numPages > 1) {
      setImages((prev) => prev.slice(0, -1));
      setNumPages((prev) => prev - 1);
      if (selectedPage >= numPages - 1) setSelectedPage(numPages - 2);
    }
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (bookContainerRef.current.requestFullscreen) {
        bookContainerRef.current.requestFullscreen();
      } else if (bookContainerRef.current.webkitRequestFullscreen) {
        bookContainerRef.current.webkitRequestFullscreen();
      } else if (bookContainerRef.current.mozRequestFullScreen) {
        bookContainerRef.current.mozRequestFullScreen();
      } else if (bookContainerRef.current.msRequestFullscreen) {
        bookContainerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen change to update state
  React.useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ));
    };
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    document.addEventListener('mozfullscreenchange', handleChange);
    document.addEventListener('MSFullscreenChange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('mozfullscreenchange', handleChange);
      document.removeEventListener('MSFullscreenChange', handleChange);
    };
  }, []);

  // Book size
  const bookWidth = isFullscreen ? '99vw' : 600;
  const bookHeight = isFullscreen ? '99vh' : 800;
  const minWidth = isFullscreen ? '99vw' : 315;
  const maxWidth = isFullscreen ? '99vw' : 1000;
  const minHeight = isFullscreen ? '99vh' : 420;
  const maxHeight = isFullscreen ? '99vh' : 1333;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-100 to-cyan-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      {/* Controls above the book */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full max-w-5xl justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="page-select" className="font-medium text-gray-700">Select Page:</label>
          <select
            id="page-select"
            value={selectedPage}
            onChange={e => setSelectedPage(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {Array.from({ length: numPages }).map((_, idx) => (
              <option key={idx} value={idx}>Page {idx + 1}</option>
            ))}
          </select>
          <label className="ml-4 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg transition duration-200 ease-in-out">
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
          <button
            onClick={handleAddPage}
            className="ml-2 bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-4 rounded-lg transition duration-200 ease-in-out"
            disabled={uploading}
          >
            + Add Page
          </button>
          <button
            onClick={handleRemovePage}
            className="ml-2 bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-4 rounded-lg transition duration-200 ease-in-out"
            disabled={numPages <= 1 || uploading}
          >
            - Remove Page
          </button>
        </div>
        <button
          onClick={handleFullscreen}
          className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-1.5 px-4 rounded-lg transition duration-200 ease-in-out"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>
      {/* Book Container */}
      <div
        ref={bookContainerRef}
        className="max-w-7xl mx-auto w-full flex justify-center items-center"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div
          className="relative w-full max-w-5xl book-container drop-shadow-2xl flex justify-center"
          style={{
            perspective: "2500px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Book Binding Shadow */}
          <div className="absolute left-1/2 top-0 bottom-0 w-10 -ml-5 bg-gradient-to-r from-black/30 via-black/50 to-black/30 z-20 rounded shadow-lg"></div>

          {/* Simulated Page Edges */}
          <div
            className="absolute -left-1 -top-0.5 w-[calc(100%+8px)] h-[calc(100%+4px)] bg-gradient-to-b from-gray-100 to-gray-300 rounded-md shadow-inner z-5 book-edges-background"
          ></div>

          <HTMLFlipBook
            width={bookWidth}
            height={bookHeight}
            size="stretch"
            minWidth={minWidth}
            maxWidth={maxWidth}
            minHeight={minHeight}
            maxHeight={maxHeight}
            maxShadowOpacity={0.6}
            showCover={true}
            mobileScrollSupport={true}
            useMouseEvents={true}
            drawShadow={true}
            flippingTime={800}
            className="mx-auto relative z-10 shadow-xl"
            style={{ transformStyle: "preserve-3d" }}
          >
            {Array.from({ length: numPages }).map((_, idx) => (
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
              >
                {images[idx] ? (
                  <img
                    src={images[idx]}
                    alt={`Uploaded page ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <span style={{ color: 'white', fontSize: '1.2rem', opacity: 0.5 }}>No image uploaded for this page</span>
                )}
              </div>
            ))}
          </HTMLFlipBook>
        </div>
      </div>
    </div>
  );
};

export default InformationSystem; 