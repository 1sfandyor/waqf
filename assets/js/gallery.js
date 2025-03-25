// Gallery images data with categories
const galleryImages = [
    {
      id: 1,
      src: "/assets/img/gallery/1.JPG",
      alt: "Vaqf tashkiliy ishlari",
      category: "events"
    },
    {
      id: 2,
      src: "/assets/img/gallery/2.JPG",
      alt: "Seminar",
      category: "events"
    },
    {
      id: 3,
      src: "/assets/img/gallery/3.jpg", 
      alt: "Media faoliyati",
      category: "events"
    },
    {
      id: 4,
      src: "/assets/img/gallery/4.jpg",
      alt: "Konferensiya",
      category: "events"
    },
    {
      id: 5,
      src: "/assets/img/gallery/5.jpg",
      alt: "Talim jarayoni",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/6.jpg",
      alt: "Kompyuter darsi",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/7.jpg",
      alt: "Kompyuter darsi",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/8.jpg",
      alt: "Kompyuter darsi",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/9.jpg",
      alt: "Kompyuter darsi",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/10.jpg",
      alt: "Kompyuter darsi",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/11.jpeg",
      alt: "Kompyuter darsi",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/12.jpg",
      alt: "Kompyuter darsi",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/13.jpg",
      alt: "Kompyuter darsi",
      category: "events"
    },
    {
      id: 6,
      src: "/assets/img/gallery/14.JPG",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/15.JPG",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/16.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/17.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/18.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/19.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/20.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/21.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/22.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/23.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/24.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/25.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/26.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/27.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/28.jpg",
      alt: "Kompyuter darsi",
      category: "education"
    },
    {
      id: 6,
      src: "/assets/img/gallery/29.JPG",
      alt: "Kompyuter darsi",
      category: "education"
    }
  ];


  
  
  // DOM Elements
  const gallery = document.getElementById('gallery');
  const filterButtons = document.querySelectorAll('.filter-button');
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
    // Category filter buttons
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
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
  