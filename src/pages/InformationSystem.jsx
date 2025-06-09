import React, { useState, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { FaUndo, FaRedo, FaVolumeMute, FaVolumeUp, FaExpand, FaCompress, FaFileUpload, FaPlusSquare, FaMinusSquare, FaQuestionCircle, FaPencilAlt, FaCheck, FaTimes, FaTrash, FaSave, FaChevronLeft, FaChevronRight, FaImages, FaCopy, FaEraser, FaDownload, FaShare, FaCrop, FaAdjust, FaPalette, FaFont, FaSearch, FaBookmark, FaEye, FaChartBar } from 'react-icons/fa';

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
  // Add pageNames state
  const [pageNames, setPageNames] = useState(() => [
    'Cover',
    ...Array(DEFAULT_NUM_CONTENT_PAGES).fill(null).map((_, i) => `Page ${i + 1}`),
    'Closing',
  ]);
  // For editing page names
  const [editingPageNameIdx, setEditingPageNameIdx] = useState(null);
  const [editingPageNameValue, setEditingPageNameValue] = useState('');
  // Enhanced UI states
  const [lastSaved, setLastSaved] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Feature 1: Bulk Upload
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bulkFiles, setBulkFiles] = useState([]);
  
  // Feature 2: Page Management
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  
  // Feature 3: Image Editor
  const [imageEditor, setImageEditor] = useState({ open: false, pageIndex: null, imageUrl: null });
  const [cropSettings, setCropSettings] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [imageFilters, setImageFilters] = useState({ brightness: 100, contrast: 100, saturation: 100 });
  
  // Feature 4: Image Quality
  const [qualitySettings, setQualitySettings] = useState({ format: 'auto', quality: 85, maxWidth: 1920 });
  
  // Feature 5: Text & Annotations
  const [textOverlays, setTextOverlays] = useState({}); // pageIndex -> array of text objects
  const [editingText, setEditingText] = useState(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textEditorSettings, setTextEditorSettings] = useState({
    text: 'New Text',
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Arial',
    x: 50,
    y: 50
  });
  
  // Feature 6: Templates & Layouts
  const [activeTemplate, setActiveTemplate] = useState('single');
  const [pageBackgrounds, setPageBackgrounds] = useState({});
  
  // Feature 7: Export Options
  const [exportModal, setExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Feature 8: Publishing
  const [shareModal, setShareModal] = useState(false);
  const [publishSettings, setPublishSettings] = useState({ public: false, password: '', domain: '' });
  
  // Feature 9: Metadata & Organization
  const [pageMetadata, setPageMetadata] = useState({}); // pageIndex -> { description, tags, category }
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Feature 10: Advanced Navigation
  const [bookmarks, setBookmarks] = useState(new Set());
  const [tableOfContents, setTableOfContents] = useState([]);
  const [pageLinks, setPageLinks] = useState({});
  
  // Feature 11: Analytics
  const [analytics, setAnalytics] = useState({ views: {}, timeSpent: {}, popularPages: [] });
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Feature 12: Accessibility
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [altTexts, setAltTexts] = useState({});
  const [highContrast, setHighContrast] = useState(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

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
    setUnsavedChanges(true);
  };
  const wrappedSetNumContentPages = (newNum) => {
    pushToHistory(images, numContentPages);
    setNumContentPages(newNum);
    setUnsavedChanges(true);
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
    fetch(`${import.meta.env.VITE_API_URL}/api/images`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Find the highest pageIndex to determine total pages (like in Viewing.jsx)
          const maxPage = data.reduce((max, img) => Math.max(max, img.pageIndex), 0);
          const totalPagesFromBackend = Math.max(maxPage + 1, totalPages); // Ensure we don't go below current totalPages
          
          // Update numContentPages based on backend data
          if (totalPagesFromBackend > totalPages) {
            setNumContentPages(totalPagesFromBackend - 2); // Subtract cover and closing pages
          }
          
          // Create images array with proper size
          const newImages = Array(totalPagesFromBackend).fill(null);
          data.forEach(img => {
            if (typeof img.pageIndex === 'number' && img.url) {
              newImages[img.pageIndex] = img.url;
            }
          });
          setImages(newImages);
          
          // Create page names array with proper size
          const newNames = Array(totalPagesFromBackend).fill(null);
          for (let i = 0; i < totalPagesFromBackend; i++) {
            if (i === 0) newNames[i] = 'Cover';
            else if (i === totalPagesFromBackend - 1) newNames[i] = 'Closing';
            else newNames[i] = `Page ${i}`;
          }
          
          // Update with custom names from backend
          data.forEach(img => {
            if (typeof img.pageIndex === 'number' && img.pageName) {
              newNames[img.pageIndex] = img.pageName;
            }
          });
          setPageNames(newNames);
        }
      })
      .catch(err => {
        // Optionally handle error
        console.error('Failed to fetch images from backend', err);
      });
  }, []); // Remove totalPages dependency to avoid infinite loop

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
          await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: data.secure_url, pageIndex: selectedPage, pageName: pageNames[selectedPage] })
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
            await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: data.secure_url, pageIndex: idx, pageName: pageNames[idx] })
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
  const handleRemovePage = async () => {
    if (numContentPages > 1) {
      const pageToRemove = totalPages - 1; // Always remove the last page
      console.log(`🗑️ Removing page ${pageToRemove}...`);
      
      // Check if the page being removed has an image
      const hasImage = images[pageToRemove] && images[pageToRemove] !== null;
      
      // Update frontend first
      wrappedSetNumContentPages(numContentPages - 1);
      if (selectedPage >= totalPages - 2) setSelectedPage(totalPages - 3);
      
      // Clean up the image array and related data
      const newImages = [...images];
      const newPageNames = [...pageNames];
      const newTextOverlays = { ...textOverlays };
      const newPageMetadata = { ...pageMetadata };
      const newAltTexts = { ...altTexts };
      
      // Remove data for the last page
      if (newImages.length > pageToRemove) {
        newImages.splice(pageToRemove, 1);
      }
      if (newPageNames.length > pageToRemove) {
        newPageNames.splice(pageToRemove, 1);
      }
      delete newTextOverlays[pageToRemove];
      delete newPageMetadata[pageToRemove];
      delete newAltTexts[pageToRemove];
      
      // Update state
      wrappedSetImages(newImages);
      setPageNames(newPageNames);
      setTextOverlays(newTextOverlays);
      setPageMetadata(newPageMetadata);
      setAltTexts(newAltTexts);
      
      // Remove from database if there was an image
      if (hasImage) {
        try {
          console.log(`💾 Removing page ${pageToRemove} from database...`);
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageIndex: pageToRemove })
          });
          
          if (response.ok) {
            console.log(`✅ Successfully removed page ${pageToRemove} from database`);
          } else {
            console.error(`❌ Failed to remove page ${pageToRemove} from database:`, response.status);
          }
        } catch (err) {
          console.error(`❌ Network error removing page ${pageToRemove} from database:`, err);
        }
      }
      
      console.log(`🧹 Page removal completed. New page count: ${numContentPages - 1}`);
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
    if (pageNames[idx]) return pageNames[idx];
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

  // Ensure pageNames array always matches totalPages
  React.useEffect(() => {
    setPageNames((prev) => {
      if (prev.length === totalPages) return prev;
      const newNames = [];
      for (let i = 0; i < totalPages; i++) {
        if (i === 0) newNames.push('Cover');
        else if (i === totalPages - 1) newNames.push('Closing');
        else newNames.push((prev[i] && prev[i] !== 'Closing') ? prev[i] : `Page ${i}`);
      }
      return newNames;
    });
  }, [totalPages]);

  // Save page name
  const handleSavePageName = (idx) => {
    setPageNames((prev) => {
      const newNames = [...prev];
      newNames[idx] = editingPageNameValue.trim() || getPageLabel(idx);
      return newNames;
    });
    setEditingPageNameIdx(null);
    setEditingPageNameValue('');
  };
  // Cancel edit
  const handleCancelPageName = () => {
    setEditingPageNameIdx(null);
    setEditingPageNameValue('');
  };
  // Start editing
  const handleEditPageName = (idx) => {
    setEditingPageNameIdx(idx);
    setEditingPageNameValue(pageNames[idx] || getPageLabel(idx));
  };

  // Delete image from current page
  const handleDeleteImage = async () => {
    if (!images[selectedPage]) {
      alert('No image to delete on this page.');
      return;
    }

    if (confirm(`Are you sure you want to delete the image from ${getPageLabel(selectedPage)}?`)) {
      console.log(`🗑️ Deleting image from page ${selectedPage}...`);
      
      const newImages = [...images];
      const imageUrl = newImages[selectedPage]; // Store for logging
      newImages[selectedPage] = null;
      
      // Update frontend first
      wrappedSetImages(newImages);

      // Remove from backend database
      try {
        console.log(`💾 Removing from database: page ${selectedPage}`);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageIndex: selectedPage })
        });
        
        if (response.ok) {
          console.log(`✅ Successfully deleted from database: page ${selectedPage}`);
        } else {
          console.error(`❌ Failed to delete from database: page ${selectedPage}`, response.status);
          const errorData = await response.json();
          console.error('Database delete error:', errorData);
        }
      } catch (err) {
        console.error(`❌ Network error deleting from database: page ${selectedPage}`, err);
        alert('⚠️ Image removed from editor but there was an error syncing with the database. Please check your connection.');
      }

      // Also clear related data
      const newTextOverlays = { ...textOverlays };
      delete newTextOverlays[selectedPage];
      setTextOverlays(newTextOverlays);

      const newPageMetadata = { ...pageMetadata };
      delete newPageMetadata[selectedPage];
      setPageMetadata(newPageMetadata);

      const newAltTexts = { ...altTexts };
      delete newAltTexts[selectedPage];
      setAltTexts(newAltTexts);

      console.log(`🧹 Cleaned up all data for page ${selectedPage}`);
    }
  };

  // Database cleanup utility function
  const cleanupOrphanedDatabaseRecords = async () => {
    try {
      console.log('🧹 Cleaning up orphaned database records...');
      
      // Get all current page indexes with images
      const currentPageIndexes = [];
      for (let i = 0; i < images.length; i++) {
        if (images[i] && images[i] !== null) {
          currentPageIndexes.push(i);
        }
      }
      
      // Get all database records
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/images`);
      if (!response.ok) return;
      
      const dbImages = await response.json();
      
      // Find orphaned records (in DB but not in current images)
      const orphanedIndexes = dbImages
        .map(img => img.pageIndex)
        .filter(pageIndex => !currentPageIndexes.includes(pageIndex));
      
      if (orphanedIndexes.length > 0) {
        console.log(`🗑️ Found ${orphanedIndexes.length} orphaned records:`, orphanedIndexes);
        
        // Try bulk delete first
        const deleteResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/images/bulk`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageIndexes: orphanedIndexes })
        });
        
        if (deleteResponse.ok) {
          const result = await deleteResponse.json();
          console.log(`✅ Cleaned up ${result.deletedCount} orphaned database records`);
        } else if (deleteResponse.status === 404) {
          // Fallback to individual deletes
          console.log('⚠️ Bulk delete not available, cleaning up orphaned records individually...');
          let cleanupCount = 0;
          for (const pageIndex of orphanedIndexes) {
            try {
              const individualResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageIndex })
              });
              if (individualResponse.ok) {
                cleanupCount++;
              }
            } catch (err) {
              console.error(`Failed to delete orphaned record ${pageIndex}:`, err);
            }
          }
          console.log(`✅ Individual cleanup completed: ${cleanupCount}/${orphanedIndexes.length} orphaned records removed`);
        }
      } else {
        console.log('✅ No orphaned database records found');
      }
    } catch (err) {
      console.error('❌ Error cleaning up database:', err);
    }
  };

  // Save all changes
  const handleSaveAll = async () => {
    if (!unsavedChanges) return;
    
    try {
      console.log('💾 Saving all changes...');
      
      // Save all page names and images that have been modified
      const promises = [];
      
      for (let i = 0; i < totalPages; i++) {
        if (images[i]) {
          promises.push(
            fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                url: images[i], 
                pageIndex: i, 
                pageName: pageNames[i] 
              })
            })
          );
        }
      }
      
      await Promise.all(promises);
      
      // Clean up any orphaned database records
      await cleanupOrphanedDatabaseRecords();
      
      setUnsavedChanges(false);
      setLastSaved(new Date());
      
      console.log('✅ All changes saved successfully');
      
    } catch (err) {
      console.error('❌ Error saving changes:', err);
      alert('Error saving changes. Please try again.');
    }
  };



  // Navigate pages
  const goToPreviousPage = () => {
    if (selectedPage > 0) {
      setSelectedPage(selectedPage - 1);
      if (flipBookRef.current?.pageFlip) {
        flipBookRef.current.pageFlip().flip(selectedPage - 1);
      }
      trackPageView(selectedPage - 1);
    }
  };

  const goToNextPage = () => {
    if (selectedPage < totalPages - 1) {
      setSelectedPage(selectedPage + 1);
      if (flipBookRef.current?.pageFlip) {
        flipBookRef.current.pageFlip().flip(selectedPage + 1);
      }
      trackPageView(selectedPage + 1);
    }
  };

  // FEATURE 1: BULK UPLOAD
  const handleBulkUpload = async (files) => {
    setBulkUploadMode(true);
    setUploadProgress(0);
    setBulkFiles(Array.from(files));
    
    const totalFiles = files.length;
    let newImages = [...images];
    let newPageNames = [...pageNames];
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`🚀 Starting bulk upload of ${totalFiles} files...`);
    console.log('Current total pages:', totalPages);
    console.log('Current images array length:', images.length);
    
    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      
      try {
        console.log(`📤 Uploading file ${i + 1}/${totalFiles}: ${file.name}`);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        
        if (data.secure_url) {
          // Find the next available page slot
          let targetIndex = -1;
          
          // First, try to fill any empty slots
          for (let j = 0; j < newImages.length; j++) {
            if (!newImages[j] || newImages[j] === null) {
              targetIndex = j;
              break;
            }
          }
          
          // If no empty slots, add to the end
          if (targetIndex === -1) {
            targetIndex = newImages.length;
            newImages.push(null); // Expand the array
            newPageNames.push(''); // Expand page names array
            
            // Increase page count
            setNumContentPages(prev => {
              console.log(`📄 Adding new page, increasing from ${prev} to ${prev + 1}`);
              return prev + 1;
            });
          }
          
          console.log(`✅ Assigning image ${i + 1} to page index ${targetIndex}`);
          
          // Set the image
          newImages[targetIndex] = data.secure_url;
          
          // Auto-name based on filename
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          newPageNames[targetIndex] = fileName || `Page ${targetIndex + 1}`;
          
          // Save to backend
          try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                url: data.secure_url, 
                pageIndex: targetIndex, 
                pageName: newPageNames[targetIndex] 
              })
            });
            console.log(`💾 Saved to database: page ${targetIndex}`);
          } catch (dbError) {
            console.error('Database save error:', dbError);
          }
          
          successCount++;
        } else {
          console.error('❌ Upload failed for file:', file.name, data);
          errorCount++;
        }
        
        setUploadProgress(((i + 1) / totalFiles) * 100);
      } catch (err) {
        console.error('❌ Bulk upload error for file:', file.name, err);
        errorCount++;
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }
    }
    
    // Update all state at once
    wrappedSetImages(newImages);
    setPageNames(newPageNames);
    
    console.log(`✅ Bulk upload completed! Success: ${successCount}, Errors: ${errorCount}`);
    console.log('Final images array length:', newImages.length);
    console.log('Images with content:', newImages.filter(img => img).length);
    
    // Show completion message
    if (successCount > 0) {
      alert(`✅ Bulk upload completed!\n\n📸 Successfully uploaded: ${successCount} images\n${errorCount > 0 ? `❌ Failed: ${errorCount} images` : ''}\n\n📄 Total pages now: ${newImages.length}`);
    } else {
      alert(`❌ Bulk upload failed!\n\nNo images were uploaded successfully. Please check your internet connection and try again.`);
    }
    
    setBulkUploadMode(false);
    setBulkFiles([]);
  };

  // FEATURE 2: PAGE MANAGEMENT
  const handleSelectPage = (idx) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedPages(newSelected);
  };

  const handleDuplicatePage = (idx) => {
    const newImages = [...images];
    const newPageNames = [...pageNames];
    
    // Insert after current page
    newImages.splice(idx + 1, 0, images[idx]);
    newPageNames.splice(idx + 1, 0, `${pageNames[idx]} (Copy)`);
    
    wrappedSetImages(newImages);
    setPageNames(newPageNames);
    setNumContentPages(prev => prev + 1);
  };

  const handleClearAllPages = async () => {
    if (confirm('Are you sure you want to clear all pages? This cannot be undone.')) {
      console.log(`🗑️ Clearing all ${totalPages} pages...`);
      
      // Update frontend first
      const clearedImages = Array(totalPages).fill(null);
      wrappedSetImages(clearedImages);
      setTextOverlays({});
      setPageMetadata({});
      setAltTexts({});

      // Clear from database - find all page indexes that have images
      const pageIndexesToDelete = [];
      for (let i = 0; i < images.length; i++) {
        if (images[i] && images[i] !== null) {
          pageIndexesToDelete.push(i);
        }
      }

      if (pageIndexesToDelete.length > 0) {
        try {
          console.log(`💾 Clearing ${pageIndexesToDelete.length} pages from database...`);
          
          // Try bulk delete endpoint first
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/images/bulk`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageIndexes: pageIndexesToDelete })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Successfully cleared ${result.deletedCount} pages from database`);
          } else if (response.status === 404) {
            console.log('⚠️ Bulk delete endpoint not available, falling back to individual deletes...');
            
            // Fallback: Delete each page individually
            let deleteCount = 0;
            for (const pageIndex of pageIndexesToDelete) {
              try {
                const individualResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pageIndex })
                });
                if (individualResponse.ok) {
                  deleteCount++;
                }
              } catch (individualErr) {
                console.error(`Failed to delete page ${pageIndex}:`, individualErr);
              }
            }
            console.log(`✅ Fallback deletion completed: ${deleteCount}/${pageIndexesToDelete.length} pages deleted`);
          } else {
            console.error('❌ Failed to clear pages from database:', response.status);
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Database clear error:', errorData);
            alert('⚠️ Pages cleared from editor but there was an error syncing with the database.');
          }
        } catch (err) {
          console.error('❌ Network error clearing database:', err);
          
          // Fallback: Try individual deletes on network error too
          console.log('🔄 Attempting fallback individual deletes due to network error...');
          let deleteCount = 0;
          for (const pageIndex of pageIndexesToDelete) {
            try {
              const individualResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageIndex })
              });
              if (individualResponse.ok) {
                deleteCount++;
              }
            } catch (individualErr) {
              console.error(`Failed to delete page ${pageIndex}:`, individualErr);
            }
          }
          
          if (deleteCount > 0) {
            console.log(`✅ Fallback deletion completed: ${deleteCount}/${pageIndexesToDelete.length} pages deleted`);
          } else {
            alert('⚠️ Pages cleared from editor but there was an error syncing with the database. Please check your connection.');
          }
        }
      }

      console.log('🧹 All pages cleared successfully');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size > 0 && confirm(`Delete ${selectedPages.size} selected pages?`)) {
      console.log(`🗑️ Bulk deleting ${selectedPages.size} selected pages:`, Array.from(selectedPages));
      
      // Find which selected pages actually have images to delete from database
      const pageIndexesToDelete = Array.from(selectedPages).filter(pageIndex => 
        images[pageIndex] && images[pageIndex] !== null
      );
      
      // Update frontend first
      const newImages = images.filter((_, idx) => !selectedPages.has(idx));
      const newPageNames = pageNames.filter((_, idx) => !selectedPages.has(idx));
      
      // Clean up related data for deleted pages
      const newTextOverlays = { ...textOverlays };
      const newPageMetadata = { ...pageMetadata };
      const newAltTexts = { ...altTexts };
      
      selectedPages.forEach(pageIndex => {
        delete newTextOverlays[pageIndex];
        delete newPageMetadata[pageIndex];
        delete newAltTexts[pageIndex];
      });
      
      // Update all frontend state
      wrappedSetImages(newImages);
      setPageNames(newPageNames);
      setTextOverlays(newTextOverlays);
      setPageMetadata(newPageMetadata);
      setAltTexts(newAltTexts);
      setSelectedPages(new Set());
      setNumContentPages(Math.max(1, newImages.length - 2));

      // Delete from database if there are images to delete
      if (pageIndexesToDelete.length > 0) {
        try {
          console.log(`💾 Deleting ${pageIndexesToDelete.length} pages from database:`, pageIndexesToDelete);
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/images/bulk`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageIndexes: pageIndexesToDelete })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Successfully deleted ${result.deletedCount} pages from database`);
          } else if (response.status === 404) {
            console.log('⚠️ Bulk delete endpoint not available, falling back to individual deletes...');
            
            // Fallback: Delete each page individually
            let deleteCount = 0;
            for (const pageIndex of pageIndexesToDelete) {
              try {
                const individualResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pageIndex })
                });
                if (individualResponse.ok) {
                  deleteCount++;
                }
              } catch (individualErr) {
                console.error(`Failed to delete page ${pageIndex}:`, individualErr);
              }
            }
            console.log(`✅ Fallback deletion completed: ${deleteCount}/${pageIndexesToDelete.length} pages deleted`);
          } else {
            console.error('❌ Failed to delete selected pages from database:', response.status);
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Database bulk delete error:', errorData);
            alert('⚠️ Pages deleted from editor but there was an error syncing with the database.');
          }
        } catch (err) {
          console.error('❌ Network error bulk deleting from database:', err);
          
          // Fallback: Try individual deletes on network error too
          console.log('🔄 Attempting fallback individual deletes due to network error...');
          let deleteCount = 0;
          for (const pageIndex of pageIndexesToDelete) {
            try {
              const individualResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageIndex })
              });
              if (individualResponse.ok) {
                deleteCount++;
              }
            } catch (individualErr) {
              console.error(`Failed to delete page ${pageIndex}:`, individualErr);
            }
          }
          
          if (deleteCount > 0) {
            console.log(`✅ Fallback deletion completed: ${deleteCount}/${pageIndexesToDelete.length} pages deleted`);
          } else {
            alert('⚠️ Pages deleted from editor but there was an error syncing with the database. Please check your connection.');
          }
        }
      }

      console.log(`🧹 Bulk delete completed. Remaining pages: ${newImages.length}`);
    }
  };

  // FEATURE 3: IMAGE EDITOR
  const openImageEditor = (pageIndex) => {
    setImageEditor({ open: true, pageIndex, imageUrl: images[pageIndex] });
  };

  const applyImageFilters = async (pageIndex, filters) => {
    // In a real implementation, you'd process the image with canvas/WebGL
    // For now, we'll simulate the filter application
    console.log('Applying filters:', filters, 'to page:', pageIndex);
    setImageFilters(filters);
  };

  const cropImage = async (pageIndex, cropData) => {
    // Simulate crop operation
    console.log('Cropping image:', cropData, 'on page:', pageIndex);
    setCropSettings(cropData);
  };

  // FEATURE 4: IMAGE QUALITY CONTROL
  const optimizeImage = async (imageUrl, settings) => {
    // Simulate image optimization
    return imageUrl; // In reality, you'd process the image
  };

  // FEATURE 5: TEXT & ANNOTATIONS
  const addTextOverlay = (pageIndex, textData) => {
    const newOverlays = { ...textOverlays };
    if (!newOverlays[pageIndex]) newOverlays[pageIndex] = [];
    newOverlays[pageIndex].push({
      id: Date.now(),
      text: textData.text,
      x: textData.x || 50,
      y: textData.y || 50,
      fontSize: textData.fontSize || 16,
      color: textData.color || '#000000',
      fontFamily: textData.fontFamily || 'Arial'
    });
    setTextOverlays(newOverlays);
  };

  const updateTextOverlay = (pageIndex, textId, updates) => {
    const newOverlays = { ...textOverlays };
    if (newOverlays[pageIndex]) {
      newOverlays[pageIndex] = newOverlays[pageIndex].map(text => 
        text.id === textId ? { ...text, ...updates } : text
      );
      setTextOverlays(newOverlays);
    }
  };

  const deleteTextOverlay = (pageIndex, textId) => {
    const newOverlays = { ...textOverlays };
    if (newOverlays[pageIndex]) {
      newOverlays[pageIndex] = newOverlays[pageIndex].filter(text => text.id !== textId);
      setTextOverlays(newOverlays);
    }
  };

  // FEATURE 6: TEMPLATES & LAYOUTS
  const applyTemplate = (templateName) => {
    setActiveTemplate(templateName);
    // Apply template-specific styling
  };

  const setPageBackground = (pageIndex, background) => {
    const newBackgrounds = { ...pageBackgrounds };
    newBackgrounds[pageIndex] = background;
    setPageBackgrounds(newBackgrounds);
  };

  // FEATURE 7: EXPORT OPTIONS
  const exportToPDF = async () => {
    setExportModal(true);
    setExportProgress(0);
    
    try {
      // Dynamic imports for PDF generation
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      console.log('Starting PDF export...');
      console.log('Images array:', images);
      console.log('Total pages:', totalPages);
      
      // Create new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      let addedPages = 0;
      const pagesWithImages = [];
      
      // Find all pages with images
      for (let i = 0; i < totalPages; i++) {
        if (images[i] && images[i] !== null && images[i] !== '') {
          pagesWithImages.push(i);
        }
      }
      
      console.log('Pages with images:', pagesWithImages);
      
      if (pagesWithImages.length === 0) {
        alert('No images to export. Please add some images first.');
        setExportModal(false);
        return;
      }
      
      // Process each page with an image
      for (const pageIndex of pagesWithImages) {
        console.log(`Processing page ${pageIndex} with image:`, images[pageIndex]);
        
        setExportProgress((addedPages / pagesWithImages.length) * 80);
        
        try {
          // Simplified approach: directly add the image to PDF
          const imageUrl = images[pageIndex];
          
          // Create a temporary image element to get dimensions
          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = () => {
              console.error(`Failed to load image for page ${pageIndex}:`, imageUrl);
              reject(new Error(`Failed to load image`));
            };
            tempImg.src = imageUrl;
          });
          
          console.log(`Image loaded for page ${pageIndex}, dimensions:`, tempImg.width, 'x', tempImg.height);
          
          // Add new page if not the first one
          if (addedPages > 0) {
            pdf.addPage();
          }
          
          // Calculate dimensions to fit A4
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const margin = 20;
          const availableWidth = pdfWidth - (margin * 2);
          const availableHeight = pdfHeight - (margin * 3); // Extra margin for page label
          
          // Calculate scaling to fit the image
          const imgAspectRatio = tempImg.width / tempImg.height;
          let imgWidth = availableWidth;
          let imgHeight = availableWidth / imgAspectRatio;
          
          // If image is too tall, scale by height instead
          if (imgHeight > availableHeight) {
            imgHeight = availableHeight;
            imgWidth = availableHeight * imgAspectRatio;
          }
          
          // Center the image
          const x = (pdfWidth - imgWidth) / 2;
          const y = margin;
          
          // Add image to PDF
          pdf.addImage(imageUrl, 'JPEG', x, y, imgWidth, imgHeight);
          
          // Add page label at bottom
          pdf.setFontSize(12);
          pdf.setTextColor(100, 100, 100);
          const pageLabel = getPageLabel(pageIndex);
          pdf.text(pageLabel, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
          
          // Add text overlays if any
          if (textOverlays[pageIndex] && textOverlays[pageIndex].length > 0) {
            console.log(`Adding ${textOverlays[pageIndex].length} text overlays for page ${pageIndex}`);
            
            textOverlays[pageIndex].forEach((text, textIndex) => {
              try {
                // Convert percentage positions to PDF coordinates
                const textX = x + (imgWidth * text.x / 100);
                const textY = y + (imgHeight * text.y / 100);
                
                // Set text properties
                pdf.setFontSize(Math.max(8, Math.min(24, text.fontSize * 0.75))); // Scale font size for PDF
                pdf.setTextColor(text.color);
                
                // Add text to PDF
                pdf.text(text.text, textX, textY, { 
                  align: 'center',
                  maxWidth: imgWidth * 0.8 // Prevent text from going outside image bounds
                });
              } catch (textError) {
                console.error(`Error adding text overlay ${textIndex} for page ${pageIndex}:`, textError);
              }
            });
          }
          
          addedPages++;
          console.log(`Successfully processed page ${pageIndex}, total pages added: ${addedPages}`);
          
        } catch (pageError) {
          console.error(`Error processing page ${pageIndex}:`, pageError);
          // Continue with next page
        }
      }
      
      console.log(`PDF generation complete. Total pages added: ${addedPages}`);
      
      setExportProgress(90);
      
      if (addedPages === 0) {
        alert('No pages could be processed. Please check that your images are accessible.');
        setExportModal(false);
        return;
      }
      
      // Generate and save PDF
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flipbook-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportProgress(100);
      
      // Success message
      setTimeout(() => {
        alert(`PDF exported successfully! ${addedPages} pages included.`);
        setExportModal(false);
      }, 500);
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert(`Failed to export PDF: ${error.message}. Please check the browser console for details.`);
      setExportModal(false);
    }
  };

  const exportAsImages = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      let processedCount = 0;
      const imagesToExport = images.filter(img => img);
      
      if (imagesToExport.length === 0) {
        alert('No images to export. Please add some images first.');
        return;
      }
      
      // Show progress
      setExportModal(true);
      setExportProgress(0);
      
      for (let idx = 0; idx < totalPages; idx++) {
        if (!images[idx]) continue;
        
        try {
          // Fetch the actual image data
          const response = await fetch(images[idx]);
          const blob = await response.blob();
          
          // Get file extension from URL or default to jpg
          const url = images[idx];
          const extension = url.split('.').pop()?.toLowerCase() || 'jpg';
          const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
          const fileExt = validExtensions.includes(extension) ? extension : 'jpg';
          
          const imageName = `${getPageLabel(idx)}.${fileExt}`;
          zip.file(imageName, blob);
          
          processedCount++;
          setExportProgress((processedCount / imagesToExport.length) * 90);
          
        } catch (imageError) {
          console.error(`Error processing image ${idx}:`, imageError);
          // Continue with next image
        }
      }
      
      setExportProgress(95);
      
      // Generate ZIP file
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Download the ZIP
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flipbook-images-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportProgress(100);
      
      setTimeout(() => {
        alert(`Images exported successfully! ${processedCount} images included in ZIP file.`);
        setExportModal(false);
      }, 500);
      
    } catch (error) {
      console.error('Images Export Error:', error);
      alert('Failed to export images. Please try again.');
      setExportModal(false);
    }
  };

  // FEATURE 8: PUBLISHING
  const generateShareLink = () => {
    const shareId = Math.random().toString(36).substr(2, 9);
    return `${window.location.origin}/flipbook/view/${shareId}`;
  };

  const publishFlipbook = async (settings) => {
    try {
      setPublishSettings(settings);
      
      // Prepare flipbook data for sharing
      const flipbookData = {
        name: `Flipbook ${new Date().toLocaleDateString()}`,
        description: `Flipbook with ${images.filter(img => img).length} pages`,
        settings: {
          ...settings,
          totalPages,
          pageNames
        },
        isPublic: settings.public,
        password: settings.password || '',
        images: images.map((img, idx) => ({
          url: img,
          pageIndex: idx,
          pageName: pageNames[idx] || getPageLabel(idx),
          textOverlays: textOverlays[idx] || [],
          altText: altTexts[idx] || '',
          metadata: pageMetadata[idx] || {}
        })).filter(item => item.url), // Only include pages with images
        textOverlays,
        pageMetadata,
        altTexts,
        createdAt: new Date().toISOString()
      };

      console.log('Publishing flipbook:', flipbookData);

      // Save to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flipbookData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const savedProject = await response.json();
      const shareLink = `${window.location.origin}/flipbook/view/${savedProject.shareId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      
      alert(`✅ Flipbook published successfully!\n\n🔗 Share link copied to clipboard:\n${shareLink}\n\n🔒 Privacy: ${settings.public ? 'Public' : 'Private'}\n📄 Pages: ${flipbookData.images.length}`);
      
      setShareModal(false);

    } catch (error) {
      console.error('Publishing error:', error);
      alert(`❌ Failed to publish flipbook: ${error.message}\n\nPlease try again or check your internet connection.`);
    }
  };

  // New function to create shareable snapshot
  const createQuickShare = async () => {
    try {
      const imagesWithContent = images.filter(img => img);
      
      if (imagesWithContent.length === 0) {
        alert('❌ No images to share! Please add some images first.');
        return;
      }

      // Quick share with default settings
      const quickSettings = {
        public: true,
        password: '',
        allowDownload: true,
        showAnalytics: false
      };

      await publishFlipbook(quickSettings);
      
    } catch (error) {
      console.error('Quick share error:', error);
      alert('❌ Quick share failed. Please try the full share options.');
    }
  };

  // FEATURE 9: METADATA & ORGANIZATION
  const updatePageMetadata = (pageIndex, metadata) => {
    const newMetadata = { ...pageMetadata };
    newMetadata[pageIndex] = { ...newMetadata[pageIndex], ...metadata };
    setPageMetadata(newMetadata);
  };

  const searchPages = (query) => {
    setSearchQuery(query);
    // Filter pages based on search query
  };

  // FEATURE 10: ADVANCED NAVIGATION
  const toggleBookmark = (pageIndex) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(pageIndex)) {
      newBookmarks.delete(pageIndex);
    } else {
      newBookmarks.add(pageIndex);
    }
    setBookmarks(newBookmarks);
  };

  const generateTableOfContents = () => {
    const toc = pageNames.map((name, idx) => ({ page: idx, title: name }));
    setTableOfContents(toc);
  };

  // FEATURE 11: ANALYTICS
  const trackPageView = (pageIndex) => {
    const newAnalytics = { ...analytics };
    newAnalytics.views[pageIndex] = (newAnalytics.views[pageIndex] || 0) + 1;
    setAnalytics(newAnalytics);
  };

  const getPopularPages = () => {
    return Object.entries(analytics.views)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pageIndex, views]) => ({ pageIndex: parseInt(pageIndex), views }));
  };

  // FEATURE 12: ACCESSIBILITY
  const updateAltText = (pageIndex, altText) => {
    const newAltTexts = { ...altTexts };
    newAltTexts[pageIndex] = altText;
    setAltTexts(newAltTexts);
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  const toggleAccessibilityMode = () => {
    const newMode = !accessibilityMode;
    setAccessibilityMode(newMode);
    
    // Apply accessibility changes to document
    if (newMode) {
      document.body.classList.add('accessibility-mode');
      document.body.style.fontSize = '18px';
      document.body.style.lineHeight = '1.6';
    } else {
      document.body.classList.remove('accessibility-mode');
      document.body.style.fontSize = '';
      document.body.style.lineHeight = '';
    }
  };

      return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${
      accessibilityMode 
        ? 'bg-white text-black' 
        : highContrast 
          ? 'bg-black text-white' 
          : 'bg-gray-50'
    }`}>
              {/* Compact Professional Control Bar */}
        <div className={`border-b shadow-sm transition-all duration-300 ${
          accessibilityMode 
            ? 'bg-gray-100 border-gray-400 text-black' 
            : highContrast 
              ? 'bg-gray-900 border-gray-600 text-white' 
              : 'bg-white border-gray-200'
        }`}>
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Navigation & Core Actions */}
            <div className="flex items-center gap-3">
              {/* Page Navigation */}
              <div className="flex items-center bg-gray-50 rounded-lg p-1">
                <button 
                  onClick={goToPreviousPage} 
                  className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all" 
                  disabled={selectedPage === 0}
                  title="Previous Page"
                >
                  <FaChevronLeft size={12} />
                </button>
                <select
                  value={selectedPage}
                  onChange={e => setSelectedPage(Number(e.target.value))}
                  className="border-0 bg-transparent px-2 py-1.5 text-sm font-medium text-gray-700 focus:outline-none min-w-[100px]"
                >
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <option key={idx} value={idx}>{getPageLabel(idx)}</option>
                  ))}
                </select>
                <button 
                  onClick={goToNextPage} 
                  className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all" 
                  disabled={selectedPage === totalPages - 1}
                  title="Next Page"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Image Actions */}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5">
                  <FaFileUpload size={12} /> {uploading ? 'Uploading...' : 'Upload'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
                </label>
                <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5">
                  <FaImages size={12} /> Bulk
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleBulkUpload(e.target.files)} 
                    disabled={uploading} 
                  />
                </label>
                <button 
                  onClick={() => openImageEditor(selectedPage)} 
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5" 
                  disabled={!images[selectedPage]}
                  title="Edit Image"
                >
                  <FaCrop size={12} />
                </button>
                <button 
                  onClick={handleDeleteImage} 
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5" 
                  disabled={!images[selectedPage] || uploading} 
                  title="Delete Image"
                >
                  <FaTrash size={12} />
                </button>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Page Management */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleAddPage} 
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5" 
                  disabled={uploading}
                  title="Add Page"
                >
                  <FaPlusSquare size={12} />
                </button>
                <button 
                  onClick={() => handleDuplicatePage(selectedPage)} 
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5" 
                  disabled={uploading}
                  title="Duplicate Page"
                >
                  <FaCopy size={12} />
                </button>
                <button 
                  onClick={handleRemovePage} 
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5" 
                  disabled={numContentPages <= 1 || uploading}
                  title="Remove Page"
                >
                  <FaMinusSquare size={12} />
                </button>
                <button 
                  onClick={handleClearAllPages} 
                  className="bg-red-700 hover:bg-red-800 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5" 
                  title="Clear All Pages"
                >
                  <FaEraser size={12} />
                </button>
              </div>
            </div>

            {/* Right: Status & Tools */}
            <div className="flex items-center gap-3">
              {/* Save Status */}
              <div className="flex items-center gap-2">
                {unsavedChanges && (
                  <span className="text-orange-600 text-sm font-medium">● Unsaved</span>
                )}
                <button 
                  onClick={handleSaveAll} 
                  className={`text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 ${
                    unsavedChanges 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!unsavedChanges}
                  title="Save All Changes"
                >
                  <FaSave size={12} /> Save
                </button>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* Edit Tools */}
              <div className="flex items-center bg-gray-50 rounded-lg p-1">
                <button 
                  onClick={handleUndo} 
                  className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all" 
                  title="Undo" 
                  disabled={history.length === 0}
                >
                  <FaUndo size={12} />
                </button>
                <button 
                  onClick={handleRedo} 
                  className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all" 
                  title="Redo" 
                  disabled={future.length === 0}
                >
                  <FaRedo size={12} />
                </button>
              </div>

              {/* Advanced Features */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowTextEditor(true)} 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5" 
                  title="Add Text"
                >
                  <FaFont size={12} />
                </button>
                <button 
                  onClick={() => toggleBookmark(selectedPage)} 
                  className={`text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 ${
                    bookmarks.has(selectedPage) 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`} 
                  title="Bookmark Page"
                >
                  <FaBookmark size={12} />
                </button>
                <div className="relative group">
                  <button 
                    onClick={exportToPDF} 
                    className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5" 
                    title="Export Options"
                  >
                    <FaDownload size={12} /> PDF
                  </button>
                </div>
                <div className="relative group">
                  <button 
                    onClick={() => setShareModal(true)} 
                    className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5" 
                    title="Share Options"
                  >
                    <FaShare size={12} /> Share
                  </button>
                  
                  {/* Quick share tooltip */}
                  <div className="absolute top-full left-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      Right-click for quick share
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAnalytics(!showAnalytics)} 
                  className={`text-sm font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 ${
                    showAnalytics 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`} 
                  title="Analytics"
                >
                  <FaChartBar size={12} />
                </button>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>

              {/* View Controls */}
              <div className="flex items-center bg-gray-50 rounded-lg p-1">
                <button 
                  onClick={() => setMuted((m) => !m)} 
                  className={`p-1.5 rounded transition-all ${muted ? 'bg-gray-400 text-white' : 'hover:bg-white hover:shadow-sm text-gray-600'}`} 
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
                </button>
                <button 
                  onClick={() => setShowAccessibilityPanel(true)} 
                  className={`p-1.5 rounded transition-all ${
                    accessibilityMode || highContrast || screenReaderMode 
                      ? 'bg-green-500 text-white' 
                      : 'hover:bg-white hover:shadow-sm text-gray-600'
                  }`} 
                  title="Accessibility Options"
                  aria-label="Open accessibility settings"
                >
                  <FaEye size={12} />
                </button>
                <button 
                  onClick={handleFullscreen} 
                  className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 transition-all" 
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
                </button>
                <button 
                  onClick={() => setShowInstructions((v) => !v)} 
                  className={`p-1.5 rounded transition-all ${showInstructions ? 'bg-blue-100 text-blue-600' : 'hover:bg-white hover:shadow-sm text-gray-600'}`} 
                  title="Help"
                >
                  <FaQuestionCircle size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Instructions */}
      {showInstructions && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-full mx-auto px-4 py-2">
            <div className="text-sm text-blue-800">
              <span className="font-semibold">Quick Help:</span> 
              <span className="ml-2">Upload images • Add/Remove pages • Drag page chips to reorder • Click ✏️ to rename • Save changes when done</span>
            </div>
          </div>
        </div>
      )}

      {/* Compact Page Navigator */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-full mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Pages:</span>
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => searchPages(e.target.value)}
                  className="pl-6 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 w-32"
                />
                <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={10} />
              </div>
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((selectedPage + 1) / totalPages) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {selectedPage + 1}/{totalPages}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-1 rounded px-2 py-1 border cursor-move transition-all ${
                    draggedThumb === idx 
                      ? 'bg-blue-100 border-blue-300 opacity-60' 
                      : selectedPage === idx
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  draggable
                  onDragStart={() => handleThumbDragStart(idx)}
                  onDragOver={handleThumbDragOver}
                  onDrop={() => handleThumbDrop(idx)}
                  onDragEnd={handleThumbDragEnd}
                  title={`Drag to reorder • ${getPageLabel(idx)}`}
                >
                  <button
                    className={`text-xs font-medium transition-colors min-w-0 ${
                      selectedPage === idx 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => handleQuickNav(idx)}
                  >
                    {getPageLabel(idx)}
                  </button>
                  
                  {/* Status indicator */}
                  <span 
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      images[idx] ? 'bg-green-500' : 'bg-gray-300'
                    }`} 
                    title={images[idx] ? 'Has image' : 'No image'}
                  ></span>
                  
                  {/* Edit controls */}
                  {editingPageNameIdx === idx ? (
                    <div className="flex items-center gap-1 ml-1">
                      <input
                        className="border rounded px-1 py-0.5 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={editingPageNameValue}
                        onChange={e => setEditingPageNameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSavePageName(idx);
                          if (e.key === 'Escape') handleCancelPageName();
                        }}
                        autoFocus
                      />
                      <button 
                        className="text-green-600 hover:text-green-800 p-0.5" 
                        onClick={() => handleSavePageName(idx)} 
                        title="Save"
                      >
                        <FaCheck size={8} />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800 p-0.5" 
                        onClick={handleCancelPageName} 
                        title="Cancel"
                      >
                        <FaTimes size={8} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="text-gray-400 hover:text-blue-600 p-0.5 ml-1 transition-colors" 
                      onClick={() => handleEditPageName(idx)} 
                      title="Edit page name"
                    >
                      <FaPencilAlt size={8} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Book Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          ref={bookContainerRef}
          className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl'}`}
          style={{
            width: isFullscreen ? '100vw' : undefined,
            height: isFullscreen ? '100vh' : undefined,
            maxWidth: isFullscreen ? '100vw' : undefined,
            maxHeight: isFullscreen ? '100vh' : undefined,
            margin: isFullscreen ? '0' : undefined,
            padding: isFullscreen ? '2rem' : undefined,
            boxSizing: isFullscreen ? 'border-box' : undefined,
          }}
        >
          {/* Spinner overlay when uploading */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              <span className="ml-3 text-white text-sm font-medium">Uploading...</span>
            </div>
          )}
          
          <div
            className="relative w-full flex justify-center mx-auto"
            style={{
              perspective: "2500px",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Book Binding Shadow */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/20 via-black/40 to-black/20 z-20 rounded shadow-md"></div>

            {/* Simulated Page Edges */}
            <div className="absolute -left-1 -top-0.5 w-[calc(100%+8px)] h-[calc(100%+4px)] bg-gradient-to-b from-gray-100 to-gray-200 rounded-md shadow-inner z-5"></div>

            <HTMLFlipBook
              ref={flipBookRef}
              width={bookWidth}
              height={bookHeight}
              size="stretch"
              minWidth={minWidth}
              maxWidth={maxWidth}
              minHeight={minHeight}
              maxHeight={maxHeight}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              useMouseEvents={true}
              drawShadow={true}
              flippingTime={600}
              className="mx-auto relative z-10 shadow-lg"
              style={{ transformStyle: "preserve-3d" }}
              onFlip={handleFlip}
            >
              {Array.from({ length: totalPages }).map((_, idx) => (
                <div
                  key={idx}
                  className={`page flex items-center justify-center ${dragOverPage === idx ? 'ring-2 ring-blue-400' : ''}`}
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
                      alt={altTexts[idx] || `${getPageLabel(idx)} image`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      role={screenReaderMode ? 'img' : undefined}
                      aria-describedby={screenReaderMode && altTexts[idx] ? `alt-${idx}` : undefined}
                    />
                  ) : (
                    <span style={{ color: 'white', fontSize: '1rem', opacity: 0.6, textAlign: 'center' }}>
                      {`No image uploaded for ${getPageLabel(idx)}`}
                    </span>
                  )}
                  {/* Page label */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 0,
                      width: '100%',
                      textAlign: 'center',
                      color: '#fff',
                      fontSize: '0.875rem',
                      opacity: 0.8,
                      letterSpacing: '0.05em',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {getPageLabel(idx)}
                  </div>
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        </div>
      </div>

      {/* Page Previews Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Page Previews:</span>
            <span className="text-xs text-gray-500">Drag to reorder pages</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <div
                key={idx}
                className={`relative flex-shrink-0 bg-white rounded-lg border-2 transition-all duration-200 cursor-move ${
                  selectedPage === idx 
                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                    : draggedThumb === idx
                      ? 'border-blue-300 opacity-60'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                style={{ width: '80px', height: '100px' }}
                draggable
                onDragStart={() => handleThumbDragStart(idx)}
                onDragOver={handleThumbDragOver}
                onDrop={() => handleThumbDrop(idx)}
                onDragEnd={handleThumbDragEnd}
                onClick={() => handleQuickNav(idx)}
                title={`${getPageLabel(idx)} - Click to navigate, drag to reorder`}
              >
                {/* Preview Image */}
                <div className="w-full h-full rounded-md overflow-hidden bg-black flex items-center justify-center">
                  {images[idx] ? (
                    <img
                      src={images[idx]}
                      alt={`Preview of ${getPageLabel(idx)}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white text-xs text-center opacity-60 px-1">
                      No Image
                    </div>
                  )}
                </div>

                {/* Page Label Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-md">
                  <div className="text-white text-xs font-medium text-center py-1 px-1 truncate">
                    {getPageLabel(idx)}
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {/* Image status */}
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      images[idx] ? 'bg-green-500' : 'bg-red-400'
                    }`}
                    title={images[idx] ? 'Has image' : 'No image'}
                  ></div>
                  
                  {/* Current page indicator */}
                  {selectedPage === idx && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" title="Current page"></div>
                  )}
                </div>

                {/* Drag handle indicator */}
                <div className="absolute top-1 left-1 opacity-40 hover:opacity-70 transition-opacity">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-white">
                    <circle cx="2" cy="2" r="0.5"/>
                    <circle cx="6" cy="2" r="0.5"/>
                    <circle cx="2" cy="6" r="0.5"/>
                    <circle cx="6" cy="6" r="0.5"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURE MODALS & OVERLAYS */}
      
      {/* Bulk Upload Progress */}
      {bulkUploadMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Bulk Upload Progress</h3>
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Uploading {bulkFiles.length} files... {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {imageEditor.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4/5 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Image Editor</h3>
              <button 
                onClick={() => setImageEditor({ open: false, pageIndex: null, imageUrl: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Image Preview */}
              <div className="md:col-span-2">
                <div className="border rounded-lg p-4 bg-gray-50">
                  {imageEditor.imageUrl && (
                    <img 
                      src={imageEditor.imageUrl} 
                      alt="Editor Preview" 
                      className="max-w-full h-auto rounded"
                      style={{ 
                        filter: `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturation}%)`
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Controls */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Filters</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">Brightness</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={imageFilters.brightness}
                        onChange={(e) => setImageFilters(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{imageFilters.brightness}%</span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Contrast</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={imageFilters.contrast}
                        onChange={(e) => setImageFilters(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{imageFilters.contrast}%</span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Saturation</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={imageFilters.saturation}
                        onChange={(e) => setImageFilters(prev => ({ ...prev, saturation: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{imageFilters.saturation}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => applyImageFilters(imageEditor.pageIndex, imageFilters)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
                  >
                    Apply Changes
                  </button>
                  <button 
                    onClick={() => setImageFilters({ brightness: 100, contrast: 100, saturation: 100 })}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              {exportProgress < 100 ? 'Exporting...' : 'Export Complete!'}
            </h3>
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {exportProgress < 20 ? 'Preparing pages...' :
                 exportProgress < 80 ? 'Processing images and text...' :
                 exportProgress < 95 ? 'Generating file...' :
                 exportProgress < 100 ? 'Finalizing...' :
                 'Export successful!'}
                <span className="float-right font-medium">{Math.round(exportProgress)}%</span>
              </p>
            </div>
            
            {exportProgress === 100 && (
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                <div className="flex items-center">
                  <div className="text-green-500 mr-2">✓</div>
                  <div className="text-sm text-green-700">
                    Your file has been downloaded successfully!
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              • Images are converted to high-quality format
              <br />
              • Text overlays are included
              <br />
              • Page labels are preserved
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Share Your Flipbook</h3>
              <button 
                onClick={() => setShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close share modal"
              >
                <FaTimes size={16} />
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{images.filter(img => img).length}</div>
                  <div className="text-xs text-gray-600">Pages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{Object.keys(textOverlays).length}</div>
                  <div className="text-xs text-gray-600">Text Overlays</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{bookmarks.size}</div>
                  <div className="text-xs text-gray-600">Bookmarks</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Privacy Settings */}
              <div>
                <h4 className="font-medium mb-3">Privacy Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={publishSettings.public}
                        onChange={(e) => setPublishSettings(prev => ({ ...prev, public: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Make Public</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {publishSettings.public ? '🌐 Anyone can view' : '🔒 Private link only'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Password Protection (optional)</label>
                    <input 
                      type="password"
                      value={publishSettings.password}
                      onChange={(e) => setPublishSettings(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Leave empty for no password"
                    />
                    {publishSettings.password && (
                      <div className="text-xs text-green-600 mt-1">🔐 Password protected</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Sharing Options */}
              <div>
                <h4 className="font-medium mb-3">Sharing Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={publishSettings.allowDownload !== false}
                      onChange={(e) => setPublishSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Allow viewers to download</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={publishSettings.showAnalytics !== false}
                      onChange={(e) => setPublishSettings(prev => ({ ...prev, showAnalytics: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Track analytics</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={publishSettings.allowComments !== false}
                      onChange={(e) => setPublishSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Allow comments</span>
                  </label>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3">
                {/* Quick Share */}
                <button 
                  onClick={createQuickShare}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FaShare size={14} />
                  Quick Share (Public)
                </button>
                
                {/* Custom Share */}
                <button 
                  onClick={() => publishFlipbook(publishSettings)}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FaBookmark size={14} />
                  Create Custom Share Link
                </button>
                
                {/* Export Options */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={exportToPDF}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-1"
                  >
                    <FaDownload size={12} />
                    PDF
                  </button>
                  <button 
                    onClick={exportAsImages}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-1"
                  >
                    <FaImages size={12} />
                    Images
                  </button>
                </div>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm text-blue-800">
                  <strong>💡 Sharing Tips:</strong>
                  <ul className="mt-1 text-xs space-y-1">
                    <li>• Quick Share creates a public link instantly</li>
                    <li>• Custom links let you set privacy options</li>
                    <li>• Password protection adds extra security</li>
                    <li>• Analytics help you track viewer engagement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="fixed right-4 top-20 bottom-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-40 overflow-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Analytics Dashboard</h3>
              <button 
                onClick={() => setShowAnalytics(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Popular Pages</h4>
              {getPopularPages().map(({ pageIndex, views }) => (
                <div key={pageIndex} className="flex justify-between items-center py-1">
                  <span className="text-sm">{getPageLabel(pageIndex)}</span>
                  <span className="text-xs text-gray-500">{views} views</span>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Page Status</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-100 p-2 rounded">
                  <div className="font-medium">With Images</div>
                  <div className="text-green-700">{images.filter(img => img).length}</div>
                </div>
                <div className="bg-red-100 p-2 rounded">
                  <div className="font-medium">Empty Pages</div>
                  <div className="text-red-700">{images.filter(img => !img).length}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Bookmarks</h4>
              <div className="text-sm">
                {bookmarks.size > 0 ? (
                  Array.from(bookmarks).map(pageIndex => (
                    <div key={pageIndex} className="py-1">
                      {getPageLabel(pageIndex)}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-xs">No bookmarks yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor Modal */}
      {showTextEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Text Overlay</h3>
              <button 
                onClick={() => setShowTextEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium mb-1">Text</label>
                <textarea
                  value={textEditorSettings.text}
                  onChange={(e) => setTextEditorSettings(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20 resize-none"
                  placeholder="Enter your text..."
                />
              </div>
              
              {/* Position Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">X Position (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={textEditorSettings.x}
                    onChange={(e) => setTextEditorSettings(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{textEditorSettings.x}%</span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Y Position (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={textEditorSettings.y}
                    onChange={(e) => setTextEditorSettings(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{textEditorSettings.y}%</span>
                </div>
              </div>
              
              {/* Font Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Font Size</label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={textEditorSettings.fontSize}
                    onChange={(e) => setTextEditorSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{textEditorSettings.fontSize}px</span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={textEditorSettings.color}
                    onChange={(e) => setTextEditorSettings(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded"
                  />
                </div>
              </div>
              
              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium mb-1">Font Family</label>
                <select
                  value={textEditorSettings.fontFamily}
                  onChange={(e) => setTextEditorSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Impact">Impact</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                </select>
              </div>
              
              {/* Preview */}
              <div className="border rounded p-4 bg-gray-50 relative h-32">
                <div className="text-xs text-gray-500 mb-2">Preview:</div>
                <div
                  className="absolute"
                  style={{
                    left: `${textEditorSettings.x}%`,
                    top: `${20 + (textEditorSettings.y * 0.6)}%`,
                    fontSize: `${Math.min(textEditorSettings.fontSize, 20)}px`,
                    color: textEditorSettings.color,
                    fontFamily: textEditorSettings.fontFamily,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '80%',
                    wordWrap: 'break-word'
                  }}
                >
                  {textEditorSettings.text}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    addTextOverlay(selectedPage, textEditorSettings);
                    setShowTextEditor(false);
                    setTextEditorSettings({ text: 'New Text', fontSize: 16, color: '#000000', fontFamily: 'Arial', x: 50, y: 50 });
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm"
                >
                  Add Text
                </button>
                <button 
                  onClick={() => setShowTextEditor(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Panel */}
      {showAccessibilityPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Accessibility Settings</h3>
              <button 
                onClick={() => setShowAccessibilityPanel(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close accessibility panel"
              >
                <FaTimes size={16} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Visual Settings */}
              <div>
                <h4 className="font-medium mb-3 text-gray-800">Visual Settings</h4>
                
                <div className="space-y-3">
                  {/* High Contrast */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">High Contrast Mode</label>
                    <button
                      onClick={toggleHighContrast}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        highContrast ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        highContrast ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  {/* Accessibility Mode */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Large Text Mode</label>
                    <button
                      onClick={toggleAccessibilityMode}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        accessibilityMode ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label={`${accessibilityMode ? 'Disable' : 'Enable'} large text mode`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        accessibilityMode ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  {/* Reduce Motion */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Reduce Motion</label>
                    <button
                      onClick={() => {
                        setReduceMotion(!reduceMotion);
                        if (!reduceMotion) {
                          document.body.style.setProperty('--transition-duration', '0s');
                        } else {
                          document.body.style.removeProperty('--transition-duration');
                        }
                      }}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        reduceMotion ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label={`${reduceMotion ? 'Enable' : 'Disable'} animations`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        reduceMotion ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Font Size</label>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={fontSize}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value);
                        setFontSize(newSize);
                        document.documentElement.style.fontSize = `${newSize}px`;
                      }}
                      className="w-full"
                      aria-label="Adjust font size"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Small</span>
                      <span>{fontSize}px</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Screen Reader */}
              <div>
                <h4 className="font-medium mb-3 text-gray-800">Screen Reader</h4>
                
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Screen Reader Optimized</label>
                  <button
                    onClick={() => setScreenReaderMode(!screenReaderMode)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      screenReaderMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    aria-label={`${screenReaderMode ? 'Disable' : 'Enable'} screen reader mode`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      screenReaderMode ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                {/* Alt Text for Current Page */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Alt Text for {getPageLabel(selectedPage)}
                  </label>
                  <textarea
                    value={altTexts[selectedPage] || ''}
                    onChange={(e) => updateAltText(selectedPage, e.target.value)}
                    placeholder="Describe this page for screen readers..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20 resize-none"
                    aria-label={`Alt text for ${getPageLabel(selectedPage)}`}
                  />
                </div>
              </div>
              
              {/* Quick Actions */}
              <div>
                <h4 className="font-medium mb-3 text-gray-800">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAccessibilityMode(false);
                      setHighContrast(false);
                      setReduceMotion(false);
                      setScreenReaderMode(false);
                      setFontSize(16);
                      document.body.className = '';
                      document.body.style.fontSize = '';
                      document.documentElement.style.fontSize = '';
                    }}
                    className="bg-gray-500 text-white py-2 px-3 rounded text-sm hover:bg-gray-600"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => {
                      setAccessibilityMode(true);
                      setHighContrast(true);
                      setReduceMotion(true);
                      setScreenReaderMode(true);
                      setFontSize(20);
                    }}
                    className="bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                  >
                    Max Accessibility
                  </button>
                </div>
              </div>
              
              {/* Status */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm text-blue-800">
                  <strong>Active Settings:</strong>
                  <div className="mt-1 text-xs">
                    {accessibilityMode && '• Large Text Mode'}
                    {highContrast && '• High Contrast'}
                    {reduceMotion && '• Reduced Motion'}
                    {screenReaderMode && '• Screen Reader Mode'}
                    {fontSize !== 16 && `• Custom Font Size (${fontSize}px)`}
                    {!accessibilityMode && !highContrast && !reduceMotion && !screenReaderMode && fontSize === 16 && 'None'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Overlays */}
      {Object.entries(textOverlays).map(([pageIndex, texts]) => 
        parseInt(pageIndex) === selectedPage && texts.map(text => (
          <div
            key={text.id}
            className="absolute z-30 cursor-pointer group"
            style={{
              left: `${text.x}%`,
              top: `${text.y}%`,
              fontSize: `${text.fontSize}px`,
              color: text.color,
              fontFamily: text.fontFamily,
              transform: 'translate(-50%, -50%)',
              maxWidth: '300px',
              wordWrap: 'break-word',
              textAlign: 'center'
            }}
            onClick={() => setEditingText(text.id)}
            title="Click to edit text"
            aria-label={`Text overlay: ${text.text}`}
          >
            {text.text}
            {/* Delete button on hover */}
            <button
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                deleteTextOverlay(parseInt(pageIndex), text.id);
              }}
              title="Delete text"
              aria-label={`Delete text: ${text.text}`}
            >
              <FaTimes size={8} />
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default InformationSystem;