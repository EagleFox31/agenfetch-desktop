'use strict';

const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');

function updateHeaderState() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 12);
}

function closeMobileNav() {
  if (!mobileNav || !menuToggle) return;
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
}

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const open = mobileNav.hidden;
    mobileNav.hidden = !open;
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });
}

window.addEventListener('scroll', updateHeaderState, { passive: true });
updateHeaderState();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    observer.observe(el);
  });
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}
