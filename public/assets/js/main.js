(function () {
  /* ========= Preloader ======== */
  const preloader = document.querySelectorAll('#preloader')

  window.addEventListener('load', function () {
    if (preloader.length) {
      this.document.getElementById('preloader').style.display = 'none'
    }
    
    // Sidebar doim yopiq holatda bo'lishini ta'minlash
    const sidebarNavWrapper = document.querySelector(".sidebar-nav-wrapper");
    const mainWrapper = document.querySelector(".main-wrapper");
    const menuToggleButtonIcon = document.querySelector("#menu-toggle i");
    
    if (window.innerWidth > 1200) {
      sidebarNavWrapper.classList.remove("active");
      mainWrapper.classList.remove("active");
      menuToggleButtonIcon.classList.remove("lni-chevron-left");
      menuToggleButtonIcon.classList.add("lni-menu");
    }
  })

  /* ========= Add Box Shadow in Header on Scroll ======== */
  window.addEventListener('scroll', function () {
    const header = document.querySelector('.header')
    if (window.scrollY > 0) {
      header.style.boxShadow = '0px 0px 30px 0px rgba(200, 208, 216, 0.30)'
    } else {
      header.style.boxShadow = 'none'
    }
  })

  /* ========= sidebar toggle ======== */
  const sidebarNavWrapper = document.querySelector(".sidebar-nav-wrapper");
  const mainWrapper = document.querySelector(".main-wrapper");
  const menuToggleButton = document.querySelector("#menu-toggle");
  const menuToggleButtonIcon = document.querySelector("#menu-toggle i");
  const overlay = document.querySelector(".overlay");

  menuToggleButton.addEventListener("click", () => {
    if (sidebarNavWrapper.style.transform === "translateX(-100%)") {
      sidebarNavWrapper.style.transform = "translateX(0)";
      overlay.classList.add("active");
      mainWrapper.style.marginLeft = "250px";
      
      if (menuToggleButtonIcon.classList.contains("lni-menu")) {
        menuToggleButtonIcon.classList.remove("lni-menu");
        menuToggleButtonIcon.classList.add("lni-chevron-left");
      }
    } else {
      sidebarNavWrapper.style.transform = "translateX(-100%)";
      overlay.classList.remove("active");
      mainWrapper.style.marginLeft = "0";
      
      if (menuToggleButtonIcon.classList.contains("lni-chevron-left")) {
        menuToggleButtonIcon.classList.remove("lni-chevron-left");
        menuToggleButtonIcon.classList.add("lni-menu");
      }
    }
  });
  
  overlay.addEventListener("click", () => {
    sidebarNavWrapper.style.transform = "translateX(-100%)";
    overlay.classList.remove("active");
    mainWrapper.style.marginLeft = "0";
    
    if (menuToggleButtonIcon.classList.contains("lni-chevron-left")) {
      menuToggleButtonIcon.classList.remove("lni-chevron-left");
      menuToggleButtonIcon.classList.add("lni-menu");
    }
  });
})();
