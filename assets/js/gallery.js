// Gallery images data with categories
const galleryImages = [
    {
      id: 1,
      src: "/lovable-uploads/00bcded4-8d43-4f1e-9bad-91c26066003d.png",
      alt: "Vaqf tashkiliy ishlari",
      category: "events"
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
      alt: "Meeting",
      category: "events"
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80", 
      alt: "Event",
      category: "media"
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
      alt: "Conference",
      category: "events"
    },
    {
      id: 5,
      src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
      alt: "Discussion",
      category: "education"
    },
    {
      id: 6,
      src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
      alt: "Seminar",
      category: "education"
    }
  ];
  
  // DOM Elements
  const gallery = document.getElementById('gallery');
  const navButtons = document.querySelectorAll('.nav-button');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeButton = document.querySelector('.close');
  
  // Initialize the gallery
  function initGallery() {
    displayGalleryItems('all');
    setupEventListeners();
  }
  
  // Display gallery items based on category
  function displayGalleryItems(category) {
    // Clear gallery
    gallery.innerHTML = '';
    
    // Filter images based on category
    const filteredImages = category === 'all' 
      ? galleryImages 
      : galleryImages.filter(img => img.category === category);
    
    // Create and append gallery items
    filteredImages.forEach((image, index) => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      galleryItem.dataset.id = image.id;
      galleryItem.style.animationDelay = `${index * 100}ms`;
      
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = image.alt;
      
      galleryItem.appendChild(img);
      gallery.appendChild(galleryItem);
    });
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Category navigation buttons
    navButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Get category from data attribute
        const category = this.dataset.category;
        
        // Display items for selected category
        displayGalleryItems(category);
      });
    });
    
    // Gallery item click for lightbox
    gallery.addEventListener('click', function(e) {
      const target = e.target.closest('.gallery-item');
      if (target) {
        const img = target.querySelector('img');
        openLightbox(img.src, img.alt);
      }
    });
    
    // Close lightbox
    closeButton.addEventListener('click', closeLightbox);
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
    
    // Close lightbox with Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && lightbox.style.display === 'block') {
        closeLightbox();
      }
    });
    
    // Fixed header on scroll
    window.addEventListener('scroll', function() {
      const header = document.querySelector('.header-gallert');
      if (window.scrollY > 50) {
        header.style.padding = '10px 0';
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      } else {
        header.style.padding = '20px 0';
        header.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
      }
    });
  }
  
  // Open lightbox
  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
  }
  
  // Close lightbox
  function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', initGallery);
  