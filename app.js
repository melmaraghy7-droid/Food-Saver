import { translations } from './translations.js';

// Application State
let currentLang = localStorage.getItem('foodsaver_lang') || 'en';
let currentTheme = localStorage.getItem('foodsaver_theme') || 'light';

// Elements
const htmlElement = document.documentElement;
const bodyElement = document.body;
const themeToggleBtn = document.getElementById('theme-toggle');
const langToggleBtn = document.getElementById('lang-toggle');
const header = document.querySelector('header');
const menuBurger = document.getElementById('menu-burger');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initScrollEffects();
  initMobileMenu();
  initIntersectionObserver();
  initCounterObserver();
});

// Theme Logic
function initTheme() {
  if (currentTheme === 'dark') {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }
  updateThemeIcon();

  themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('foodsaver_theme', currentTheme);
    htmlElement.classList.toggle('dark');
    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const sunIcon = themeToggleBtn.querySelector('.sun-icon');
  const moonIcon = themeToggleBtn.querySelector('.moon-icon');
  if (currentTheme === 'dark') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

// Language Logic
function initLanguage() {
  setLanguage(currentLang);

  langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    localStorage.setItem('foodsaver_lang', currentLang);
    setLanguage(currentLang);
  });
}

function setLanguage(lang) {
  // Update direction and classes
  if (lang === 'ar') {
    bodyElement.setAttribute('dir', 'rtl');
    bodyElement.classList.remove('lang-en');
    bodyElement.classList.add('lang-ar');
    langToggleBtn.textContent = 'English';
  } else {
    bodyElement.setAttribute('dir', 'ltr');
    bodyElement.classList.remove('lang-ar');
    bodyElement.classList.add('lang-en');
    langToggleBtn.textContent = 'العربية';
  }

  // Update translatable elements
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      const textValue = translations[lang][key];
      
      // If element is a button or has HTML content we want to preserve, use innerHTML
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.setAttribute('placeholder', textValue);
      } else if (element.classList.contains('preserve-html')) {
        element.innerHTML = textValue;
      } else {
        element.textContent = textValue;
      }
    }
  });

  // Re-trigger counter formatting to match language locale if counters already run
  document.querySelectorAll('.counter-value').forEach(counter => {
    const finalValue = parseInt(counter.getAttribute('data-count'), 10);
    const suffix = counter.getAttribute('data-suffix') || '';
    if (counter.classList.contains('counted')) {
      counter.textContent = formatNumber(finalValue, lang) + suffix;
    }
  });
}

// Helper: Format numbers locally
function formatNumber(num, lang) {
  return num.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
}

// Scroll Effects (Header and Navigation)
function initScrollEffects() {
  window.addEventListener('scroll', () => {
    // Header shrinking
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Active navigation highlight
    let currentSectionId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  });

  // Smooth scroll for nav links (already supported in CSS but ensures focus management)
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        // Close mobile menu if open
        menuBurger.classList.remove('active');
        navMenu.classList.remove('active');
        
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = targetSection.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Mobile Menu
function initMobileMenu() {
  menuBurger.addEventListener('click', () => {
    menuBurger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && navMenu.classList.contains('active')) {
      menuBurger.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });
}

// Reveal entrance animations
function initIntersectionObserver() {
  const revealElements = document.querySelectorAll('.reveal');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(element => {
    observer.observe(element);
  });
}

// Counter animation
function initCounterObserver() {
  const counterElements = document.querySelectorAll('.counter-value');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  counterElements.forEach(element => {
    observer.observe(element);
  });
}

function animateCounter(counter) {
  const targetVal = parseInt(counter.getAttribute('data-count'), 10);
  const suffix = counter.getAttribute('data-suffix') || '';
  const duration = 2000; // 2 seconds
  const startTime = performance.now();

  counter.classList.add('counted');

  function updateCount(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // EaseOutQuad formula
    const easeProgress = progress * (2 - progress);
    const currentValue = Math.floor(easeProgress * targetVal);

    counter.textContent = formatNumber(currentValue, currentLang) + suffix;

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      counter.textContent = formatNumber(targetVal, currentLang) + suffix;
    }
  }

  requestAnimationFrame(updateCount);
}
