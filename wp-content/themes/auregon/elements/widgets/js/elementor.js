(function ($) {

    (function () {
        function addStyle() {
            if (document.head) {
                var style = document.createElement('style');
                style.textContent = '.pxl-animate { opacity: 0 !important; visibility: hidden !important; }';
                document.head.appendChild(style);
            } else {
                setTimeout(addStyle, 10);
            }
        }
        addStyle();
    })();

    function auregon_animation_handler($scope) {
        var $elements = $scope ? $scope.find('.pxl-animate') : $(document).find('.pxl-animate');

        $elements.each(function () {
            var $el = $(this);
            if (!$el.hasClass('pxl-invisible')) {
                $el.addClass('pxl-invisible');
            }
        });

        if (window.elementorFrontend && typeof elementorFrontend.waypoint === 'function') {
            elementorFrontend.waypoint($elements, function () {
                var $animate_el = $(this),
                    data = $animate_el.data('settings');
                if (typeof data !== 'undefined' && typeof data['animation'] !== 'undefined') {
                    setTimeout(function () {
                        $animate_el.removeClass('pxl-invisible').addClass('animated ' + data['animation']);
                    }, data['animation_delay'] || 0);
                } else {
                    setTimeout(function () {
                        $animate_el.removeClass('pxl-invisible').addClass('animated fadeInUp');
                    }, 300);
                }
            });
        }

        if ($scope && window.elementorFrontend && typeof elementorFrontend.waypoint === 'function') {
            elementorFrontend.waypoint($scope.find('.pxl-border-animated'), function () {
                $(this).addClass('pxl-animated');
            });
            elementorFrontend.waypoint($scope.find('.pxl-section-divider'), function () {
                $(this).addClass('pxl-animated');
            });
            elementorFrontend.waypoint($scope.find('.TextOutlineAnimation'), function () {
                $(this).addClass('pxl-animated');
            });
            elementorFrontend.waypoint($scope.find('.PXLfadeInUp'), function () {
                $(this).addClass('pxl-animated');
            });
            elementorFrontend.waypoint($scope.find('.pxl-icon1.style-balloon'), function () {
                $(this).addClass('pxl-animated');
            });
        }
    }

    const PXLDIV_MAX_DIST = 140;
    const PXLDIV_PEAK = 0.75;
    const PXLDIV_SPREAD_MIN = 170;
    const PXLDIV_SPREAD_MAX = 250;

    const PXLBORDER_MAX_DIST = 300;
    const PXLBORDER_PEAK = 0.75;
    const PXLBORDER_SPREAD_MIN = 170;
    const PXLBORDER_SPREAD_MAX = 300;

    function pxl_divider_clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }

    function pxl_divider_smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    function bind_divider_glow(container) {
        if (!container || container.getAttribute('data-divider-glow-bound') === '1') return;

        var dividers = container.querySelectorAll('.pxl-section-divider');
        if (!dividers.length) return;

        container.setAttribute('data-divider-glow-bound', '1');

        var state = {
            x: 0,
            y: 0,
            inside: false,
            raf: null
        };

        function render() {
            state.raf = null;
            var rect = container.getBoundingClientRect();
            if (!rect || rect.width === 0 || rect.height === 0) return;

            var x = pxl_divider_clamp(state.x - rect.left, 0, rect.width);
            var y = pxl_divider_clamp(state.y - rect.top, 0, rect.height);

            dividers.forEach(function (divider) {
                var isHorizontal = divider.classList.contains('pxl-section-divider--top') || divider.classList.contains('pxl-section-divider--bottom');
                var target = isHorizontal ? (divider.classList.contains('pxl-section-divider--top') ? 0 : rect.height) : (divider.classList.contains('pxl-section-divider--left') ? 0 : rect.width);
                var dist = Math.abs((isHorizontal ? y : x) - target);
                var t = state.inside ? pxl_divider_clamp(1 - dist / PXLDIV_MAX_DIST, 0, 1) : 0;
                var eased = pxl_divider_smoothstep(t);
                var alpha = PXLDIV_PEAK * eased;
                var spread = PXLDIV_SPREAD_MAX - (PXLDIV_SPREAD_MAX - PXLDIV_SPREAD_MIN) * eased;

                divider.style.setProperty('--pxl-divider-gx', x + 'px');
                divider.style.setProperty('--pxl-divider-gy', y + 'px');
                divider.style.setProperty('--pxl-divider-alpha', alpha.toFixed(3));
                divider.style.setProperty('--pxl-divider-spread', spread.toFixed(1) + 'px');
                divider.setAttribute('data-glow', state.inside && alpha > 0.003 ? '1' : '0');
            });
        }

        function schedule() {
            if (state.raf) return;
            state.raf = requestAnimationFrame(render);
        }

        function handleMove(e) {
            state.x = e.clientX;
            state.y = e.clientY;
            state.inside = true;
            schedule();
        }

        function handleLeave() {
            state.inside = false;
            schedule();
        }

        var rect = container.getBoundingClientRect();
        state.x = rect.left + rect.width / 2;
        state.y = rect.top + rect.height / 2;

        container.addEventListener('mousemove', handleMove);
        container.addEventListener('mouseenter', handleMove);
        container.addEventListener('mouseleave', handleLeave);

        schedule();
    }

    function auregon_section_divider_glow($scope) {
        var $context = $scope && $scope.length ? $scope : $(document);
        var hosts = [];

        $context.find('.pxl-section-divider').each(function () {
            var host = this.closest('.elementor-element');
            if (host && hosts.indexOf(host) === -1) {
                hosts.push(host);
            }
        });

        hosts.forEach(function (host) {
            bind_divider_glow(host);
        });
    }

    function bind_border_glow(host) {
        if (!host || host.getAttribute('data-border-glow-bound') === '1') return;

        var glowHost = host.querySelector('.pxl-border-glow');
        if (!glowHost) return;

        host.setAttribute('data-border-glow-bound', '1');

        var topGlow = glowHost.querySelector('.pxl-bd-glow.top');
        var rightGlow = glowHost.querySelector('.pxl-bd-glow.right');
        var bottomGlow = glowHost.querySelector('.pxl-bd-glow.bottom');
        var leftGlow = glowHost.querySelector('.pxl-bd-glow.left');

        var state = {
            x: 0,
            y: 0,
            inViewport: false,
            raf: 0,
            rect: null,
            obs: null,
            onMove: null,
            onResize: null
        };

        function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
        function smoothstep(t) { return t * t * (3 - 2 * t); } // nếu bạn đã có pxl_divider_smoothstep thì dùng cái đó

        function updateRect() {
            state.rect = host.getBoundingClientRect();
        }

        // Calculate distance from point to rectangle
        // Returns 0 if point is inside rectangle, otherwise distance to nearest edge
        function distanceToRect(px, py, rect) {
            var dx = Math.max(0, Math.max(rect.left - px, px - rect.right));
            var dy = Math.max(0, Math.max(rect.top - py, py - rect.bottom));
            return Math.sqrt(dx * dx + dy * dy);
        }

        function render() {
            state.raf = 0;

            if (!state.inViewport) {
                // out viewport -> tắt sạch
                host.style.setProperty('--pxl-bd-alpha', '0');
                if (topGlow) topGlow.style.opacity = 0;
                if (rightGlow) rightGlow.style.opacity = 0;
                if (bottomGlow) bottomGlow.style.opacity = 0;
                if (leftGlow) leftGlow.style.opacity = 0;
                return;
            }

            if (!state.rect) updateRect();
            var rect = state.rect;
            if (!rect || !rect.width || !rect.height) return;

            // Calculate distance from mouse to rectangle
            var distance = distanceToRect(state.x, state.y, rect);

            // If distance > MAX_DIST, turn off
            if (distance > PXLBORDER_MAX_DIST) {
                host.style.setProperty('--pxl-bd-alpha', '0');
                if (topGlow) topGlow.style.opacity = 0;
                if (rightGlow) rightGlow.style.opacity = 0;
                if (bottomGlow) bottomGlow.style.opacity = 0;
                if (leftGlow) leftGlow.style.opacity = 0;
                return;
            }

            // Calculate distance to each edge
            var x = clamp(state.x - rect.left, 0, rect.width);
            var y = clamp(state.y - rect.top, 0, rect.height);

            var distTop = y;
            var distRight = rect.width - x;
            var distBottom = rect.height - y;
            var distLeft = x;

            // Alpha based on distance to rectangle: 1 - distance / MAX_DIST
            var baseAlpha = clamp(1 - distance / PXLBORDER_MAX_DIST, 0, 1);
            var easedBase = smoothstep(baseAlpha);

            // Each edge's intensity based on its distance (closer = brighter)
            var tTop = clamp(1 - distTop / PXLBORDER_MAX_DIST, 0, 1);
            var tRight = clamp(1 - distRight / PXLBORDER_MAX_DIST, 0, 1);
            var tBottom = clamp(1 - distBottom / PXLBORDER_MAX_DIST, 0, 1);
            var tLeft = clamp(1 - distLeft / PXLBORDER_MAX_DIST, 0, 1);

            var easedTop = smoothstep(tTop);
            var easedRight = smoothstep(tRight);
            var easedBottom = smoothstep(tBottom);
            var easedLeft = smoothstep(tLeft);

            // Main alpha uses base distance
            var alpha = PXLBORDER_PEAK * easedBase;
            var spread = PXLBORDER_SPREAD_MAX - (PXLBORDER_SPREAD_MAX - PXLBORDER_SPREAD_MIN) * easedBase;

            host.style.setProperty('--pxl-bd-gx', x + 'px');
            host.style.setProperty('--pxl-bd-gy', y + 'px');
            host.style.setProperty('--pxl-bd-alpha', alpha.toFixed(3));
            host.style.setProperty('--pxl-bd-spread', spread.toFixed(1) + 'px');

            // Edge closest to mouse glows brightest
            if (topGlow) topGlow.style.opacity = easedTop;
            if (rightGlow) rightGlow.style.opacity = easedRight;
            if (bottomGlow) bottomGlow.style.opacity = easedBottom;
            if (leftGlow) leftGlow.style.opacity = easedLeft;
        }

        function schedule(forceRect) {
            if (forceRect) state.rect = null;
            if (state.raf) return;
            state.raf = requestAnimationFrame(render);
        }

        state.onMove = function (e) {
            state.x = e.clientX;
            state.y = e.clientY;
            schedule(false);
        };

        state.onResize = function () {
            // khi resize/scroll layout đổi -> refresh rect
            schedule(true);
        };

        // IntersectionObserver
        state.obs = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].target !== host) continue;
                state.inViewport = !!entries[i].isIntersecting;
                schedule(true); // vào/ra viewport đều render để bật/tắt ngay
            }
        }, { threshold: 0.1 });

        state.obs.observe(host);

        // PROXIMITY MODE: Listen to pointermove on document to detect mouse near border
        document.addEventListener('pointermove', state.onMove, { passive: true });

        window.addEventListener('resize', state.onResize, { passive: true });
        window.addEventListener('scroll', state.onResize, { passive: true });

        // init center
        updateRect();
        var r = state.rect;
        state.x = r.left + r.width / 2;
        state.y = r.top + r.height / 2;

        schedule(false);

        // cleanup để tránh leak (Elementor re-render)
        host._pxlBorderGlowCleanup = function () {
            if (state.raf) cancelAnimationFrame(state.raf);
            if (state.obs) state.obs.disconnect();

            document.removeEventListener('pointermove', state.onMove);

            window.removeEventListener('resize', state.onResize);
            window.removeEventListener('scroll', state.onResize);

            host.removeAttribute('data-border-glow-bound');
            delete host._pxlBorderGlowCleanup;
        };
    }


    function auregon_border_glow($scope) {
        var $context = $scope && $scope.length ? $scope : $(document);
        $context.find('.pxl-border-section-anm').each(function () {
            bind_border_glow(this);
        });
    }

    function auregon_polyfill_waypoint() {
        if (!window.elementorFrontend || typeof elementorFrontend.waypoint === 'function') return;
        elementorFrontend.waypoint = function ($elements, handler, options) {
            options = options || {};
            var triggerOnce = typeof options.triggerOnce === 'boolean' ? options.triggerOnce : true;
            var offset = options.offset;
            var rootMargin = '0px 0px 0px 0px';
            if (typeof offset === 'string' && /%$/.test(offset)) {
                var percent = parseFloat(offset);
                if (!isNaN(percent)) {
                    var bottomPercent = Math.max(0, 100 - percent);
                    rootMargin = '0px 0px -' + bottomPercent + '% 0px';
                }
            } else if (typeof offset === 'number') {
                rootMargin = '0px 0px -' + offset + 'px 0px';
            }
            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting || entry.intersectionRatio > 0) {
                            handler.call(entry.target);
                            if (triggerOnce) {
                                observer.unobserve(entry.target);
                            }
                        }
                    });
                }, { root: null, rootMargin: rootMargin, threshold: 0 });
                $($elements).each(function () {
                    var dom = this instanceof Element ? this : (this && this[0] instanceof Element ? this[0] : null);
                    if (dom) observer.observe(dom);
                });
            } else {
                $($elements).each(function () { handler.call(this); });
            }
        };
    }

    function auregon_section_start_render() {
        var _elementor = typeof elementor !== 'undefined' ? elementor : elementorFrontend;

        _elementor.hooks.addFilter('pxl_element_container/before-render', function (html, settings) {
            if (typeof settings.pxl_parallax_bg_img !== 'undefined' && settings.pxl_parallax_bg_img && settings.pxl_parallax_bg_img.url !== '') {
                html += '<div class="pxl-section-bg-parallax"></div>';
            }

            if (typeof settings.pxl_color_offset !== 'undefined' && settings.pxl_color_offset !== 'none') {
                html += '<div class="pxl-section-overlay-color"></div>';
            }

            if (typeof settings.pxl_overlay_img !== 'undefined' && settings.pxl_overlay_img && settings.pxl_overlay_img.url !== '') {
                html += '<div class="pxl-overlay--image pxl-overlay--imageLeft"><div class="bg-image"></div></div>';
            }

            if (typeof settings.pxl_overlay_img2 !== 'undefined' && settings.pxl_overlay_img2 && settings.pxl_overlay_img2.url !== '') {
                html += '<div class="pxl-overlay--image pxl-overlay--imageRight"><div class="bg-image"></div></div>';
            }

            return html;
        });

        // Chờ DOM ready trước khi tìm elements
        $(document).ready(function () {
            $('.pxl-section-bg-parallax').closest('.elementor-element').addClass('pxl-section-parallax-overflow');
        });
    }

    function auregon_css_inline_js() {
        var _inline_css = "<style>";
        $(document).find('.pxl-inline-css').each(function () {
            var _this = $(this);
            _inline_css += _this.attr("data-css") + " ";
            _this.remove();
        });
        _inline_css += "</style>";
        $('head').append(_inline_css);
    }

    function auregon_section_before_render() {
        var _elementor = typeof elementor !== 'undefined' ? elementor : elementorFrontend;
        _elementor.hooks.addFilter('pxl-custom-section/before-render', function (html, settings, el) {
            if (typeof settings['row_divider'] !== 'undefined') {
                if (settings['row_divider'] === 'angle-top' || settings['row_divider'] === 'angle-bottom' || settings['row_divider'] === 'angle-top-right' || settings['row_divider'] === 'angle-bottom-left') {
                    html = '<svg class="pxl-row-angle" style="fill:#ffffff" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 100 100" version="1.1" preserveAspectRatio="none" height="130px"><path stroke="" stroke-width="0" d="M0 100 L100 0 L200 100"></path></svg>';
                    return html;
                }
                if (settings['row_divider'] === 'angle-top-bottom' || settings['row_divider'] === 'angle-top-bottom-left') {
                    html = '<svg class="pxl-row-angle pxl-row-angle-top" style="fill:#ffffff" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 100 100" version="1.1" preserveAspectRatio="none" height="130px"><path stroke="" stroke-width="0" d="M0 100 L100 0 L200 100"></path></svg><svg class="pxl-row-angle pxl-row-angle-bottom" style="fill:#ffffff" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 100 100" version="1.1" preserveAspectRatio="none" height="130px"><path stroke="" stroke-width="0" d="M0 100 L100 0 L200 100"></path></svg>';
                    return html;
                }
                if (settings['row_divider'] === 'wave-animation-top' || settings['row_divider'] === 'wave-animation-bottom') {
                    html = '<svg class="pxl-row-angle" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 150" fill="#fff"><path d="M 0 26.1978 C 275.76 83.8152 430.707 65.0509 716.279 25.6386 C 930.422 -3.86123 1210.32 -3.98357 1439 9.18045 C 2072.34 45.9691 2201.93 62.4429 2560 26.198 V 172.199 L 0 172.199 V 26.1978 Z"><animate repeatCount="indefinite" fill="freeze" attributeName="d" dur="10s" values="M0 25.9086C277 84.5821 433 65.736 720 25.9086C934.818 -3.9019 1214.06 -5.23669 1442 8.06597C2079 45.2421 2208 63.5007 2560 25.9088V171.91L0 171.91V25.9086Z; M0 86.3149C316 86.315 444 159.155 884 51.1554C1324 -56.8446 1320.29 34.1214 1538 70.4063C1814 116.407 2156 188.408 2560 86.315V232.317L0 232.316V86.3149Z; M0 53.6584C158 11.0001 213 0 363 0C513 0 855.555 115.001 1154 115.001C1440 115.001 1626 -38.0004 2560 53.6585V199.66L0 199.66V53.6584Z; M0 25.9086C277 84.5821 433 65.736 720 25.9086C934.818 -3.9019 1214.06 -5.23669 1442 8.06597C2079 45.2421 2208 63.5007 2560 25.9088V171.91L0 171.91V25.9086Z"></animate></path></svg>';
                    return html;
                }
                if (settings['row_divider'] === 'curved-top' || settings['row_divider'] === 'curved-bottom') {
                    html = '<svg class="pxl-row-angle" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 1920 128" version="1.1" preserveAspectRatio="none" style="fill:#ffffff"><path stroke-width="0" d="M-1,126a3693.886,3693.886,0,0,1,1921,2.125V-192H-7Z"></path></svg>';
                    return html;
                }
            }
        });
    }

    var PXL_Icon_Contact_Form = function ($scope, $) {

        setTimeout(function () {
            $('.pxl--item').each(function () {
                var icon_input = $(this).find(".pxl--form-icon"),
                    control_wrap = $(this).find('.wpcf7-form-control');
                control_wrap.before(icon_input.clone());
                icon_input.remove();
            });
        }, 10);

    };


    function auregon_split_text($scope) {
        var st = $scope.find(".pxl-split-text");
        if (st.length === 0) return;

        // Kiểm tra GSAP và SplitText có tồn tại
        if (typeof gsap === 'undefined' || typeof SplitText === 'undefined') {
            console.warn('GSAP or SplitText plugin not loaded');
            return;
        }

        gsap.registerPlugin(SplitText);

        st.each(function (index, el) {
            var els = $(el).find('p').length > 0 ? $(el).find('p')[0] : el;
            const pxl_split = new SplitText(els, {
                type: "lines, words, chars",
                lineThreshold: 0.5,
                linesClass: "split-line"
            });
            var split_type_set = pxl_split.chars;

            gsap.set(els, { perspective: 400 });

            var settings = {
                scrollTrigger: {
                    trigger: els,
                    toggleActions: "play none none none",
                    start: "top 86%",
                    once: true
                },
                duration: 0.35,
                stagger: 0.02,
                ease: "Expo.out"
            };
            if ($(el).hasClass('split-in-fade')) {
                settings.opacity = 0;
            }
            if ($(el).hasClass('split-in-right')) {
                settings.opacity = 0;
                settings.x = "50";
            }
            if ($(el).hasClass('split-in-left')) {
                settings.opacity = 0;
                settings.x = "-50";
            }
            if ($(el).hasClass('split-in-up')) {
                settings.opacity = 0;
                settings.y = "80";
            }
            if ($(el).hasClass('split-in-down')) {
                settings.opacity = 0;
                settings.y = "-80";
            }
            if ($(el).hasClass('split-in-rotate')) {
                settings.opacity = 0;
                settings.rotateX = "50deg";
            }
            if ($(el).hasClass('split-in-scale')) {
                settings.opacity = 0;
                settings.scale = "0.5";
            }

            if ($(el).hasClass('split-up')) {
                pxl_split.split({ type: "words" });
                split_type_set = pxl_split.words;

                $(split_type_set).each(function (index, elw) {
                    gsap.from(elw, {
                        opacity: 0,
                        duration: 0.65,
                        y: 60,
                        delay: 0.25 + index * 0.065,
                        ease: "expo.out",
                        scrollTrigger: {
                            trigger: el,
                            start: "top 86%",
                            toggleActions: "play none none none",
                        },
                    });
                });
            }

            if ($(el).hasClass('split-words-scale')) {
                pxl_split.split({ type: "words" });
                split_type_set = pxl_split.words;

                $(split_type_set).each(function (index, elw) {
                    gsap.set(elw, {
                        opacity: 0,
                        scale: index % 2 === 0 ? 0 : 2,
                        force3D: true,
                        duration: 0.1,
                        ease: "Linear.easeNone",
                        stagger: 0.02,
                    }, index * 0.01);
                });

                var pxl_anim = gsap.to(split_type_set, {
                    scrollTrigger: {
                        trigger: el,
                        toggleActions: "play reverse play reverse",
                        start: "top 86%",
                    },
                    rotateX: "0",
                    scale: 1,
                    opacity: 1,
                });

            } else {
                var pxl_anim = gsap.from(split_type_set, settings);
            }

            if ($(el).hasClass('hover-split-text')) {
                $(el).mouseenter(function (e) {
                    pxl_anim.restart();
                });
            }
        });
    }

    function auregon_scroll_trigger($scope) {
        if (typeof ScrollTrigger === 'undefined' || typeof gsap === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        ScrollTrigger.matchMedia({
            "(min-width: 1401px)": function () {
                let t2 = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".pxl-section-scale",
                        scrub: true,
                        start: "top top",
                        end: "bottom bottom",
                        pin: ".pxl-section-sticky",
                    },
                });
                t2.to(".pxl-section-slide", {
                    padding: "7.5rem"
                }, ">");
                t2.to(".pxl-sticky-mask", {
                    borderRadius: "2rem"
                }, "<");
                t2.from(".is-shape-1", {
                    right: "-10%"
                }, "<");
                t2.from(".is-shape-2", {
                    left: "-10%"
                }, "<");
            },
            "(max-width: 1400px)": function () {
                let t2 = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".pxl-section-scale",
                        scrub: true,
                        start: "top top",
                        end: "bottom bottom",
                        pin: ".pxl-section-sticky",
                    },
                });
                t2.to(".pxl-section-slide", {
                    padding: "4.8rem"
                }, ">");
                t2.to(".pxl-sticky-mask", {
                    borderRadius: "1.6rem"
                }, "<");
                t2.from(".is-shape-1", {
                    right: "-10%"
                }, "<");
                t2.from(".is-shape-2", {
                    left: "-10%"
                }, "<");
            },
            "(max-width: 991px)": function () {
                let t2 = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".pxl-section-scale",
                        scrub: true,
                        start: "top bottom",
                        end: "bottom top",
                    },
                });
                t2.to(".pxl-section-slide", {
                    padding: "2rem"
                }, ">");
                t2.to(".pxl-sticky-mask", {
                    borderRadius: "2rem"
                }, "<");
                t2.from(".is-shape-1", {
                    right: "-10%"
                }, "<");
                t2.from(".is-shape-2", {
                    left: "-10%"
                }, "<");

            },
        });
        const rotatingStickerSelector = ".pxl-sticker-shape.is-rotate";
        if (document.querySelector(rotatingStickerSelector)) {
            gsap.to(rotatingStickerSelector, {
                rotation: "800",
                scrollTrigger: {
                    trigger: "#pxl-content-main",
                    scrub: true,
                    start: "top top",
                    end: "bottom bottom",
                },
            });
        }
    }

    function auregon_zoom_point() {
        if (!window.elementorFrontend || typeof elementorFrontend.waypoint !== 'function') return;

        var $zoomPoints = $(document).find('.pxl-zoom-point');
        if ($zoomPoints.length === 0) return;

        elementorFrontend.waypoint($zoomPoints, function () {
            var $el = $(this);
            // Thêm logic zoom point nếu cần
            $el.addClass('pxl-zoom-active');
        }, {
            offset: -100,
            triggerOnce: true
        });
    }

    function auregon_text_marquee($scope) {
        if (typeof gsap === 'undefined') {
            console.warn('GSAP not loaded');
            return;
        }

        const text_marquee = $scope.find('.pxl-text--marquee');
        if (text_marquee.length === 0) return;

        const boxes = gsap.utils.toArray(text_marquee);

        const loop = text_horizontalLoop(boxes, { paused: false, repeat: -1, });

        function text_horizontalLoop(items, config) {
            items = gsap.utils.toArray(items);
            config = config || {};
            let tl = gsap.timeline({ repeat: config.repeat, paused: config.paused, defaults: { ease: "none" }, onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100) }),
                length = items.length,
                startX = items[0].offsetLeft,
                times = [],
                widths = [],
                xPercents = [],
                curIndex = 0,
                pixelsPerSecond = (config.speed || 1) * 100,
                snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1),
                totalWidth, curX, distanceToStart, distanceToLoop, item, i;
            gsap.set(items, {
                xPercent: (i, el) => {
                    let w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
                    xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / w * 100 + gsap.getProperty(el, "xPercent"));
                    return xPercents[i];
                }
            });
            gsap.set(items, { x: 0 });
            totalWidth = items[length - 1].offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") + (parseFloat(config.paddingRight) || 0);
            for (i = 0; i < length; i++) {
                item = items[i];
                curX = xPercents[i] / 100 * widths[i];
                distanceToStart = item.offsetLeft + curX - startX;
                distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
                tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
                    .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
                    .add("label" + i, distanceToStart / pixelsPerSecond);
                times[i] = distanceToStart / pixelsPerSecond;
            }
            function toIndex(index, vars) {
                vars = vars || {};
                (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length);
                let newIndex = gsap.utils.wrap(0, length, index),
                    time = times[newIndex];
                if (time > tl.time() !== index > curIndex) {
                    vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
                    time += tl.duration() * (index > curIndex ? 1 : -1);
                }
                curIndex = newIndex;
                vars.overwrite = true;
                return tl.tweenTo(time, vars);
            }
            tl.next = vars => toIndex(curIndex + 1, vars);
            tl.previous = vars => toIndex(curIndex - 1, vars);
            tl.current = () => curIndex;
            tl.toIndex = (index, vars) => toIndex(index, vars);
            tl.times = times;
            tl.progress(1, true).progress(0, true);
            if (config.reversed) {
                tl.vars.onReverseComplete();
                tl.reverse();
            }
            return tl;
        }
    }

    function auregon_scroll_fixed_section() {
        if (typeof ScrollTrigger === 'undefined' || typeof gsap === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        const fixed_section_top = $('.pxl-section-fix-top');
        const fixedSectionBottomSelector = ".pxl-section-fix-bottom";
        const hasFixedBottom = document.querySelector(fixedSectionBottomSelector);
        if (fixed_section_top.length > 0 && hasFixedBottom) {
            ScrollTrigger.matchMedia({
                "(min-width: 991px)": function () {
                    const pinnedSections = ['.pxl-section-fix-top'];
                    pinnedSections.forEach(className => {
                        gsap.to(fixedSectionBottomSelector, {
                            scrollTrigger: {
                                trigger: fixedSectionBottomSelector,
                                scrub: true,
                                pin: className,
                                pinSpacing: false,
                                start: 'top bottom',
                                end: "bottom top",
                            },
                        });
                        const bottomOverlaySelector = ".pxl-section-fix-bottom .pxl-section-overlay-color";
                        if (!document.querySelector(bottomOverlaySelector)) {
                            return;
                        }
                        gsap.to(bottomOverlaySelector, {
                            scrollTrigger: {
                                trigger: fixedSectionBottomSelector,
                                scrub: true,
                                pin: className,
                                pinSpacing: false,
                                start: 'top bottom',
                                end: "bottom top",
                            },
                        });
                    });
                }
            });
        }

        const section_overlay_color = $('.pxl-section-overlay-color');
        const overlayScrollSelector = ".overlay-type-scroll";
        if (section_overlay_color.length > 0 && document.querySelector(overlayScrollSelector)) {
            const space_top = section_overlay_color.data('space-top') || 0;
            const space_left = section_overlay_color.data('space-left') || 0;
            const space_right = section_overlay_color.data('space-right') || 0;
            const space_bottom = section_overlay_color.data('space-bottom') || 0;

            const radius_top = section_overlay_color.data('radius-top') || 0;
            const radius_left = section_overlay_color.data('radius-left') || 0;
            const radius_right = section_overlay_color.data('radius-right') || 0;
            const radius_bottom = section_overlay_color.data('radius-bottom') || 0;

            const overlay_radius = radius_top + 'px ' + radius_right + 'px ' + radius_bottom + 'px ' + radius_left + 'px ';

            ScrollTrigger.matchMedia({
                "(min-width: 991px)": function () {
                    const pinnedSections = ['.pxl-bg-color-scroll'];
                    pinnedSections.forEach(className => {
                        gsap.to(overlayScrollSelector, {
                            scrollTrigger: {
                                trigger: ".pxl-bg-color-scroll",
                                scrub: true,
                                pinSpacing: false,
                                start: 'top bottom',
                                end: "bottom top",
                            },
                            left: space_left + "px",
                            right: space_right + "px",
                            top: space_top + "px",
                            bottom: space_bottom + "px",
                            borderRadius: overlay_radius,
                        });
                    });
                }
            });
        }
    }
    function auregon_scroll_checkp($scope) {
        $scope.find('.pxl-el-divider').each(function () {
            var wcont1 = $(this);
            var scrollHandler = null;

            function checkScrollPosition() {
                if (!wcont1.length || !wcont1.is(':visible')) return;

                var pxl_scroll_top = $(window).scrollTop(),
                    viewportBottom = pxl_scroll_top + $(window).height(),
                    elementTop = wcont1.offset().top,
                    elementBottom = elementTop + wcont1.outerHeight();

                if (elementTop < viewportBottom && elementBottom > pxl_scroll_top) {
                    wcont1.addClass('visible');
                    // Cleanup sau khi đã visible
                    if (scrollHandler) {
                        $(window).off('scroll', scrollHandler);
                        scrollHandler = null;
                    }
                }
            }

            checkScrollPosition();

            scrollHandler = function () {
                checkScrollPosition();
            };
            $(window).on('scroll', scrollHandler);

            // Cleanup khi element bị remove
            wcont1.on('remove', function () {
                if (scrollHandler) {
                    $(window).off('scroll', scrollHandler);
                }
            });
        });
    }

    function renderOrbit($scope) {
        $scope.find(".orbit").each(function () {
            const $orbit = $(this);
            const settings = $orbit.data("settings") || {};
            const size = settings.size || 70;
            const count = settings.count || 1;
            const icons = Array.isArray(settings.icons) ? settings.icons : [];
            const itemClasses = Array.isArray(settings.itemClasses) ? settings.itemClasses : [];
            const iconClass = settings.iconClass || "green";
            const randomStart = !!settings.randomStart;
            const useRandomColor = !!settings.randomColor;
            const borderColor = settings.borderColor || null;

            $orbit.css("--d", size + "%").empty();
            if (borderColor) {
                $orbit.css("--orbit-border-color", borderColor);
            }

            const fragment = $(document.createDocumentFragment());

            const createItem = (idx) => {
                const dur = (6 + Math.random() * 6).toFixed(1) + "s";
                const $rot = $("<div>", { class: "rotator" }).css("--dur", dur);
                if (Math.random() > .5) $rot.addClass("reverse");

                let $item;
                let iconChar = icons.length ? icons[idx % icons.length] : "⭐";
                const iconStr = (typeof iconChar === "string") ? iconChar.trim() : "";
                const isSvg = iconStr.startsWith("<svg");
                const isImg = iconStr.startsWith("<img");
                let classes = ["item", "icon", iconClass];
                if (isSvg) classes.push("is-svg");
                if (isImg) classes.push("is-media");
                // Add class from itemClasses array if available
                if (itemClasses.length > 0) {
                    const itemClass = itemClasses[idx % itemClasses.length];
                    if (itemClass && itemClass.trim() !== '') {
                        classes.push(itemClass);
                    }
                }
                $item = $("<div>", {
                    class: classes.join(" ")
                }).html(iconChar);

                return $rot.append($item);
            };

            for (let i = 0; i < count; i++) {
                fragment.append(createItem(i));
            }

            $orbit.append(fragment);

            const $rotators = $orbit.find(".rotator");
            const c = $rotators.length;
            if (c) {
                const baseAngles = Array.from({ length: c }, (_, idx) => (360 / c) * idx);
                if (randomStart) {
                    for (let i = baseAngles.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [baseAngles[i], baseAngles[j]] = [baseAngles[j], baseAngles[i]];
                    }
                }
                $rotators.each(function (i) {
                    $(this).css("--start", baseAngles[i] + "deg");
                });

                const orbitWidth = $orbit.innerWidth();
                if (orbitWidth > 0) {
                    const radius = orbitWidth / 2;
                    const arcLength = (2 * Math.PI * radius) / c;
                    const maxIconSize = Math.max(28, Math.min(60, arcLength - 8));
                    $orbit.css("--orbit-icon-size", `${maxIconSize}px`);
                }
            }

            const randCol = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            $orbit.find('.item').each(function () {
                const $it = $(this);
                let color = null;

                if (useRandomColor) {
                    color = randCol();
                }

                if (color && !$it.hasClass('is-media')) {
                    if ($it.hasClass('is-svg')) {
                        $it.find('svg, path, circle, rect, polygon, polyline, ellipse, line')
                            .css({ fill: color, color });
                    } else {
                        $it.css('color', color);
                    }
                }
            });
        });
    }

    function pxl_widget_sphere_handler($scope) {
        const canvas = $scope.find(".pxl-sphere canvas");
        if (!canvas.length) return;

        const sphereEl = $scope.find(".pxl-sphere");
        const size = parseInt(sphereEl.data("size")) || 950;
        const radius = parseInt(sphereEl.data("radius")) || size * 0.5;
        const sphereColor = sphereEl.data("color") || "rgba(255, 255, 255, 0.15)";
        const rotationType = sphereEl.data("rotation") || "y_axis";
        const rotationSpeed = parseFloat(sphereEl.data("speed")) || 0.005;
        const customXSpeed = parseFloat(sphereEl.data("xspeed")) || 0.003;
        const customYSpeed = parseFloat(sphereEl.data("yspeed")) || 0.005;
        const tiltAngle =
            ((parseFloat(sphereEl.data("tilt")) || -30) * Math.PI) / 180;

        const ctx = canvas[0].getContext("2d");
        if (!ctx) return;

        canvas[0].width = size;
        canvas[0].height = size;

        let angleX = tiltAngle;
        let angleY = 0;
        let animationId = null;
        let isRunning = true;

        function rotate(point, angleX, angleY) {
            let cosX = Math.cos(angleX),
                sinX = Math.sin(angleX);
            let cosY = Math.cos(angleY),
                sinY = Math.sin(angleY);

            let y = point.y * cosX - point.z * sinX;
            let z = point.y * sinX + point.z * cosX;
            let x = point.x * cosY - z * sinY;
            z = point.x * sinY + z * cosY;
            return { x, y, z };
        }

        function drawSphere() {
            ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
            ctx.strokeStyle = sphereColor;
            ctx.lineWidth = 1;
            const cx = canvas[0].width / 2;
            const cy = canvas[0].height / 2;

            for (
                let lat = -Math.PI / 2;
                lat <= Math.PI / 2;
                lat += Math.PI / 10
            ) {
                let circlePoints = [];
                for (let lon = 0; lon < 2 * Math.PI; lon += Math.PI / 20) {
                    let x = Math.cos(lat) * Math.cos(lon);
                    let y = Math.sin(lat);
                    let z = Math.cos(lat) * Math.sin(lon);
                    let rotatedPoint = rotate({ x, y, z }, angleX, angleY);
                    circlePoints.push(rotatedPoint);
                }
                ctx.beginPath();
                circlePoints.forEach((p, i) => {
                    if (i === 0) {
                        ctx.moveTo(cx + p.x * radius, cy + p.y * radius);
                    } else {
                        ctx.lineTo(cx + p.x * radius, cy + p.y * radius);
                    }
                });
                ctx.closePath();
                ctx.stroke();
            }

            for (let lon = 0; lon < 2 * Math.PI; lon += Math.PI / 10) {
                let circlePoints = [];
                for (
                    let lat = -Math.PI / 2;
                    lat <= Math.PI / 2;
                    lat += Math.PI / 20
                ) {
                    let x = Math.cos(lat) * Math.cos(lon);
                    let y = Math.sin(lat);
                    let z = Math.cos(lat) * Math.sin(lon);
                    let rotatedPoint = rotate({ x, y, z }, angleX, angleY);
                    circlePoints.push(rotatedPoint);
                }
                ctx.beginPath();
                circlePoints.forEach((p, i) => {
                    if (i === 0) {
                        ctx.moveTo(cx + p.x * radius, cy + p.y * radius);
                    } else {
                        ctx.lineTo(cx + p.x * radius, cy + p.y * radius);
                    }
                });
                ctx.stroke();
            }
        }

        function updateRotation() {
            switch (rotationType) {
                case "y_axis":
                    angleY += rotationSpeed;
                    break;
                case "x_axis":
                    angleX += rotationSpeed;
                    break;
                case "both_axis":
                    angleX += rotationSpeed;
                    angleY += rotationSpeed;
                    break;
                case "custom":
                    angleX += customXSpeed;
                    angleY += customYSpeed;
                    break;
            }
        }

        function animate() {
            if (!isRunning) return;
            updateRotation();
            drawSphere();
            animationId = requestAnimationFrame(animate);
        }

        animate();

        // Cleanup khi element bị remove
        sphereEl.on('remove', function () {
            isRunning = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        });

        // Lưu reference để có thể cleanup từ bên ngoài
        sphereEl.data('sphere-animation-id', animationId);
        sphereEl.data('sphere-is-running', isRunning);
    };

    function auregon_parallax_bg() {
        // Kiểm tra plugin parallaxBackground có tồn tại
        if (typeof $.fn.parallaxBackground === 'undefined') {
            console.warn('parallaxBackground plugin not loaded');
            return;
        }

        $(document).find('.pxl-parallax-background').parallaxBackground({
            event: 'mouse_move',
            animation_type: 'shift',
            animate_duration: 2
        });
        $(document).find('.pxl-pll-basic').parallaxBackground();
        $(document).find('.pxl-pll-rotate').parallaxBackground({
            animation_type: 'rotate',
            zoom: 50,
            rotate_perspective: 500
        });
        $(document).find('.pxl-pll-mouse-move').parallaxBackground({
            event: 'mouse_move',
            animation_type: 'shift',
            animate_duration: 2
        });
        $(document).find('.pxl-pll-mouse-move-rotate').parallaxBackground({
            event: 'mouse_move',
            animation_type: 'rotate',
            animate_duration: 1,
            zoom: 70,
            rotate_perspective: 1000
        });

        $(document).find('.pxl-bg-prx-effect-pinned-zoom-clipped').each(function (index, el) {
            // Kiểm tra GSAP và ScrollTrigger có tồn tại
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                return;
            }

            var $el = $(el);
            const clipped_bg_pinned = $el.find('.clipped-bg-pinned');
            const clipped_bg = $el.find('.clipped-bg');

            if (!clipped_bg_pinned.length || !clipped_bg.length) return;

            var clipped_bg_animation = gsap.to(clipped_bg, {
                clipPath: 'inset(0% 0% 0%)',
                scale: 1,
                duration: 1,
                ease: 'Linear.easeNone'
            });

            var clipped_bg_scene = ScrollTrigger.create({
                trigger: clipped_bg_pinned,
                start: function () {
                    const start_pin = 350;
                    return "top +=" + start_pin;
                },
                end: function () {
                    const end_pin = 0;
                    return "+=" + end_pin;
                },
                animation: clipped_bg_animation,
                scrub: 1,
                pin: true,
                pinSpacing: false,
            });

            function set_clipped_bg_wrapper_height() {
                if (typeof gsap !== 'undefined' && clipped_bg.length) {
                    gsap.set(clipped_bg, { height: window.innerHeight });
                }
            }

            var resizeHandler = set_clipped_bg_wrapper_height;
            window.addEventListener('resize', resizeHandler);

            // Cleanup khi element bị remove
            $el.on('remove', function () {
                window.removeEventListener('resize', resizeHandler);
                if (clipped_bg_scene && typeof ScrollTrigger !== 'undefined') {
                    clipped_bg_scene.kill();
                }
            });
        });



        $(document).find('.pxl-bg-prx-effect-pinned-circle-zoom-clipped').each(function (index, el) {
            // Kiểm tra GSAP và ScrollTrigger có tồn tại
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
                return;
            }

            const $el = $(el);

            var svg = $el.find('.circle-zoom-mask-svg');
            var img = $el.find('.clipped-bg-circle-pinned');
            let circle = $el.find('.circle-zoom');

            // Kiểm tra null/undefined
            if (!circle.length || !circle[0] || !img.length || !img[0]) return;

            let radiusAttr = circle[0].getAttribute("r");
            let radius = radiusAttr ? parseFloat(radiusAttr) : 0;
            if (isNaN(radius)) radius = 0;

            gsap.set(img[0], {
                scale: 2
            });

            var tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: "50% 90%",
                    end: "80% 100%",
                    scrub: 2,
                },
                defaults: {
                    duration: 2
                }
            })
                .to(circle[0], {
                    attr: {
                        r: () => radius
                    }
                }, 0)
                .to(img[0], {
                    scale: 1,
                }, 0)
                .to(".circle-inner-layer", {
                    alpha: 0,
                    ease: "power1.in",
                    duration: 1 - 0.25
                }, 0.25);


            window.addEventListener("load", auregon_circle_init);
            window.addEventListener("resize", auregon_circle_resize);

            function auregon_circle_init() {
                auregon_circle_resize();
            }

            function auregon_circle_resize() {
                if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

                tl.progress(0);
                var rect = $(el)[0].getBoundingClientRect();
                const rectWidth = rect.width;
                const rectHeight = rect.height;
                const dx = rectWidth / 2;
                const dy = rectHeight / 2;
                radius = Math.sqrt(dx * dx + dy * dy);

                tl.invalidate();
                ScrollTrigger.refresh();
            }

            // Cleanup khi element bị remove
            $el.on('remove', function () {
                window.removeEventListener("load", auregon_circle_init);
                window.removeEventListener("resize", auregon_circle_resize);
                if (tl && typeof ScrollTrigger !== 'undefined') {
                    tl.kill();
                }
            });
        });
    }

    function auregon_logo_marquee($scope) {
        const logos = $scope.find('.pxl-item--marquee');
        gsap.set(logos, { autoAlpha: 1 })

        logos.each(function (index, el) {
            gsap.set(el, { xPercent: 100 * index });
        });

        if (logos.length > 2) {
            const logosWrap = gsap.utils.wrap(-100, ((logos.length - 1) * 100));
            const durationNumber = logos.data('duration');
            const slipType = logos.data('slip-type');
            var slipResult = `-=${logos.length * 100}`;
            if (slipType == 'right') {
                slipResult = `+=${logos.length * 100}`;
            }
            gsap.to(logos, {
                xPercent: slipResult,
                duration: durationNumber,
                repeat: -1,
                ease: 'none',
                modifiers: {
                    xPercent: xPercent => logosWrap(parseFloat(xPercent))
                }
            });
        }
    }

    function auregon_progressbar_handler($scope) {
        if (!window.elementorFrontend || typeof elementorFrontend.waypoint !== 'function') return;

        elementorFrontend.waypoint($scope.find('.pxl-progress-bar'), function () {
            if (typeof $(this).progressbar === 'function') {
                $(this).progressbar();
            }
        });
        elementorFrontend.waypoint($scope.find('.pxl-progressbar.circle'), function () {
            var $progressbarElem = $scope.find(".pxl-progressbar-container"),
                $progressbarElemInner = $scope.find(".pxl-progressbar-inner"),
                settings = $progressbarElem.data("settings");

            // Kiểm tra settings có tồn tại
            if (!settings || typeof settings !== 'object') return;

            var length = settings.circle_percent || 0,
                number = settings.circle_number || 0,
                prefix = settings.prefix || '',
                suffix = settings.suffix || '',
                speed = settings.speed || 1000;

            if (length > 100)
                length = 100;

            $progressbarElem.prop({
                'percent': 0
            }).animate({
                percent: number
            }, {
                duration: speed,
                easing: 'linear',
                step: function (percent) {
                    var rotate = (100 - percent);
                    var rotate1 = (percent + 8);
                    $progressbarElem.find(".js-progress-bar").css('stroke-dashoffset', rotate);
                    $progressbarElem.find(".js-progress-bar1").css('stroke-dashoffset', rotate1);
                }
            });

            $progressbarElemInner.prop({
                'counter': 0,
            }).animate({
                counter: number,
            }, {
                duration: speed,
                easing: 'linear',
                step: function (counter) {
                    var $numberEl = $progressbarElem.find(".progress-number");
                    if ($numberEl.length) {
                        $numberEl.text(Math.ceil(counter));
                    } else {
                        $progressbarElem.find(".progress-percentage").text(prefix + Math.ceil(counter) + suffix);
                    }
                }
            });

        });
    }

    function auregon_care_orbit_tabs_handler($scope) {

        var px1209_width = $(window).width();

        const root = $scope && $scope[0] ? $scope[0] : ($scope || document);
        const svgTexts = root.querySelectorAll('.svg-tab-text');
        const tabColumns = root.querySelectorAll('.care-orbit-col.tab-pane');
        const svgEl = root.querySelector('.pxl-care-orbit-tabs .pxl-tabs--title svg');

        // Chỉ chạy dots cho màn hình lớn
        let dotsLeft = null;
        let dotsRight = null;
        if (px1209_width >= 1281) {
            dotsLeft = svgEl ? svgEl.querySelector('.orbit-dots-left') : null;
            dotsRight = svgEl ? svgEl.querySelector('.orbit-dots-right') : null;

            if (!svgEl || !dotsLeft || !dotsRight) {
                return;
            }
        }

        // Kiểm tra svgEl có tồn tại (cần thiết cho cả trường hợp width < 1281)
        if (!svgEl) return;

        const vb = svgEl.viewBox && svgEl.viewBox.baseVal ? svgEl.viewBox.baseVal : null;
        if (!vb || vb.width === 0 || vb.height === 0) return;

        const centerX = vb.x + vb.width / 2;
        const centerY = vb.y + vb.height / 2;
        const outerR = Math.min(vb.width, vb.height) / 2;
        const inset = 3;
        const dotRpx = 9.5;

        function pxToVb() {
            const rect = svgEl.getBoundingClientRect();
            return {
                sx: vb.width / rect.width,
                sy: vb.height / rect.height
            };
        }

        function clearDots() {
            dotsLeft.innerHTML = '';
            dotsRight.innerHTML = '';
        }

        let rafId = null;
        function schedulePlaceDots() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(placeDots);
        }

        function placeDots() {
            // Chỉ chạy dots nếu có dotsLeft và dotsRight
            if (!dotsLeft || !dotsRight) return;

            clearDots();

            const activePanes = root.querySelectorAll('.pxl-care-orbit-tabs .tab-pane.active');
            if (!activePanes.length) return;

            const rect = svgEl.getBoundingClientRect();
            const { sx, sy } = pxToVb();

            const dotRv = dotRpx * ((sx + sy) / 2);

            activePanes.forEach(pane => {
                const isLeft = pane.classList.contains('care-orbit-col-left');
                const entries = pane.querySelectorAll('.entry-body');

                entries.forEach(entry => {
                    const r = entry.getBoundingClientRect();
                    const yScreen = r.top + r.height / 2;

                    const ySvg = (yScreen - rect.top) * sy + vb.y;

                    const dy = ySvg - centerY;
                    const clamp = Math.max(outerR * outerR - dy * dy, 0);
                    const xOn = Math.sqrt(clamp);
                    const xSvg = isLeft ? (centerX - xOn + inset) : (centerX + xOn - inset);

                    const g = isLeft ? dotsLeft : dotsRight;
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', xSvg);
                    circle.setAttribute('cy', ySvg);
                    circle.setAttribute('r', dotRv);
                    circle.setAttribute('fill', '#192273');
                    circle.setAttribute('stroke', '#D3DDFF');
                    circle.setAttribute('stroke-width', (2.5 * ((sx + sy) / 2)));
                    circle.setAttribute('vector-effect', 'non-scaling-stroke');
                    g.appendChild(circle);
                });
            });
        }

        svgTexts.forEach(svgText => {
            svgText.addEventListener('click', function () {
                const targetId = this.getAttribute('data-target');

                svgTexts.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                tabColumns.forEach(c => {
                    c.classList.remove('active');
                    c.style.display = 'none';
                });

                const matchCols = root.querySelectorAll('.care-orbit-col.tab-pane[data-tab="' + targetId + '"]');
                matchCols.forEach(c => {
                    c.classList.add('active');
                    c.style.display = 'flex';
                });

                // Chỉ gọi schedulePlaceDots nếu có dots
                if (dotsLeft && dotsRight) {
                    schedulePlaceDots();
                }
            });
        });

        // Chỉ setup dots observers nếu có dots
        let ro = null;
        if (dotsLeft && dotsRight) {
            ro = new ResizeObserver(schedulePlaceDots);
            ro.observe(svgEl);
            const contentHost = root.querySelector('.pxl-care-orbit-tabs');
            if (contentHost) ro.observe(contentHost);

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(schedulePlaceDots).catch(() => { });
            }

            window.addEventListener('resize', schedulePlaceDots, { passive: true });

            requestAnimationFrame(schedulePlaceDots);
        }

        return function cleanup() {
            if (dotsLeft && dotsRight) {
                window.removeEventListener('resize', schedulePlaceDots);
                if (ro) ro.disconnect();
                if (rafId) cancelAnimationFrame(rafId);
                clearDots();
            }
        };
    }

    function auregon_post_carousel_handler($scope) {
        const rootEl = $scope && $scope[0] ? $scope[0] : document;
        const stepsContainer = rootEl.querySelector(".pxl-grid-filter.style-3");
        const pill = rootEl.querySelector("#pxl-item-step-active-pill");
        const steps = Array.from(rootEl.querySelectorAll(".filter-item"));

        if (!stepsContainer || !pill || !steps.length) return;

        const getActiveIndex = () => {
            const i = steps.findIndex((b) => b.classList.contains("active"));
            return i === -1 ? 0 : i;
        };

        const setActive = (index) => {
            index = Math.min(Math.max(index, 0), steps.length - 1);
            steps.forEach((b) => b.classList.remove("active"));
            steps[index].classList.add("active");
            updatePill(index);
        };

        const updatePill = (index = getActiveIndex()) => {
            index = Math.min(Math.max(index, 0), steps.length - 1);
            const containerRect = stepsContainer.getBoundingClientRect();
            const stepRect = steps[index].getBoundingClientRect();
            const stepWidth = stepRect.width || steps[index].offsetWidth || 0;
            const translateX = stepRect.left - containerRect.left;

            pill.style.width = `${Math.max(0, stepWidth - 2)}px`;
            pill.style.transform = `translateX(${translateX}px)`;
        };

        steps.forEach((btn, index) => {
            btn.addEventListener("click", () => {
                setActive(index);
            });
        });

        setActive(getActiveIndex());

        const onResize = () => {
            if (rootEl !== document && !rootEl.isConnected) {
                window.removeEventListener("resize", onResize);
                return;
            }
            updatePill();
        };

        window.addEventListener("resize", onResize, { passive: true });

    }

    // function auregon_text_carousel_style2_handler($scope) {
    //     if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    //         console.warn('GSAP or ScrollTrigger not loaded');
    //         return;
    //     }

    //     const widget = $scope.find('.pxl-text-carousel3.style-2');
    //     if (!widget.length) return;

    //     const steps = widget.find('.pxl-item--step');
    //     const cards = widget.find('.pxl-item--inner');

    //     if (!steps.length || !cards.length) return;

    //     // Initialize first item active
    //     steps.removeClass('is-active');
    //     cards.removeClass('is-active');
    //     steps.first().addClass('is-active');
    //     cards.first().addClass('is-active');

    //     // Pin the section
    //     ScrollTrigger.create({
    //         trigger: widget,
    //         start: "top 20%",
    //         end: "+=" + (steps.length * 500), // Adjust scroll distance per step
    //         pin: true,
    //         scrub: true,
    //         onUpdate: (self) => {
    //             const progress = self.progress;
    //             const totalSteps = steps.length;
    //             let activeIndex = Math.floor(progress * totalSteps);

    //             // Ensure index is within bounds
    //             if (activeIndex >= totalSteps) activeIndex = totalSteps - 1;

    //             // Update active classes if changed
    //             if (!steps.eq(activeIndex).hasClass('is-active')) {
    //                 steps.removeClass('is-active');
    //                 cards.removeClass('is-active');

    //                 steps.eq(activeIndex).addClass('is-active');
    //                 cards.eq(activeIndex).addClass('is-active');
    //             }
    //         }
    //     });
    // }

function auregon_text_carousel_handler($scope) {
  const root = $scope && $scope[0] ? $scope[0] : document;

  const stepsContainer = root.querySelector(".pxl-item--steps");
  const pill =
    root.querySelector("#pxl-item-step-active-pill") ||
    root.querySelector(".pxl-item-step-active-pill");

  const steps = Array.from(root.querySelectorAll(".pxl-item--step"));
  const cards = Array.from(root.querySelectorAll(".pxl-item--inner"));

  if (!stepsContainer || !pill || !steps.length || !cards.length) return;

  // Prevent duplicate init (Elementor re-render)
  if (root.__auregonTextCarouselDestroy) {
    root.__auregonTextCarouselDestroy();
    root.__auregonTextCarouselDestroy = null;
  }

  // ---------------- Utils ----------------
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const stepIdByIndex = (i) => steps[i]?.getAttribute("data-step") || null;

  const findIndexByStepId = (stepId) => {
    let i = steps.findIndex((s) => s.getAttribute("data-step") === stepId);
    if (i !== -1) return i;
    i = cards.findIndex((c) => c.getAttribute("data-step") === stepId);
    return i;
  };

  const getActiveIndex = () => {
    const i = steps.findIndex((s) => s.classList.contains("is-active"));
    return i === -1 ? 0 : i;
  };

  // Measure once per “update cycle”
  let metrics = null;
  const measure = () => {
    const containerRect = stepsContainer.getBoundingClientRect();
    const firstRect = steps[0].getBoundingClientRect();

    const stepWidth = firstRect.width || steps[0].offsetWidth || 0;

    // Compute gap: prefer actual distance between step[0] and step[1]
    let gapPx = 6;
    if (steps.length > 1) {
      const secondRect = steps[1].getBoundingClientRect();
      const raw = secondRect.left - firstRect.left - stepWidth;
      if (raw > 0) gapPx = raw;
    } else {
      const cs = getComputedStyle(stepsContainer);
      const g = parseFloat(cs.columnGap || cs.gap || "6");
      if (!Number.isNaN(g)) gapPx = g;
    }

    const baseOffset = firstRect.left - containerRect.left;
    metrics = { stepWidth, gapPx, baseOffset };
  };

  const updatePill = (index = getActiveIndex()) => {
    index = clamp(index, 0, steps.length - 1);
    if (!metrics) measure();

    const { stepWidth, gapPx, baseOffset } = metrics;
    const translateX = baseOffset + index * (stepWidth + gapPx);

    pill.style.width = `${Math.max(0, stepWidth - 2)}px`;
    pill.style.transform = `translateX(${translateX}px)`;
  };

  const setActive = (index) => {
    index = clamp(index, 0, steps.length - 1);
    const stepId = stepIdByIndex(index);
    if (!stepId) return;

    steps.forEach((s, i) => s.classList.toggle("is-active", i === index));
    cards.forEach((c) =>
      c.classList.toggle("is-active", c.getAttribute("data-step") === stepId)
    );

    updatePill(index);
  };

  const activateByStepId = (stepId) => {
    if (!stepId) return;
    const index = findIndexByStepId(stepId);
    if (index === -1) return;
    setActive(index);
  };

  // ---------------- Init ----------------
  const initialStepId =
    steps.find((s) => s.classList.contains("is-active"))?.getAttribute("data-step") ||
    cards.find((c) => c.classList.contains("is-active"))?.getAttribute("data-step") ||
    steps[0].getAttribute("data-step") ||
    cards[0].getAttribute("data-step");

  steps.forEach((s) => s.classList.remove("is-active"));
  cards.forEach((c) => c.classList.remove("is-active"));

  metrics = null; // ensure fresh measurement
  if (initialStepId) activateByStepId(initialStepId);
  else setActive(0);

  // ---------------- Events ----------------
  const onStepClick = (e) => {
    const step = e.target.closest(".pxl-item--step");
    if (!step || !stepsContainer.contains(step)) return;
    activateByStepId(step.getAttribute("data-step"));
  };
  stepsContainer.addEventListener("click", onStepClick);

  let lastStepId = null;
  const cardEnterHandlers = new Map();

  cards.forEach((card) => {
    const fn = () => {
      const stepId = card.getAttribute("data-step");
      if (!stepId || stepId === lastStepId) return;
      lastStepId = stepId;
      activateByStepId(stepId);
    };
    cardEnterHandlers.set(card, fn);
    card.addEventListener("pointerenter", fn, { passive: true });
  });

  const onResize = () => {
    if (root !== document && !root.isConnected) return;
    metrics = null; // re-measure on next update
    updatePill();
  };
  window.addEventListener("resize", onResize, { passive: true });

  // Layout settle (fonts/Elementor)
  const t = setTimeout(() => {
    metrics = null;
    updatePill();
  }, 0);

  // ---------------- Destroy ----------------
  root.__auregonTextCarouselDestroy = () => {
    stepsContainer.removeEventListener("click", onStepClick);

    cards.forEach((card) => {
      const fn = cardEnterHandlers.get(card);
      if (fn) card.removeEventListener("pointerenter", fn);
    });
    cardEnterHandlers.clear();

    window.removeEventListener("resize", onResize);
    clearTimeout(t);

    metrics = null;
  };
}

    function setupGlowAnimation($scope) {
        var $wrapper = $scope.find(".pxl-section-mouse-follower");
        if (!$wrapper.length) return;

        // Check if already initialized
        if ($wrapper.data("glow-animation-initialized")) return;

        var $mouseGlow = $wrapper.find(".pxl-section-mouse-follower-shape1");
        var $blobPurple = $wrapper.find(".pxl-section-mouse-follower-shape2");

        // Create HTML elements if they don't exist
        if (!$mouseGlow.length) {
            $mouseGlow = $('<div class="pxl-section-mouse-follower-shape1"></div>');
            $wrapper.append($mouseGlow);
        }
        if (!$blobPurple.length) {
            $blobPurple = $('<div class="pxl-section-mouse-follower-shape2"></div>');
            $wrapper.append($blobPurple);
        }

        var state = {
            glowIntensity: 0,
            mouseX: 0,
            mouseY: 0,
            isActive: false,
            rafId: null,
            isRunning: true
        };

        // Unique namespace for this wrapper
        var namespace = "pxlGlow_" + ($wrapper[0] ? $wrapper[0].getAttribute('data-id') || Date.now() : Date.now());

        function handleMouseMove(e) {
            if (!state.isRunning) return;

            var rect = $wrapper[0] ? $wrapper[0].getBoundingClientRect() : null;
            if (!rect) return;

            var inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
            if (!inside) {
                state.isActive = false;
                $mouseGlow.css("opacity", 0);
                return;
            }

            state.isActive = true;
            state.mouseX = e.clientX - rect.left;
            state.mouseY = e.clientY - rect.top;

            $mouseGlow.css({
                left: state.mouseX + "px",
                top: state.mouseY + "px",
                opacity: 1
            });
            $blobPurple.css("opacity", 1);
        }

        // Bind mouse move event with unique namespace
        $(document).on("mousemove." + namespace, handleMouseMove);

        function animate() {
            if (!state.isRunning) return;

            state.glowIntensity = (state.glowIntensity + 0.06) % (Math.PI * 2);

            if (!state.isActive) {
                state.rafId = requestAnimationFrame(animate);
                return;
            }

            var scale = 1 + Math.sin(state.glowIntensity) * 0.2;
            $mouseGlow.css("transform", "translate(-50%, -50%) scale(" + scale + ")");

            var blobScale = 1 + Math.cos(state.glowIntensity) * 0.15;
            $blobPurple.css("transform", "translate(-50%, -50%) scale(" + blobScale + ")");

            state.rafId = requestAnimationFrame(animate);
        }

        // Start animation
        state.rafId = requestAnimationFrame(animate);

        // Mark as initialized
        $wrapper.data("glow-animation-initialized", true);

        // Cleanup function
        $wrapper.data("glow-animation-cleanup", function () {
            state.isRunning = false;
            if (state.rafId) {
                cancelAnimationFrame(state.rafId);
                state.rafId = null;
            }
            $(document).off("mousemove." + namespace);
            $wrapper.removeData("glow-animation-initialized");
            $wrapper.removeData("glow-animation-cleanup");
        });

        // Cleanup when element is removed
        $wrapper.on('remove', function () {
            var cleanup = $wrapper.data("glow-animation-cleanup");
            if (cleanup && typeof cleanup === 'function') {
                cleanup();
            }
        });
    }

    function auregon_text_hover_image($scope) {

        if ($scope.find('.pxl-awards-list,.pxl-portfolio-grid-layout3').length <= 0) return;
        var mouseX = 0,
            mouseY = 0;

        $scope.find('.pxl-awards-list .content-inner,.pxl-portfolio-grid-layout3 .pxl-grid-inner').mousemove(function (e) {
            var offset = $(this).offset();
            mouseX = (e.pageX - offset.left);
            mouseY = (e.pageY - offset.top);

        });
        gsap.utils.toArray(".pxl-awards-list .fade-in-up, .pxl-portfolio-grid-layout3 .fade-in-up").forEach((element) => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                duration: 1,
                opacity: 0,
                y: 80,
                ease: "power4.out"
            });
        });

        $scope.find('.pxl-awards-list .pxl--item,.pxl-portfolio-grid-layout3 .pxl-grid-item').on("mouseenter", function () {
            $(this).removeClass('deactive').addClass('active');
            var target = $(this).attr('data-target');
            $(this).closest('.content-inner,.pxl-grid-inner').find(target).removeClass('deactive').addClass('active');
        });
        $scope.find('.pxl-awards-list .pxl--item,.pxl-portfolio-grid-layout3 .pxl-grid-item').on("mouseleave", function () {
            $(this).addClass('deactive').removeClass('active');
            var target = $(this).attr('data-target');
            $(this).closest('.content-inner,.pxl-grid-inner').find(target).addClass('deactive').removeClass('active');
        });
        const s = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        },
            t = gsap.quickSetter($scope.find('.pxl-awards-list .content-inner,.pxl-portfolio-grid-layout3 .pxl-grid-inner'), "css"),
            e = gsap.quickSetter($scope.find('.pxl-awards-list .content-inner,.pxl-portfolio-grid-layout3 .pxl-grid-inner'), "css");

        gsap.ticker.add((() => {
            const o = .15,
                i = 1 - Math.pow(.85, gsap.ticker.deltaRatio());
            s.x += (mouseX - s.x) * i,
                s.y += (mouseY - s.y) * i,
                t({
                    "--pxl-mouse-x": `${s.x}px`
                }), e({
                    "--pxl-mouse-y": `${s.y}px`
                })
        }))
    }


    $(document).ready(function () {
        if (window.elementorFrontend && typeof elementorFrontend.waypoint === 'function') {
            auregon_animation_handler();
        }
        auregon_section_divider_glow();
        auregon_border_glow();
    });

    $(window).on('elementor/frontend/init', function () {
        // Bổ sung waypoint nếu thiếu
        auregon_polyfill_waypoint();
        elementorFrontend.hooks.addAction('frontend/element_ready/global', function ($scope) {
            auregon_scroll_checkp($scope);
            auregon_animation_handler($scope);
            auregon_section_divider_glow($scope);
            auregon_border_glow($scope);
            renderOrbit($scope);
            setupGlowAnimation($scope);
        });
        auregon_section_start_render();
        auregon_parallax_bg();
        auregon_css_inline_js();
        auregon_section_before_render();
        auregon_zoom_point();
        auregon_scroll_fixed_section();
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_contact_form.default', PXL_Icon_Contact_Form);
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_heading.default', function ($scope) {
            auregon_split_text($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_post_carousel.default', function ($scope) {
            auregon_post_carousel_handler($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_sphere.default', function ($scope) {
            pxl_widget_sphere_handler($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_text_carousel.default', function ($scope) {
            auregon_text_carousel_handler($scope);
            // auregon_text_carousel_style2_handler($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_post_slip.default', function ($scope) {
            auregon_split_text($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_section_scale.default', function ($scope) {
            auregon_scroll_trigger($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_progressbar.default', function ($scope) {
            auregon_progressbar_handler($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_logo_marquee.default', function ($scope) {
            auregon_logo_marquee($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_awards_list.default', function ($scope) {
            auregon_text_hover_image($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_text_marquee.default', function ($scope) {
            auregon_text_marquee($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_care_orbit_tabs.default', function ($scope) {
            setTimeout(function () {
                auregon_care_orbit_tabs_handler($scope);
            }, 0);
        });
    });
})(jQuery);
