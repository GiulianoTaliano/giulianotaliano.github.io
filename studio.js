(() => {
  'use strict';

  function init() {
    const root = document.documentElement;
    root.classList.add('has-js');
    let language = root.lang.toLowerCase().startsWith('en') ? 'en' : 'es';
    const byId = (id) => document.getElementById(id);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const listenToMedia = (query, callback) => {
      if (typeof query.addEventListener === 'function') query.addEventListener('change', callback);
      else if (typeof query.addListener === 'function') query.addListener(callback);
    };
    const findButton = (id) => {
      const node = byId(id);
      return node?.matches('button') ? node : node?.querySelector('button') || null;
    };
    const setCopy = (node, es, en) => {
      if (!node) return;
      node.dataset.es = es;
      node.dataset.en = en;
      node.textContent = language === 'es' ? es : en;
    };
    const setButtonCopy = (button, es, en) => {
      if (!button) return;
      const label = button.querySelector('[data-demo-label]') || button.querySelector('span[data-es][data-en]');
      if (label) label.setAttribute('data-demo-label', '');
      setCopy(label || button, es, en);
      if (button.hasAttribute('aria-label') || button.hasAttribute('data-label-es')) {
        button.dataset.labelEs = es;
        button.dataset.labelEn = en;
        button.setAttribute('aria-label', language === 'es' ? es : en);
      }
    };

    const titleNode = document.querySelector('title');
    const metadata = [
      [titleNode, document.title, 'Estudio Taliano — Software with a life of its own'],
      [document.querySelector('meta[name="description"]'), null, 'An independent studio in Buenos Aires. Four apps to take care of your routine, keep memories, understand football and split the bill.'],
      [document.querySelector('meta[property="og:title"]'), null, 'Estudio Taliano — Software with a life of its own'],
      [document.querySelector('meta[property="og:description"]'), null, 'Four worlds. One way of making. Independent software from Buenos Aires.'],
      [document.querySelector('meta[name="twitter:title"]'), null, 'Estudio Taliano — Independent software, Buenos Aires'],
      [document.querySelector('meta[name="twitter:description"]'), null, 'Four independent products made in Buenos Aires: Pill O-Clock, Revelum, Sharpkick and Saldá.'],
    ].filter(([node]) => node).map(([node, es, en]) => ({
      node,
      es: node.dataset.es || es || node.getAttribute('content') || '',
      en: node.dataset.en || en,
    }));

    function translatePage() {
      root.lang = language;
      document.querySelectorAll('[data-es][data-en]').forEach((node) => {
        if (node.tagName === 'META') node.setAttribute('content', node.dataset[language]);
        else node.textContent = node.dataset[language];
      });
      document.querySelectorAll('[data-label-es][data-label-en]').forEach((node) => {
        node.setAttribute('aria-label', node.dataset[language === 'es' ? 'labelEs' : 'labelEn']);
      });
      metadata.forEach(({ node, es, en }) => {
        const value = node.dataset[language] || (language === 'es' ? es : en);
        if (node.tagName === 'META') node.setAttribute('content', value);
        else node.textContent = value;
      });
      document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'es' ? 'es_AR' : 'en_US');
      const languageButton = byId('language');
      if (languageButton) {
        if (!languageButton.hasAttribute('data-es')) languageButton.textContent = language === 'es' ? 'EN' : 'ES';
        if (!languageButton.hasAttribute('data-label-es')) languageButton.setAttribute('aria-label', language === 'es' ? 'Read in English' : 'Leer en español');
        languageButton.setAttribute('lang', language === 'es' ? 'en' : 'es');
      }
    }

    byId('language')?.addEventListener('click', () => {
      language = language === 'es' ? 'en' : 'es';
      translatePage();
    });

    const clock = byId('local-time');
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    function updateClock() {
      if (!clock) return;
      const now = new Date();
      clock.textContent = timeFormatter.format(now);
      if (clock.tagName === 'TIME') clock.setAttribute('datetime', now.toISOString());
    }
    if (clock) {
      updateClock();
      window.setInterval(updateClock, 60_000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateClock();
      });
    }

    const header = byId('site-header');
    if (header) {
      const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
      updateHeader();
      window.addEventListener('scroll', updateHeader, { passive: true });
    }

    const art = byId('hero-art');
    const hero = byId('hero');
    if (art && hero) {
      const worldElements = [...hero.querySelectorAll('.art-object[data-world], .world-link[data-world]')];
      let hoveredWorld = null;
      let focusedWorld = null;
      const updateWorld = () => {
        const activeWorld = hoveredWorld || focusedWorld;
        if (activeWorld) art.dataset.activeWorld = activeWorld;
        else delete art.dataset.activeWorld;
      };
      const getFocusedWorld = () => {
        const focused = document.activeElement?.closest('.art-object[data-world], .world-link[data-world]');
        return focused && hero.contains(focused) ? focused.dataset.world : null;
      };
      worldElements.forEach((node) => {
        node.addEventListener('pointerenter', () => {
          hoveredWorld = node.dataset.world;
          updateWorld();
        });
        node.addEventListener('pointerleave', () => {
          hoveredWorld = null;
          updateWorld();
        });
        node.addEventListener('focusin', () => {
          focusedWorld = node.dataset.world;
          updateWorld();
        });
        node.addEventListener('focusout', () => {
          queueMicrotask(() => {
            focusedWorld = getFocusedWorld();
            updateWorld();
          });
        });
      });
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        hoveredWorld = null;
        focusedWorld = null;
        updateWorld();
      });

      let pointerFrame = 0;
      let pointerX = 0;
      let pointerY = 0;
      const writePointer = () => {
        pointerFrame = 0;
        art.style.setProperty('--pointer-x', `${pointerX.toFixed(2)}px`);
        art.style.setProperty('--pointer-y', `${pointerY.toFixed(2)}px`);
      };
      const schedulePointer = () => {
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(writePointer);
      };
      const resetPointer = () => {
        pointerX = 0;
        pointerY = 0;
        schedulePointer();
      };
      art.addEventListener('pointermove', (event) => {
        if (!pointerQuery.matches || event.pointerType === 'touch') return;
        const bounds = art.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const clamp = (value) => Math.max(-8, Math.min(8, value));
        pointerX = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 16);
        pointerY = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 16);
        schedulePointer();
      }, { passive: true });
      art.addEventListener('pointerleave', resetPointer);
      listenToMedia(pointerQuery, () => {
        if (!pointerQuery.matches) resetPointer();
      });
    }

    const pillButton = findButton('pill-demo');
    const pillScene = byId('pill-scene');
    let isRinging = pillScene?.classList.contains('is-ringing') || false;
    function renderPill() {
      pillScene?.classList.toggle('is-ringing', isRinging);
      setButtonCopy(pillButton, isRinging ? 'Listo, ya lo tomé' : 'Probar recordatorio', isRinging ? 'Done, taken' : 'Try a reminder');
      setCopy(byId('pill-demo-status'), isRinging ? 'Es hora de tu medicación' : 'Próxima toma · 20:00', isRinging ? "It’s time for your medication" : 'Next dose · 20:00');
    }
    pillButton?.addEventListener('click', () => {
      isRinging = !isRinging;
      renderPill();
    });

    const photoButton = findButton('reveal-photo');
    const photoScene = byId('revelum-scene');
    let isDeveloped = photoScene?.classList.contains('is-developed') || false;
    let photoFrame = 0;
    let photoSecondFrame = 0;
    function clearPhotoReplay() {
      window.cancelAnimationFrame(photoFrame);
      window.cancelAnimationFrame(photoSecondFrame);
      photoFrame = 0;
      photoSecondFrame = 0;
      photoScene?.classList.remove('is-resetting');
    }
    function renderPhoto() {
      photoScene?.classList.toggle('is-developed', isDeveloped);
      setButtonCopy(photoButton, isDeveloped ? 'Volver a revelar' : 'Revelar el recuerdo', isDeveloped ? 'Reveal it again' : 'Reveal the memory');
      setCopy(byId('photo-status'), isDeveloped ? 'Un instante que vuelve a aparecer.' : 'Hay un recuerdo esperando la luz.', isDeveloped ? 'A moment comes back into view.' : 'A memory is waiting for the light.');
    }
    photoButton?.addEventListener('click', () => {
      clearPhotoReplay();
      const replay = isDeveloped;
      isDeveloped = true;
      renderPhoto();
      if (!photoScene || !replay || motionQuery.matches) return;
      photoScene.classList.remove('is-developed');
      photoScene.classList.add('is-resetting');
      photoFrame = window.requestAnimationFrame(() => {
        photoFrame = 0;
        photoSecondFrame = window.requestAnimationFrame(() => {
          photoSecondFrame = 0;
          photoScene.classList.remove('is-resetting');
          photoScene.classList.add('is-developed');
        });
      });
    });
    listenToMedia(motionQuery, () => {
      if (!motionQuery.matches) return;
      clearPhotoReplay();
      if (isDeveloped) photoScene?.classList.add('is-developed');
    });

    const tacticButton = findButton('play-tactic');
    const tacticScene = byId('sharp-scene');
    let tacticPlayed = false;
    let tacticTimeout = 0;
    let tacticFrame = 0;
    let tacticSecondFrame = 0;
    function clearTacticAnimation() {
      window.clearTimeout(tacticTimeout);
      window.cancelAnimationFrame(tacticFrame);
      window.cancelAnimationFrame(tacticSecondFrame);
      tacticTimeout = 0;
      tacticFrame = 0;
      tacticSecondFrame = 0;
      tacticScene?.classList.remove('is-playing');
    }
    tacticButton?.addEventListener('click', () => {
      clearTacticAnimation();
      tacticPlayed = true;
      setButtonCopy(tacticButton, 'Otra jugada', 'Another play');
      setCopy(byId('tactic-status'), 'La jugada toma forma. El espacio aparece.', 'The play takes shape. Space opens up.');
      if (!tacticScene || motionQuery.matches) return;
      tacticFrame = window.requestAnimationFrame(() => {
        tacticFrame = 0;
        tacticSecondFrame = window.requestAnimationFrame(() => {
          tacticSecondFrame = 0;
          tacticScene.classList.add('is-playing');
          tacticTimeout = window.setTimeout(() => {
            tacticTimeout = 0;
            tacticScene.classList.remove('is-playing');
          }, 1800);
        });
      });
    });
    listenToMedia(motionQuery, () => {
      if (motionQuery.matches) clearTacticAnimation();
    });
    setButtonCopy(tacticButton, tacticPlayed ? 'Otra jugada' : 'Dibujar la jugada', tacticPlayed ? 'Another play' : 'Draw the play');
    setCopy(byId('tactic-status'), 'La pizarra está lista. Vos elegís la jugada.', 'The board is ready. You choose the play.');

    const settleButton = findButton('settle-demo');
    const settleScene = byId('salda-scene');
    let isSettled = settleScene?.classList.contains('is-settled') || false;
    function renderSettlement() {
      settleScene?.classList.toggle('is-settled', isSettled);
      const total = byId('receipt-total');
      if (total) total.textContent = isSettled ? '$ 0' : '$ 48.000';
      setButtonCopy(settleButton, isSettled ? 'Volver a empezar' : 'Saldar la cuenta', isSettled ? 'Start again' : 'Settle the bill');
      setCopy(byId('salda-status'), isSettled ? 'Todo saldado. Las cuentas claras.' : 'Una cuenta compartida, lista para saldar.', isSettled ? 'All settled. Everything adds up.' : 'A shared bill, ready to settle.');
      setCopy(byId('receipt-stamp'), 'SALDADO', 'SETTLED');
    }
    settleButton?.addEventListener('click', () => {
      isSettled = !isSettled;
      renderSettlement();
    });

    renderPill();
    renderPhoto();
    renderSettlement();
    translatePage();

    const projectLinks = [...document.querySelectorAll('a[data-project-link]')];
    const projectSections = ['pill', 'rev', 'sharp', 'salda'].map(byId).filter(Boolean);
    if ('IntersectionObserver' in window && projectLinks.length && projectSections.length) {
      const visibleSections = new Map();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.intersectionRect.height);
          else visibleSections.delete(entry.target.id);
        });
        const active = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        projectLinks.forEach((link) => {
          const target = link.hash?.slice(1) || link.dataset.projectLink;
          if (active && target === active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-15% 0px -35% 0px', threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1] });
      projectSections.forEach((section) => observer.observe(section));
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => root.classList.add('is-ready'));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
