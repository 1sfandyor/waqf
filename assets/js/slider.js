document.addEventListener('DOMContentLoaded', function() {
  // Get slider elements
  const slider = document.getElementById('newsSlider');
  const slidesContainer = slider.querySelector('.slides');
  const slides = slider.querySelectorAll('.slide');
  const indicators = slider.querySelectorAll('.indicator');
  const prevBtn = slider.querySelector('.prev-btn');
  const nextBtn = slider.querySelector('.next-btn');
  
  // Set up variables
  const totalSlides = slides.length;
  let currentSlide = 0;
  let slideInterval;
  
  // Function to move to a specific slide
  function goToSlide(slideIndex) {
      // Handle wrapping around
      if (slideIndex < 0) {
          slideIndex = totalSlides - 1;
      } else if (slideIndex >= totalSlides) {
          slideIndex = 0;
      }
      
      // Update current slide
      currentSlide = slideIndex;
      
      // Move slides
      slidesContainer.style.transform = `translateX(-${currentSlide * 33.33}%)`;
      
      // Update indicators
      indicators.forEach((indicator, index) => {
          if (index === currentSlide) {
              indicator.classList.add('active');
          } else {
              indicator.classList.remove('active');
          }
      });
      
      // Reset the interval timer
      resetInterval();
  }
  
  // Function to go to the next slide
  function nextSlide() {
      goToSlide(currentSlide + 1);
  }
  
  // Function to go to the previous slide
  function prevSlide() {
      goToSlide(currentSlide - 1);
  }
  
  // Function to start the automatic slideshow
  function startInterval() {
      slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
  }
  
  // Function to reset the interval timer
  function resetInterval() {
      clearInterval(slideInterval);
      startInterval();
  }
  
  // Set up event listeners
  prevBtn.addEventListener('click', function() {
      prevSlide();
  });
  
  nextBtn.addEventListener('click', function() {
      nextSlide();
  });
  
  // Add click event listeners to indicators
  indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', function() {
          goToSlide(index);
      });
  });
  
  // Start the automatic slideshow
  startInterval();
  
  // Pause slideshow when hovering over the slider (optional)
  slider.addEventListener('mouseenter', function() {
      clearInterval(slideInterval);
  });
  
  slider.addEventListener('mouseleave', function() {
      startInterval();
  });
});