; (function ($) {
  "use strict";

  window.App = {};
  App.config = {
    headroom: {
      enabled: true,
      options: {
        classes: {
          initial: "headroom",
          pinned: "is-pinned",
          unpinned: "is-unpinned",
          top: "is-top",
          notTop: "is-not-top",
          bottom: "is-bottom",
          notBottom: "is-not-bottom",
          frozen: "is-frozen",
        },
      }
    },
    ajax: {
      enabled: true,
    },
    cursorFollower: {
      enabled: true,
      disableBreakpoint: '992',
    },
  }

  App.html = document.querySelector('html');
  App.body = document.querySelector('body');

  window.onload = function () {

    if (App.config.cursorFollower.enabled) {
      Cursor.init();
    }


  }

  const Cursor = (function () {

    const cursor = document.querySelector(".pxl-js-cursor");
    let follower;
    let label;
    let drap;
    let icon;

    let clientX;
    let clientY;
    let cursorWidth;
    let cursorHeight;
    let cursorTriggers;
    let cursorTriggersSection;
    let state;
    let cachedTriggers = null; // Cache for triggers
    let isInitialized = false; // Track if listeners are attached

    function variables() {

      follower = cursor.querySelector(".pxl-js-follower");
      label = cursor.querySelector(".pxl-js-label");
      drap = cursor.querySelector(".pxl-js-drap");
      icon = cursor.querySelector(".pxl-js-icon");

      clientX = -100;
      clientY = -100;
      cursorWidth = cursor.offsetWidth / 2;
      cursorHeight = cursor.offsetHeight / 2;
      cursorTriggers;
      cursorTriggersSection;
      state = false;

    }

    function init() {

      if (!cursor) return;

      variables();
      state = true;
      cursor.classList.add('is-enabled');

      document.addEventListener("mousedown", e => {
        cursor.classList.add('is-mouse-down');
      });

      document.addEventListener("mouseup", e => {
        cursor.classList.remove('is-mouse-down');
      });

      document.addEventListener("mousemove", (event) => {
        clientX = event.clientX;
        clientY = event.clientY;
      });

      const render = () => {
        cursor.style.transform = `translate(${clientX - cursorWidth}px, ${clientY - cursorHeight}px)`;
        requestAnimationFrame(render);
      };

      requestAnimationFrame(render);

      update();
      breakpoint();

    }

    function enterHandler({ target }) {

      cursor.classList.add('is-active');

      if (target.getAttribute('data-cursor-label')) {
        App.body.classList.add('is-cursor-active');
        cursor.classList.add('has-label');
        label.innerHTML = target.getAttribute('data-cursor-label');
      }

      if (target.getAttribute('data-cursor-drap')) {
        App.body.classList.add('is-cursor-active');
        cursor.classList.add('has-drap');
        drap.innerHTML = target.getAttribute('data-cursor-drap');
      }

      if (target.getAttribute('data-drap-style')) {
        var $d_style = target.getAttribute('data-drap-style');
        cursor.classList.add($d_style);
        drap.innerHTML = target.getAttribute('data-drap-style');
      }

      if (target.getAttribute('data-cursor-icon')) {
        App.body.classList.add('is-cursor-active');
        cursor.classList.add('has-icon');
        const iconAttr = target.getAttribute('data-cursor-icon');
      }

      if (target.getAttribute('data-cursor-icon-left')) {
        App.body.classList.add('is-cursor-active');
        cursor.classList.add('has-icon-left');
        const iconAttr_left = target.getAttribute('data-cursor-icon-left');
      }

      if (target.getAttribute('data-cursor-icon-right')) {
        App.body.classList.add('is-cursor-active');
        cursor.classList.add('has-icon-right');
        const iconAttr_right = target.getAttribute('data-cursor-icon-right');
      }

      if (target.getAttribute('data-has-remove')) {
        cursor.classList.add('has-remove');
      }

    }

    function leaveHandler({ target }) {

      App.body.classList.remove('is-cursor-active');
      cursor.classList.remove('is-active');
      cursor.classList.remove('has-label');
      cursor.classList.remove('has-drap');
      cursor.classList.remove('has-icon');
      cursor.classList.remove('has-icon-left');
      cursor.classList.remove('has-icon-right');
      cursor.classList.remove('has-remove');
      label.innerHTML = '';
      drap.innerHTML = '';
      icon.innerHTML = '';

    }

    function update() {

      if (!cursor) return;

      // Clear existing listeners first to prevent duplicates
      if (isInitialized && cursorTriggers) {
        clear();
      }

      // Cache selectors - only query DOM if cache is invalid
      if (!cachedTriggers) {
        // Fix: querySelectorAll needs a string, not array
        cursorTriggers = document.querySelectorAll(
          ".pxl-cursor--cta, .pxl-cursor-remove, .pxl-close, button, a, input, " +
          "[data-cursor], [data-cursor-label], [data-cursor-drap], [data-drap-style], " +
          "[data-cursor-icon], [data-cursor-icon-left], [data-cursor-icon-right], textarea"
        );

        cursorTriggersSection = document.querySelectorAll(".pxl-mouse-animation-yes");

        // Cache the NodeList
        cachedTriggers = cursorTriggers;
      } else {
        // Use cached triggers
        cursorTriggers = cachedTriggers;
      }

      // Add event listeners
      cursorTriggers.forEach(el => {
        el.addEventListener("mouseenter", enterHandler, { passive: true });
        el.addEventListener("mouseleave", leaveHandler, { passive: true });
      });

      isInitialized = true;

    }

    function clear() {

      if (!cursor || !cursorTriggers) return;

      cursorTriggers.forEach(el => {
        el.removeEventListener("mouseenter", enterHandler);
        el.removeEventListener("mouseleave", leaveHandler);
      });

      isInitialized = false;

    }

    function hide() {

      if (!cursor) return;
      cursor.classList.add('is-hidden');

    }

    function show() {

      if (!cursor) return;
      cursor.classList.remove('is-hidden');

    }

    function breakpoint() {

      if (!state) return;
      if (!App.config.cursorFollower.disableBreakpoint) return;

      let width = (window.innerWidth > 0) ? window.innerWidth : screen.width;

      if (width < App.config.cursorFollower.disableBreakpoint) {
        state = false;
        cursor.classList.remove('is-enabled');
        clear();
      } else {
        state = true;
        cursor.classList.add('is-enabled');
        update();
      }

      // Debounce resize handler for better performance
      let resizeTimeout;
      window.addEventListener('resize', () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        resizeTimeout = setTimeout(() => {
          let width = (window.innerWidth > 0) ? window.innerWidth : screen.width;

          if (width < App.config.cursorFollower.disableBreakpoint) {
            state = false;
            cursor.classList.remove('is-enabled');
            clear();
            // Invalidate cache when disabled
            cachedTriggers = null;
          } else {
            state = true;
            cursor.classList.add('is-enabled');
            // Invalidate cache to refresh triggers
            cachedTriggers = null;
            update();
          }

          resizeTimeout = null;
        }, 150);
      }, { passive: true });

    }

    return {
      init: init,
      update: update,
      clear: clear,
      hide: hide,
      show: show,
    };

  })();
})(jQuery);