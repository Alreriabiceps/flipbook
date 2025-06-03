import React, { useState, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

const DEFAULT_NUM_CONTENT_PAGES = 3; // Number of content pages (not counting cover/closing)
const CLOUD_NAME = 'dmnqwmozk'; // Your Cloudinary cloud name
const UPLOAD_PRESET = 'graduates1'; // Your unsigned preset

const InformationSystem = () => {
  // Always have cover + content pages + closing
  const [numContentPages, setNumContentPages] = useState(DEFAULT_NUM_CONTENT_PAGES);
  const totalPages = numContentPages + 2; // +2 for cover and closing
  const [images, setImages] = useState(() => Array(totalPages).fill(null));
  const [selectedPage, setSelectedPage] = useState(0);
  const bookContainerRef = useRef(null);
  const flipBookRef = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pageNumberKey, setPageNumberKey] = useState(0); // For animation
  const [dragOverPage, setDragOverPage] = useState(null);
  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  // Drag-and-drop for page reordering
  const [draggedThumb, setDraggedThumb] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [muted, setMuted] = useState(false);

  // Helper to push to history
  const pushToHistory = (images, numContentPages) => {
    setHistory((prev) => [...prev, { images: [...images], numContentPages }]);
    setFuture([]); // Clear redo stack
  };

  // Undo
  const handleUndo = () => {
    if (history.length === 0) return;
    setFuture((f) => [{ images: [...images], numContentPages }, ...f]);
    const last = history[history.length - 1];
    setImages([...last.images]);
    setNumContentPages(last.numContentPages);
    setHistory((prev) => prev.slice(0, -1));
  };

  // Redo
  const handleRedo = () => {
    if (future.length === 0) return;
    setHistory((prev) => [...prev, { images: [...images], numContentPages }]);
    const next = future[0];
    setImages([...next.images]);
    setNumContentPages(next.numContentPages);
    setFuture((f) => f.slice(1));
  };

  // Wrap state-changing actions to push to history
  const wrappedSetImages = (newImages) => {
    pushToHistory(images, numContentPages);
    setImages(newImages);
  };
  const wrappedSetNumContentPages = (newNum) => {
    pushToHistory(images, numContentPages);
    setNumContentPages(newNum);
  };

  // Ensure images array always matches totalPages
  React.useEffect(() => {
    setImages((prev) => {
      if (prev.length === totalPages) return prev;
      if (prev.length < totalPages) {
        // Add nulls for new pages
        return [...prev, ...Array(totalPages - prev.length).fill(null)];
      }
      // Remove extra pages
      return prev.slice(0, totalPages);
    });
  }, [totalPages]);

  // Fetch images from backend on mount
  React.useEffect(() => {
    fetch('http://localhost:3000/api/images')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setImages(prev => {
            const newImages = [...prev];
            data.forEach(img => {
              if (typeof img.pageIndex === 'number' && img.url) {
                newImages[img.pageIndex] = img.url;
              }
            });
            return newImages;
          });
        }
      })
      .catch(err => {
        // Optionally handle error
        console.error('Failed to fetch images from backend', err);
      });
  }, [totalPages]);

  // Flip sound files
  const flipSounds = [
    '/flip.mp3',
    '/flip2.mp3',
    '/flip3.mp3',
    '/flip4.mp3',
    '/flip5.mp3',
  ];
  // Page flip sound
  const flipSound = useRef(null);

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
        wrappedSetImages(newImages);
        // Send to backend
        try {
          await fetch('http://localhost:3000/api/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: data.secure_url, pageIndex: selectedPage }),
          });
        } catch (err) {
          // Optionally handle backend error
          console.error('Failed to save image info to backend', err);
        }
      } else {
        alert('Upload failed!');
      }
    } catch (err) {
      alert('Upload error!');
    } finally {
      setUploading(false);
    }
  };

  // Handle drag-and-drop for image upload
  const handlePageDrop = async (e, idx) => {
    e.preventDefault();
    setDragOverPage(null);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      // Reuse handleImageUpload logic for dropped file
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
          newImages[idx] = data.secure_url;
          wrappedSetImages(newImages);
          // Send to backend
          try {
            await fetch('http://localhost:3000/api/images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: data.secure_url, pageIndex: idx }),
            });
          } catch (err) {
            console.error('Failed to save image info to backend', err);
          }
        } else {
          alert('Upload failed!');
        }
      } catch (err) {
        alert('Upload error!');
      } finally {
        setUploading(false);
      }
    }
  };

  // Add a new content page (between cover and closing)
  const handleAddPage = () => {
    wrappedSetNumContentPages(numContentPages + 1);
  };

  // Remove the last content page (not cover/closing)
  const handleRemovePage = () => {
    if (numContentPages > 1) {
      wrappedSetNumContentPages(numContentPages - 1);
      if (selectedPage >= totalPages - 2) setSelectedPage(totalPages - 3);
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
  const bookWidth = isFullscreen
    ? '100vw'
    : window.innerWidth < 640
    ? 320
    : window.innerWidth < 1024
    ? 480
    : 600;
  const bookHeight = isFullscreen
    ? '100vh'
    : window.innerWidth < 640
    ? 420
    : window.innerWidth < 1024
    ? 640
    : 800;
  const minWidth = isFullscreen ? '100vw' : 220;
  const maxWidth = isFullscreen ? '100vw' : 1000;
  const minHeight = isFullscreen ? '100vh' : 320;
  const maxHeight = isFullscreen ? '100vh' : 1333;

  // Page label helper
  const getPageLabel = (idx) => {
    if (idx === 0) return 'Cover';
    if (idx === totalPages - 1) return 'Closing';
    return `Page ${idx}`;
  };

  // Table of contents quick nav
  const handleQuickNav = (idx) => {
    if (flipBookRef.current && flipBookRef.current.pageFlip) {
      flipBookRef.current.pageFlip().flip(idx);
    }
  };

  // On page flip, update selectedPage, play sound, animate page number
  const handleFlip = (e) => {
    setSelectedPage(e.data);
    setPageNumberKey((k) => k + 1); // For animation
    if (!muted && typeof Audio !== 'undefined') {
      const randomSound = flipSounds[Math.floor(Math.random() * flipSounds.length)];
      flipSound.current = new Audio(randomSound);
      flipSound.current.currentTime = 0;
      flipSound.current.play();
    }
  };

  // Drag-and-drop for page reordering
  const handleThumbDragStart = (idx) => {
    setDraggedThumb(idx);
  };
  const handleThumbDragOver = (e) => {
    e.preventDefault();
  };
  const handleThumbDrop = (idx) => {
    if (draggedThumb === null || draggedThumb === idx) return;
    // Reorder images
    const newImages = [...images];
    const [removed] = newImages.splice(draggedThumb, 1);
    newImages.splice(idx, 0, removed);
    wrappedSetImages(newImages);
    setDraggedThumb(null);
  };
  const handleThumbDragEnd = () => {
    setDraggedThumb(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-100 to-cyan-100 py-4 px-1 sm:py-8 sm:px-4 flex flex-col items-center justify-center">
      {/* Instructions Toggle Button */}
      <div className="w-full max-w-3xl mx-auto flex justify-end mb-1">
        <button
          onClick={() => setShowInstructions((v) => !v)}
          className="text-base px-5 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 shadow font-semibold transition"
        >
          {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
        </button>
      </div>
      {/* Instructions Box */}
      {showInstructions && (
        <div className="w-full max-w-3xl mx-auto mb-6 p-4 bg-white/90 border border-blue-200 rounded-lg shadow text-blue-900 text-sm">
          <strong className="block mb-1 text-blue-700">How to use the Flipbook:</strong>
          <ul className="list-disc pl-5 space-y-1">
            <li>Click <span className="font-semibold">Upload Image</span> to add an image to the selected page.</li>
            <li>Or <span className="font-semibold">drag and drop</span> an image file directly onto any page.</li>
            <li>Use <span className="font-semibold">+ Add Page</span> or <span className="font-semibold">- Remove Page</span> to change the number of pages.</li>
            <li>Reorder pages by <span className="font-semibold">dragging and dropping thumbnails</span> below the book.</li>
            <li>Use <span className="font-semibold">Undo</span> and <span className="font-semibold">Redo</span> to revert or repeat changes.</li>
            <li>Click <span className="font-semibold">Fullscreen</span> for an immersive view.</li>
            <li>Navigate quickly using the <span className="font-semibold">table of contents</span> or thumbnails.</li>
          </ul>
        </div>
      )}
      {/* Progress bar and animated page number */}
      <div className="w-full max-w-5xl mx-auto mb-2">
        <div className="h-2 bg-gray-300 rounded">
          <div
            className="h-2 bg-blue-500 rounded transition-all duration-300"
            style={{ width: `${((selectedPage + 1) / totalPages) * 100}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-700 mt-1">
          <span
            key={pageNumberKey}
            style={{
              display: 'inline-block',
              transition: 'opacity 0.4s',
              opacity: 1,
              animation: 'fadeIn 0.4s',
            }}
          >
            {getPageLabel(selectedPage)} ({selectedPage + 1} / {totalPages})
          </span>
        </div>
      </div>
      {/* Table of Contents Quick Navigation */}
      <ul className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <li key={idx}>
            <button
              className={`px-2 py-1 rounded ${selectedPage === idx ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => handleQuickNav(idx)}
            >
              {getPageLabel(idx)}
            </button>
          </li>
        ))}
      </ul>
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
            {Array.from({ length: totalPages }).map((_, idx) => (
              <option key={idx} value={idx}>{getPageLabel(idx)}</option>
            ))}
          </select>
          <label className="ml-4 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg shadow transition duration-200 ease-in-out">
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
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg shadow transition duration-200 ease-in-out"
            disabled={uploading}
          >
            + Add Page
          </button>
          <button
            onClick={handleRemovePage}
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg shadow transition duration-200 ease-in-out disabled:opacity-50"
            disabled={numContentPages <= 1 || uploading}
          >
            - Remove Page
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg shadow transition duration-200 ease-in-out disabled:opacity-50"
            disabled={history.length === 0}
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg shadow transition duration-200 ease-in-out disabled:opacity-50"
            disabled={future.length === 0}
          >
            Redo
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg shadow transition duration-200 ease-in-out ${muted ? 'opacity-60' : ''}`}
            title={muted ? 'Unmute Flip Sound' : 'Mute Flip Sound'}
          >
            {muted ? 'Unmute Sound' : 'Mute Sound'}
          </button>
        </div>
        <button
          onClick={handleFullscreen}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg shadow transition duration-200 ease-in-out"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>
      {/* Note for drag-and-drop page arrangement */}
      <div className="w-full max-w-5xl mx-auto text-center text-sm text-blue-700 mb-2">
        <span className="inline-block bg-blue-100 px-3 py-1 rounded">Tip: Drag and drop the thumbnails below to rearrange pages!</span>
      </div>
      {/* Book Container */}
      <div
        ref={bookContainerRef}
        className={`mx-auto w-full flex justify-center items-center ${isFullscreen ? '' : 'max-w-7xl'} px-0 sm:px-4`}
        style={{
          position: 'relative',
          zIndex: 1,
          width: isFullscreen ? '100vw' : undefined,
          height: isFullscreen ? '100vh' : undefined,
          maxWidth: isFullscreen ? '100vw' : undefined,
          maxHeight: isFullscreen ? '100vh' : undefined,
          margin: isFullscreen ? '40px' : undefined,
          boxSizing: isFullscreen ? 'border-box' : undefined,
        }}
      >
        {/* Spinner overlay when uploading */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <span className="ml-4 text-white text-lg font-semibold">Uploading...</span>
          </div>
        )}
        <div
          className={`relative w-full flex justify-center ${isFullscreen ? '' : 'max-w-5xl'}`}
          style={{
            perspective: "2500px",
            transformStyle: "preserve-3d",
            width: isFullscreen ? '100vw' : undefined,
            height: isFullscreen ? '100vh' : undefined,
            maxWidth: isFullscreen ? '100vw' : undefined,
            maxHeight: isFullscreen ? '100vh' : undefined,
          }}
        >
          {/* Book Binding Shadow */}
          <div className="absolute left-1/2 top-0 bottom-0 w-10 -ml-5 bg-gradient-to-r from-black/30 via-black/50 to-black/30 z-20 rounded shadow-lg"></div>

          {/* Simulated Page Edges */}
          <div
            className="absolute -left-1 -top-0.5 w-[calc(100%+8px)] h-[calc(100%+4px)] bg-gradient-to-b from-gray-100 to-gray-300 rounded-md shadow-inner z-5 book-edges-background"
          ></div>

          <HTMLFlipBook
            ref={flipBookRef}
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
            onFlip={handleFlip}
          >
            {Array.from({ length: totalPages }).map((_, idx) => (
              <div
                key={idx}
                className={`page flex items-center justify-center ${dragOverPage === idx ? 'ring-4 ring-blue-400' : ''}`}
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
                onDragOver={e => {
                  e.preventDefault();
                  setDragOverPage(idx);
                }}
                onDragLeave={e => {
                  e.preventDefault();
                  setDragOverPage(null);
                }}
                onDrop={e => handlePageDrop(e, idx)}
              >
                {images[idx] ? (
                  <img
                    src={images[idx]}
                    alt={`${getPageLabel(idx)} image`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <span style={{ color: 'white', fontSize: '1.2rem', opacity: 0.5 }}>{`No image uploaded for ${getPageLabel(idx)}`}</span>
                )}
                {/* Page number label */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 0,
                    width: '100%',
                    textAlign: 'center',
                    color: '#fff',
                    fontSize: '1rem',
                    opacity: 0.7,
                    letterSpacing: '0.1em',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {getPageLabel(idx)}
                </div>
              </div>
            ))}
          </HTMLFlipBook>
        </div>
      </div>
      {/* Page Thumbnails Row */}
      <div className="w-full max-w-5xl mx-auto mt-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickNav(idx)}
              className={`border-2 rounded-md focus:outline-none transition-all duration-200 ${selectedPage === idx ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300'} bg-white ${draggedThumb === idx ? 'opacity-60' : ''}`}
              style={{ minWidth: 48, minHeight: 64, width: 48, height: 64, overflow: 'hidden', position: 'relative' }}
              title={getPageLabel(idx)}
              draggable
              onDragStart={() => handleThumbDragStart(idx)}
              onDragOver={handleThumbDragOver}
              onDrop={() => handleThumbDrop(idx)}
              onDragEnd={handleThumbDragEnd}
            >
              {images[idx] ? (
                <img
                  src={images[idx]}
                  alt={`Thumbnail for ${getPageLabel(idx)}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span style={{ color: '#888', fontSize: '0.7rem', opacity: 0.7, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>{getPageLabel(idx)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InformationSystem;