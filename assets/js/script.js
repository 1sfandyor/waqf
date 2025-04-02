document.addEventListener('DOMContentLoaded', function() {
    const zekatLink = document.querySelector('.yellow-bg');
    if (!zekatLink) {
        return;
    }

    const zekatIcon = zekatLink.querySelector('.zekat-icon');
    if (!zekatIcon) {
        return;
    }

    let timeoutId;
    
    zekatLink.addEventListener('mouseenter', function() {
        const hoverImg = this.dataset.hoverImg;        
        timeoutId = setTimeout(() => {
            zekatIcon.src = hoverImg;
        }, 250);
    });

    zekatLink.addEventListener('mouseleave', function() {
        const defaultImg = this.dataset.defaultImg;        
        clearTimeout(timeoutId);
        zekatIcon.src = defaultImg;
    });
}); 