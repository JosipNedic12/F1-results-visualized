// layoutController.js

export class LayoutController {
    constructor({ transitionDuration = 600 } = {}) {
        this.transitionDuration = transitionDuration;
        this.hasShrunk = false;
        this.globeSection = document.getElementById('globe-section');
        this.topRight = document.getElementById('top-right');
        this.bottomLeft = document.getElementById('bottom-left');
        this.bottomRight = document.getElementById('bottom-right');
    }

    fullscreenGlobe() {
        this.globeSection.classList.add('fullscreen');
        this.topRight.classList.add('hide');
        this.bottomLeft.classList.add('hide');
        this.bottomRight.classList.add('hide');
    }

    shrinkGlobeOnce(globe) {
    if (this.hasShrunk) return;
    this.hasShrunk = true;
    this.globeSection.classList.remove('fullscreen');
    this.globeSection.classList.add('shrunk');
    this.topRight.classList.remove('hide');
    this.bottomLeft.classList.remove('hide');
    this.bottomRight.classList.remove('hide');
    this.animateGlobeResize(globe, this.transitionDuration);
}

    animateGlobeResize(globe, duration = this.transitionDuration) {
        const start = performance.now();
        const step = (now) => {
            globe.resize();
            if (now - start < duration) {
                requestAnimationFrame(step);
            } else {
                globe.resize(); // Final resize to ensure it's perfect
            }
        };
        requestAnimationFrame(step);
    }

}
