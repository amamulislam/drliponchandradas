/* ============================================================
   THREE.JS BACKGROUND — PARTICLE NETWORK + FLOATING MATH SYMBOLS
   ============================================================ */
(function initThreeJS() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* ---------- Particle Network ---------- */
  const particleCount = 180;
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 80;
    const y = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 40;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    velocities.push({
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02
    });
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x00d4ff,
    size: 0.25,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  /* ---------- Connecting Lines ---------- */
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending
  });

  const linePositions = new Float32Array(particleCount * particleCount * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(linePositions, 3)
  );
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  /* ---------- Floating Math Symbols ---------- */
  const symbols = ['∑', '∫', 'π', '∞', 'Δ', '√', 'θ', 'λ', '∂', '∇'];
  const symbolSprites = [];

  function createSymbolSprite(char, x, y, z) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.font = 'bold 80px "Playfair Display", serif';
    ctx.fillStyle = 'rgba(0, 212, 255, 0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 64, 64);

    const texture = new THREE.CanvasTexture(c);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(4, 4, 1);
    scene.add(sprite);
    symbolSprites.push({
      sprite,
      speed: 0.2 + Math.random() * 0.3,
      offset: Math.random() * 100
    });
  }

  symbols.forEach((sym) => {
    createSymbolSprite(
      sym,
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 20 - 10
    );
  });

  /* ---------- Mouse Influence ---------- */
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ---------- Animation Loop ---------- */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Update particle positions
    const posArray = particleGeometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      posArray[i3] += velocities[i].x;
      posArray[i3 + 1] += velocities[i].y;
      posArray[i3 + 2] += velocities[i].z;

      if (Math.abs(posArray[i3]) > 40) velocities[i].x *= -1;
      if (Math.abs(posArray[i3 + 1]) > 40) velocities[i].y *= -1;
      if (Math.abs(posArray[i3 + 2]) > 20) velocities[i].z *= -1;
    }
    particleGeometry.attributes.position.needsUpdate = true;

    // Update connecting lines
    const lineArray = lineGeometry.attributes.position.array;
    let lineIdx = 0;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x1 = posArray[i3];
      const y1 = posArray[i3 + 1];
      const z1 = posArray[i3 + 2];

      for (let j = i + 1; j < particleCount; j++) {
        const j3 = j * 3;
        const x2 = posArray[j3];
        const y2 = posArray[j3 + 1];
        const z2 = posArray[j3 + 2];

        const dx = x1 - x2;
        const dy = y1 - y2;
        const dz = z1 - z2;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 12) {
          lineArray[lineIdx++] = x1;
          lineArray[lineIdx++] = y1;
          lineArray[lineIdx++] = z1;
          lineArray[lineIdx++] = x2;
          lineArray[lineIdx++] = y2;
          lineArray[lineIdx++] = z2;
        }
      }
    }
    lineGeometry.setDrawRange(0, lineIdx / 3);
    lineGeometry.attributes.position.needsUpdate = true;

    // Slow rotation + mouse parallax
    particles.rotation.y += 0.0003;
    particles.rotation.x += 0.0001;
    particles.rotation.y += mouseX * 0.0002;
    particles.rotation.x += mouseY * 0.0002;

    // Animate floating symbols
    symbolSprites.forEach((item) => {
      item.sprite.position.y +=
        Math.sin(elapsed * item.speed + item.offset) * 0.008;
      item.sprite.position.x +=
        Math.cos(elapsed * item.speed * 0.7 + item.offset) * 0.005;
      item.sprite.material.opacity =
        0.25 + Math.sin(elapsed * item.speed + item.offset) * 0.1;
    });

    // Subtle camera drift
    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.01;
    camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.01;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();

  /* ---------- Resize Handler ---------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();


/* ============================================================
   GSAP SCROLL ANIMATIONS & INTERACTIONS
   ============================================================ */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Reveal sections on scroll
  document.querySelectorAll('.reveal').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => el.classList.add('visible'),
      once: true
    });
  });

  // Animate skill bars on scroll
  document.querySelectorAll('.skill-bar-fill').forEach((bar) => {
    ScrollTrigger.create({
      trigger: bar,
      start: 'top 90%',
      onEnter: () => {
        bar.style.width = bar.dataset.width;
      },
      once: true
    });
  });
} else {
  // Fallback if GSAP fails to load
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  document.querySelectorAll('.skill-bar-fill').forEach((bar) => {
    bar.style.width = bar.dataset.width;
  });
}


/* ============================================================
   NAVBAR BACKGROUND ON SCROLL
   ============================================================ */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }
});


/* ============================================================
   SMOOTH SCROLL FOR NAV LINKS
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId && targetId !== '#') {
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});