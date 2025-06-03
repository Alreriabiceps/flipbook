import React, { useEffect, useState, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { FaChevronLeft, FaChevronRight, FaVolumeMute, FaVolumeUp, FaThList } from 'react-icons/fa';

const Viewing = () => {
  const [images, setImages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const flipBookRef = useRef();
  const [selectedPage, setSelectedPage] = useState(0);
  const [showToc, setShowToc] = useState(false);

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
    fetch(`${process.env.REACT_APP_API_URL}/api/images`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
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
        }
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

  // Responsive book size (no fullscreen)
  const bookRenderWidth = window.innerWidth < 640 ? 320 : window.innerWidth < 1024 ? 480 : 600;
  const bookRenderHeight = window.innerWidth < 640 ? 420 : window.innerWidth < 1024 ? 640 : 800;
  const minWidth = 220;
  const maxWidth = 1000;
  const minHeight = 320;
  const maxHeight = 1333;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-100 to-cyan-100 py-8 px-2 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl mx-auto mb-2">
        <div className="h-2 bg-gray-300 rounded">
          <div
            className="h-2 bg-blue-500 rounded transition-all duration-300"
            style={{ width: `${((selectedPage + 1) / (totalPages || 1)) * 100}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-700 mt-1">
          <span>
            {getPageLabel(selectedPage)} ({selectedPage + 1} / {totalPages})
          </span>
        </div>
      </div>
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
            width={bookRenderWidth}
            height={bookRenderHeight}
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
            {images.map((img, idx) => (
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
                {img && img.url ? (
                  <img
                    src={img.url}
                    alt={`Page ${idx} image`}
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
      {/* Quick Settings Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 shadow-xl rounded-lg flex items-center gap-1 px-1.5 py-1 z-50 border border-gray-300" style={{ minWidth: 0 }}>
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-opacity"
          disabled={selectedPage === 0}
          title="Previous Page"
        >
          <FaChevronLeft size={14} />
        </button>
        <button
          onClick={() => setShowToc((s) => !s)}
          className={`p-1.5 rounded-full ${showToc ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
          title={showToc ? 'Hide Table of Contents' : 'Show Table of Contents'}
        >
          <FaThList size={14} />
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          className={`p-1.5 rounded-full ${muted ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <FaVolumeMute size={14} />
          ) : (
            <FaVolumeUp size={14} />
          )}
        </button>
        <button
          onClick={handleNext}
          className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-opacity"
          disabled={selectedPage === totalPages - 1}
          title="Next Page"
        >
          <FaChevronRight size={14} />
        </button>
      </div>
      {/* Table of Contents Modal (Toggleable) */}
      {showToc && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowToc(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-blue-700 mb-3">Table of Contents</h3>
            <ul className="space-y-1">
              {images.map((_, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => { goToPage(idx); setShowToc(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded ${selectedPage === idx ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'} transition-colors text-sm`}
                  >
                    {getPageLabel(idx)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Viewing;