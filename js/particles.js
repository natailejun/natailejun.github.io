/**
 * Particle Network — 粒子连接网络背景
 * 轻量、流畅、不干扰阅读
 */
(function () {
  'use strict';

  const canvas = document.createElement('canvas');
  canvas.id = 'particles-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');

  const CONFIG = {
    particleCount: 80,
    particleColor: '120, 87, 255',   // 紫色调
    lineColor: '120, 87, 255',
    particleRadius: 1.8,
    lineWidth: 0.6,
    maxDistance: 150,
    speed: 0.3,
    fps: 60,
  };

  let width, height;
  let particles = [];
  let animId;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset(true);
    }
    reset(initial) {
      this.x = initial ? Math.random() * width : Math.random() * width;
      this.y = initial ? Math.random() * height : (Math.random() < 0.5 ? -10 : height + 10);
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.radius = CONFIG.particleRadius + Math.random() * 1.2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20;
      if (this.y > height + 20) this.y = -20;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + CONFIG.particleColor + ', 0.5)';
      ctx.fill();
    }
  }

  // Initialize
  function init() {
    resize();
    particles = Array.from({ length: CONFIG.particleCount }, () => new Particle());
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.maxDistance) {
          const opacity = (1 - dist / CONFIG.maxDistance) * 0.4;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(' + CONFIG.lineColor + ', ' + opacity + ')';
          ctx.lineWidth = CONFIG.lineWidth;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    animId = requestAnimationFrame(animate);
  }

  // Mouse interaction - particles move away from cursor
  let mouseX = -999;
  let mouseY = -999;
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener('mouseleave', function () {
    mouseX = -999;
    mouseY = -999;
  });

  // Override Particle.update to react to mouse
  const origUpdate = Particle.prototype.update;
  Particle.prototype.update = function () {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100) {
      const force = (1 - dist / 100) * 0.5;
      this.vx += (dx / dist) * force;
      this.vy += (dy / dist) * force;
    }
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 1.5) {
      this.vx = (this.vx / speed) * 1.5;
      this.vy = (this.vy / speed) * 1.5;
    }
    origUpdate.call(this);
  };

  // Handle resize
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      init();
    }, 200);
  });

  // Start
  init();
  animate();

  // Expose for debugging
  window._particles = { canvas, particles, config: CONFIG };
})();
