// ============================
// CUBO 3D DEL HERO
// ============================

const cube = document.querySelector('.cube');

let rotX = 0;
let rotY = 0;
let isDraggingCube = false;
let lastCubeX = 0;
let lastCubeY = 0;

const autoSpeed = 0.15; // grados por frame cuando nadie lo toca

function animateCube() {
  if (!isDraggingCube) {
    rotY += autoSpeed;
  }

  cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

  requestAnimationFrame(animateCube);
}

animateCube();

cube.addEventListener('mousedown', (e) => {
  isDraggingCube = true;
  lastCubeX = e.clientX;
  lastCubeY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
  if (!isDraggingCube) return;

  const deltaX = e.clientX - lastCubeX;
  const deltaY = e.clientY - lastCubeY;

  rotY += deltaX * 0.5;
  rotX -= deltaY * 0.5;

  lastCubeX = e.clientX;
  lastCubeY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isDraggingCube = false;
});


// ============================
// CARRUSEL DE PROYECTOS INFINITO
// ============================

const track = document.querySelector('.proj-track');

// Guardamos las cartas originales
const originalCards = Array.from(document.querySelectorAll('.proj-card'));
const cardCount = originalCards.length;

// Configuración de tiempos y animación
const autoplayDelay = 3500; // Tiempo entre cada carta
let autoplayInterval = null;
let resumeTimeout = null;
let isAnimating = false;

// ============================
// CREAR CLONES PARA BUCLE
// ============================
const beforeFragment = document.createDocumentFragment();
const afterFragment = document.createDocumentFragment();

originalCards.forEach((card) => {
  const beforeClone = card.cloneNode(true);
  const afterClone = card.cloneNode(true);

  beforeClone.dataset.carouselClone = 'true';
  afterClone.dataset.carouselClone = 'true';

  beforeFragment.appendChild(beforeClone);
  afterFragment.appendChild(afterClone);
});

track.prepend(beforeFragment);
track.append(afterFragment);

// Lista completa de cartas (Clones izq + Originales + Clones der)
const cards = Array.from(track.querySelectorAll('.proj-card'));

// Empezamos en la primera carta del grupo ORIGINAL
let currentIndex = cardCount;

// Calcula la posición exacta de scroll para centrar perfectamente la carta activa
function getCardOffset(index) {
  const card = cards[index];
  if (!card) return 0;
  
  const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
  const containerHalfWidth = track.clientWidth / 2;
  
  return cardCenter - containerHalfWidth;
}

// Establece posición inicial sin animación
function setInitialPosition() {
  track.scrollLeft = getCardOffset(currentIndex);
}

// ============================
// EFECTO VISUAL DE ESCALA
// ============================
function updateCarousel() {
  const trackRect = track.getBoundingClientRect();
  const trackCenter = trackRect.left + trackRect.width / 2;

  cards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;

    const distance = Math.abs(trackCenter - cardCenter);
    const cardStep = card.offsetWidth + 24; // Gap de 24px en CSS

    const ratio = distance / cardStep;

    const scale = Math.max(1 - ratio * 0.2, 0.75);
    const opacity = Math.max(1 - ratio * 0.55, 0.25);

    card.style.transform = `scale(${scale})`;
    card.style.opacity = opacity;
    card.style.zIndex = Math.round(100 - ratio * 10);
  });
}

// ============================
// ANIMACIÓN DE SCROLL SUAVE Y REINTEGRO INFINITO
// ============================

function animateScrollTo(targetLeft, duration = 600, onComplete) {
  isAnimating = true;
  const startLeft = track.scrollLeft;
  const distance = targetLeft - startLeft;
  let startTime = null;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easeProgress = easeOutCubic(progress);

    track.scrollLeft = startLeft + distance * easeProgress;
    updateCarousel();

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      isAnimating = false;
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(step);
}

function scrollToIndex(index, duration = 600) {
  currentIndex = index;
  const targetOffset = getCardOffset(currentIndex);

  animateScrollTo(targetOffset, duration, () => {
    // Si sobrepasamos las originales hacia la derecha (entramos a clones)
    if (currentIndex >= cardCount * 2) {
      currentIndex = currentIndex - cardCount;
      track.scrollLeft = getCardOffset(currentIndex);
      updateCarousel();
    }
    // Si sobrepasamos hacia la izquierda
    else if (currentIndex < cardCount) {
      currentIndex = currentIndex + cardCount;
      track.scrollLeft = getCardOffset(currentIndex);
      updateCarousel();
    }
  });
}

function nextCard() {
  if (isAnimating) return;
  scrollToIndex(currentIndex + 1, 600);
}

// ============================
// AUTOPLAY
// ============================
function startAutoplay() {
  stopAutoplay();
  autoplayInterval = setInterval(nextCard, autoplayDelay);
}

function stopAutoplay() {
  if (autoplayInterval !== null) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

// Detectar carta más cercana tras interacción manual
function getClosestCardIndex() {
  const trackRect = track.getBoundingClientRect();
  const trackCenter = trackRect.left + trackRect.width / 2;

  let closestIndex = currentIndex;
  let closestDistance = Infinity;

  cards.forEach((card, index) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;
    const distance = Math.abs(trackCenter - cardCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

// ============================
// EVENTOS Y USUARIO
// ============================
track.addEventListener('scroll', () => {
  if (!isAnimating) {
    updateCarousel();
  }
});

function handleUserInteraction() {
  stopAutoplay();
  clearTimeout(resumeTimeout);

  resumeTimeout = setTimeout(() => {
    if (!isAnimating) {
      currentIndex = getClosestCardIndex();
      
      // Ajuste silencioso por si el usuario scrolleó manualmente hasta los clones
      if (currentIndex >= cardCount * 2) {
        currentIndex = currentIndex - cardCount;
        track.scrollLeft = getCardOffset(currentIndex);
      } else if (currentIndex < cardCount) {
        currentIndex = currentIndex + cardCount;
        track.scrollLeft = getCardOffset(currentIndex);
      }
    }
    startAutoplay();
  }, 2500);
}

track.addEventListener('wheel', handleUserInteraction, { passive: true });
track.addEventListener('touchstart', handleUserInteraction, { passive: true });

window.addEventListener('resize', () => {
  setInitialPosition();
  updateCarousel();
});

// Inicialización
setInitialPosition();
updateCarousel();
startAutoplay();


// ============================
// MODAL DE PROYECTO
// ============================
const modal = document.querySelector('.proj-modal');
const modalImg = modal.querySelector('.proj-modal-img');
const modalTitle = modal.querySelector('.proj-modal-title');
const modalDesc = modal.querySelector('.proj-modal-desc');
const modalBlend = modal.querySelector('.proj-modal-blend');
const modalClose = modal.querySelector('.proj-modal-close');

function closeModal() {
  modal.classList.remove('open');
  startAutoplay();
}

track.addEventListener('click', (e) => {
  const btn = e.target.closest('.proj-btn');
  if (!btn) return;

  e.stopPropagation();
  const card = btn.closest('.proj-card');
  if (!card) return;

  modalImg.src = card.dataset.image || '';
  modalImg.alt = card.dataset.title || 'Proyecto';
  modalTitle.textContent = card.dataset.title || 'Proyecto';
  modalDesc.textContent = card.dataset.description || '';

  if (card.dataset.blend) {
    modalBlend.href = card.dataset.blend;
    modalBlend.style.display = 'inline-block';
  } else {
    modalBlend.href = '#';
    modalBlend.style.display = 'none';
  }

  modal.classList.add('open');
  stopAutoplay();
});

modalClose.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) {
    closeModal();
  }
});