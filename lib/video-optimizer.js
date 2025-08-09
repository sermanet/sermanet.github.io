/**
 * Advanced Video Optimization System
 * Provides lazy loading, format detection, and performance optimizations
 */

class VideoOptimizer {
  constructor(options = {}) {
    this.options = {
      // Intersection Observer options
      rootMargin: '50px',
      threshold: 0.1,
      
      // Video loading options
      preload: 'none',
      autoplay: true,
      muted: true,
      loop: true,
      playsinline: true,
      
      // Performance options
      enablePlaceholder: true,
      fadeInDuration: 500,
      retryAttempts: 3,
      
      // Format options
      preferredFormats: ['webm', 'mp4'],
      
      ...options
    };
    
    this.observer = null;
    this.loadedVideos = new Set();
    this.loadingVideos = new Set();
    this.retryCount = new Map();
    
    this.init();
  }
  
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: this.options.rootMargin,
          threshold: this.options.threshold
        }
      );
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.scanAndOptimize());
    } else {
      this.scanAndOptimize();
    }
  }
  
  scanAndOptimize() {
    // Find all video elements with b-lazy class
    const videos = document.querySelectorAll('video.b-lazy[data-src]');
    
    videos.forEach(video => {
      this.optimizeVideo(video);
    });
    
    console.log(`VideoOptimizer: Found and optimized ${videos.length} videos`);
  }
  
  optimizeVideo(video) {
    // Preserve existing attributes but set performance defaults
    if (!video.hasAttribute('preload')) {
      video.setAttribute('preload', this.options.preload);
    }
    if (!video.hasAttribute('playsinline') && this.options.playsinline) {
      video.setAttribute('playsinline', '');
    }
    if (!video.hasAttribute('muted') && this.options.muted) {
      video.muted = true;
    }
    
    // Create placeholder if enabled and video doesn't have a poster
    if (this.options.enablePlaceholder) {
      this.createVideoPlaceholder(video);
    }
    
    // Set up intersection observer for lazy loading
    if (this.observer) {
      this.observer.observe(video);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadVideo(video);
    }
  }
  
  createVideoPlaceholder(video) {
    const container = document.createElement('div');
    container.className = 'video-container';
    
    const placeholder = document.createElement('div');
    placeholder.className = 'video-placeholder';
    placeholder.setAttribute('data-video-placeholder', '');
    
    // Calculate aspect ratio from video or set default
    const aspectRatio = this.getVideoAspectRatio(video);
    placeholder.style.paddingBottom = aspectRatio;
    
    // Insert container and move video
    video.parentNode.insertBefore(container, video);
    container.appendChild(placeholder);
    container.appendChild(video);
    
    // Don't hide video initially - let it show naturally
    video.classList.add('video-loading');
    
    // Add click handler for manual loading
    placeholder.addEventListener('click', () => {
      this.loadVideo(video, true);
    });
  }
  
  getVideoAspectRatio(video) {
    // Try to extract dimensions from filename
    const src = video.getAttribute('data-src') || video.src;
    const dimensionMatch = src.match(/(\d+)x(\d+)/);
    
    if (dimensionMatch) {
      const width = parseInt(dimensionMatch[1]);
      const height = parseInt(dimensionMatch[2]);
      return `${(height / width * 100).toFixed(2)}%`;
    }
    
    // Default to 16:9 aspect ratio
    return '56.25%';
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        this.loadVideo(video);
        this.observer.unobserve(video);
      }
    });
  }
  
  async loadVideo(video, forceLoad = false) {
    if (this.loadedVideos.has(video) || this.loadingVideos.has(video)) {
      return;
    }
    
    this.loadingVideos.add(video);
    
    try {
      // Get the source URL
      const originalSrc = video.getAttribute('data-src');
      if (!originalSrc) {
        throw new Error('No data-src attribute found');
      }
      
      // Find the best format
      const optimizedSrc = await this.findBestVideoFormat(originalSrc);
      
      // Create and configure the video element
      await this.configureVideo(video, optimizedSrc);
      
      // Show the video with animation
      this.showVideo(video);
      
      this.loadedVideos.add(video);
      this.loadingVideos.delete(video);
      
      console.log(`VideoOptimizer: Successfully loaded ${optimizedSrc}`);
      
    } catch (error) {
      console.warn(`VideoOptimizer: Failed to load video ${video.getAttribute('data-src')}:`, error);
      this.handleLoadError(video);
    }
  }
  
  async findBestVideoFormat(originalSrc) {
    // Check if we have alternative formats
    for (const format of this.options.preferredFormats) {
      const testSrc = originalSrc.replace(/\.(mp4|webm|mov)$/i, `.${format}`);
      
      if (testSrc !== originalSrc) {
        try {
          const response = await fetch(testSrc, { method: 'HEAD' });
          if (response.ok) {
            return testSrc;
          }
        } catch (e) {
          // Format not available, continue
        }
      }
    }
    
    // Return original format if no alternatives found
    return originalSrc;
  }
  
  async configureVideo(video, src) {
    return new Promise((resolve, reject) => {
      // Set up event listeners
      const onLoad = () => {
        // Generate poster if video doesn't have one
        if (!video.hasAttribute('poster') && !video.poster) {
          this.generatePosterFromVideo(video);
        }
        cleanup();
        resolve();
      };
      
      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load video: ${src}`));
      };
      
      const cleanup = () => {
        video.removeEventListener('loadeddata', onLoad);
        video.removeEventListener('error', onError);
      };
      
      video.addEventListener('loadeddata', onLoad);
      video.addEventListener('error', onError);
      
      // Set the source
      video.src = src;
      
      // Configure playback - preserve existing attributes or use options
      if (video.hasAttribute('autoplay') || this.options.autoplay) {
        video.autoplay = true;
      }
      if (video.hasAttribute('loop') || this.options.loop) {
        video.loop = true;
      }
      if (video.hasAttribute('muted') || this.options.muted) {
        video.muted = true;
      }
      
      // Start loading
      video.load();
    });
  }
  
  generatePosterFromVideo(video) {
    try {
      // Create a canvas to capture the first frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Wait for video to be ready
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL and set as poster
        const posterDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        video.poster = posterDataUrl;
        
        console.log('VideoOptimizer: Generated poster for video');
      }
    } catch (error) {
      console.warn('VideoOptimizer: Failed to generate poster:', error);
    }
  }
  
  showVideo(video) {
    const placeholder = video.parentNode.querySelector('[data-video-placeholder]');
    
    video.style.display = 'block';
    video.classList.add('video-loaded');
    video.classList.remove('video-loading');
    
    if (placeholder) {
      // Fade out placeholder, fade in video
      placeholder.style.transition = `opacity ${this.options.fadeInDuration}ms ease`;
      placeholder.style.opacity = '0';
      
      setTimeout(() => {
        if (placeholder.parentNode) {
          placeholder.parentNode.removeChild(placeholder);
        }
      }, this.options.fadeInDuration);
    }
    
    // Try to play the video if autoplay is enabled (check both HTML attribute and options)
    if (video.hasAttribute('autoplay') || this.options.autoplay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('VideoOptimizer: Autoplay prevented:', error);
        });
      }
    }
  }
  
  handleLoadError(video) {
    const retryKey = video.getAttribute('data-src');
    const currentRetries = this.retryCount.get(retryKey) || 0;
    
    if (currentRetries < this.options.retryAttempts) {
      this.retryCount.set(retryKey, currentRetries + 1);
      
      // Retry after a delay
      setTimeout(() => {
        this.loadingVideos.delete(video);
        this.loadVideo(video);
      }, 1000 * (currentRetries + 1));
      
    } else {
      // Max retries reached, show error state
      this.showErrorState(video);
      this.loadingVideos.delete(video);
    }
  }
  
  showErrorState(video) {
    const placeholder = video.parentNode.querySelector('[data-video-placeholder]');
    if (placeholder) {
      placeholder.innerHTML = '<span style="color: #999; font-size: 14px;">Video unavailable</span>';
      placeholder.style.cursor = 'default';
    }
  }
  
  // Public method to manually load a specific video
  loadVideoById(videoId) {
    const video = document.getElementById(videoId);
    if (video && video.classList.contains('b-lazy')) {
      this.loadVideo(video, true);
    }
  }
  
  // Public method to get loading statistics
  getStats() {
    return {
      loaded: this.loadedVideos.size,
      loading: this.loadingVideos.size,
      total: document.querySelectorAll('video.b-lazy[data-src]').length
    };
  }
}

// Auto-initialize when script loads
window.VideoOptimizer = VideoOptimizer;

// Initialize with default options
document.addEventListener('DOMContentLoaded', () => {
  if (!window.videoOptimizer) {
    window.videoOptimizer = new VideoOptimizer();
  }
});
