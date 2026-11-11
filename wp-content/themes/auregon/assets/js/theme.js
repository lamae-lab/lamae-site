; (function ($) {

    "use strict";

    var pxl_scroll_top;
    var pxl_window_height;
    var pxl_window_width;
    var pxl_scroll_status = '';
    var pxl_last_scroll_top = 0;
    var pxl_post_slip = false;

    var scrollTimeout = null;
    var scrollRAF = null;
    var resizeTimeout = null;

    // Cached Selectors
    var $pinSpacer = null;
    var $pxlHeaderElementor = null;
    var $pxlHeaderSticky = null;
    var $pxlHeaderMobile = null;
    var $pxlFooterElementor = null;
    var $pxlMain = null;
    var $pxlScrollTop = null;
    var $body = null;

    $(window).on('load', function () {
        setTimeout(function () {
            $(".pxl-loader").addClass("is-loaded");
        }, 60);

        // Init Cached Selectors
        $pinSpacer = $('.elementor > .pin-spacer');
        $pxlHeaderElementor = $('#pxl-header-elementor');
        $pxlHeaderSticky = $('.pxl-header-elementor-sticky');
        $pxlHeaderMobile = $('#pxl-header-mobile');
        $pxlFooterElementor = $('.pxl-footer-fixed #pxl-footer-elementor');
        $pxlMain = $('#pxl-main');
        $pxlScrollTop = $('.pxl-scroll-top');
        $body = $('body');

        auregon_pageLoad();
        $('.pxl-swiper-slider, .pxl-header-mobile-elementor').css('opacity', '1');
        pxl_window_width = $(window).width();
        pxl_window_height = $(window).height();

        auregon_header_sticky();
        auregon_header_mobile();
        auregon_scroll_to_top();
        auregon_footer_fixed();
        // auregon_check_scroll();
        dropdown_offices();
        auregon_shop_quantity();
        auregon_submenu_responsive();
        auregon_panel_anchor_toggle();
        auregon_slider_column_offset();
        auregon_height_ct_grid();
        auregon_bgr_parallax();
        auregon_shop_view_layout();
        auregon_menu_divider_move();
        auregon_el_parallax();
        setTimeout(function () {
            if (typeof initTeamGridUrlState === 'function') {
                initTeamGridUrlState();
            }
        }, 400);
    });

    $(window).on('scroll', function () {
        if (scrollRAF) {
            cancelAnimationFrame(scrollRAF);
        }

        scrollRAF = requestAnimationFrame(function () {
            pxl_scroll_top = $(window).scrollTop();

            // Optimization: Detect direction without forcing layout
            if (pxl_scroll_top < pxl_last_scroll_top) {
                pxl_scroll_status = 'up';
            } else {
                pxl_scroll_status = 'down';
            }
            pxl_last_scroll_top = pxl_scroll_top;

            auregon_header_sticky();
            auregon_scroll_to_top();
            // auregon_footer_fixed(); // Optim: Removed from scroll loop, handle in resize only
            // auregon_check_scroll();
            auregon_ptitle_scroll_opacity();

            if (pxl_scroll_top < 100) {
                if ($pinSpacer && $pinSpacer.length) {
                    $pinSpacer.removeClass('scroll-top-active');
                }
            }

            scrollRAF = null;
        });
    });

    $(window).on('resize', function () {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        resizeTimeout = setTimeout(function () {
            pxl_window_height = $(window).height();
            pxl_window_width = $(window).width();
            auregon_submenu_responsive();
            auregon_height_ct_grid();
            auregon_header_mobile();
            auregon_slider_column_offset();
            setTimeout(function () {
                auregon_menu_divider_move();
            }, 500);

            resizeTimeout = null;
        }, 150);
    });

    $(document).ready(function () {
        pxl_window_width = $(window).width();
        auregon_backtotop_progess_bar();
        auregon_type_file_upload();
        auregon_zoom_point();
        if (pxl_window_width > 767) {
            auregon_button_parallax1();
        }
        setTimeout(function () {
            $('.pxl-section-bg-parallax').closest('.elementor-element').addClass('pxl-section-parallax-overflow');
        }, 500);

        if (pxl_window_width > 767) {
            auregon_button_parallax();
        }

        $('.pxl-circle-svg svg').each(function () {
            var linearGradient = $(this).find('.linear-dot1');
            if (linearGradient.length > 0) {
                var linearGradientId = linearGradient.attr('id');
            }
            var linearGradient1 = $(this).find('.linear-dot2');
            if (linearGradient1.length > 0) {
                var linearGradientId1 = linearGradient1.attr('id');
            }
            auregon_circle_svg(this, linearGradientId, linearGradientId1);
        });

        let runningColumnAnimations = 0;
        const maxColumnAnimations = 4;

        function animateColumn(colId, speed) {
            if (runningColumnAnimations >= maxColumnAnimations) return;

            const $col = $('#' + colId);
            if (!$col.length || $col.data('colTween')) return;

            const slideHeight = $col.outerHeight() / 2;
            if (slideHeight <= 0) return;

            const tween = gsap.to($col[0], {
                y: -slideHeight,
                ease: "none",
                duration: speed * 0.5,
                repeat: -1,
                modifiers: {
                    y: gsap.utils.unitize(y => parseFloat(y) % slideHeight)
                },
                onStart: () => runningColumnAnimations++,
                onKill: () => {
                    runningColumnAnimations = Math.max(0, runningColumnAnimations - 1);
                    $col.removeData('colTween');
                },
                paused: true // Start paused
            });

            $col.data('colTween', tween);

            // Optimization: IntersectionObserver
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            tween.play();
                        } else {
                            tween.pause();
                        }
                    });
                });
                observer.observe($col[0]);
            } else {
                tween.play(); // Fallback
            }
        }

        if (pxl_window_width > 767) {
            setTimeout(() => {
                if ($('#col1').length) animateColumn("col1", 34);
            }, 100);

            setTimeout(() => {
                if ($('#col2').length) animateColumn("col2", 32);
            }, 200);

            setTimeout(() => {
                if ($('#col3').length) animateColumn("col3", 30);
            }, 300);

            setTimeout(() => {
                if ($('#col4').length) animateColumn("col4", 28);
            }, 400);
        }

        $('a[href]:not(.is-one-page ), .btn.btn-2-icons[href]').on('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href.charAt(0) !== '#') {
                return;
            }

            // Exclude tabs links and search popup
            const $link = $(this);
            if ($link.closest('.tabs').length || $link.closest('#pxl-search-popup').length || href === '#pxl-search-popup') {
                return;
            }

            e.preventDefault();
            if (href === '#' || href === '#top') {
                $('html, body').animate({ scrollTop: 0 }, 600);
                return;
            }
            const $target = $(href);
            if ($target.length) {
                // Account for fixed header if present
                const offsetScroll = $('.pxl-header-elementor-sticky').length ? $('.pxl-header-elementor-sticky').outerHeight() : 0;
                $('html, body').animate(
                    { scrollTop: $target.offset().top - offsetScroll },
                    600
                );
            }
        });

        // Location
        $(".pxl-location .pxl-list .pxl--item").on("mouseenter mouseleave", function (e) {
            let id = $(this).attr("id");
            if (!id) return;

            $('.elementor-element[id="' + id + '"]').toggleClass("active", e.type === "mouseenter");
        });
        // 

        $('.pxl-check-scroll .pxl-swiper-slide .filter-item').on('mousedown', function () {
            var $gridItem = $(this).closest('.pxl-swiper-slide');
            $gridItem.removeClass('visible').addClass('visible');
        });

        /* Section Particles - Lazy Load */
        setTimeout(function () {
            var $rowsParticles = $(".pxl-row-particles");
            if (typeof particlesJS !== 'function' || !$rowsParticles.length) {
                return;
            }

            var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

            if (isMobile) {
                $rowsParticles.hide();
                return;
            }

            // Intersection Observer for Lazy Init
            if ('IntersectionObserver' in window) {
                var particlesObserver = new IntersectionObserver(function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            var $el = $(entry.target);
                            if (!$el.data('particles-inited')) {
                                $el.data('particles-inited', true);
                                particlesJS($el.attr('id'), {
                                    "particles": {
                                        "number": { "value": $el.data('number') },
                                        "color": { "value": $el.data('color') },
                                        "shape": { "type": "circle" },
                                        "size": {
                                            "value": $el.data('size'),
                                            "random": $el.data('size-random'),
                                        },
                                        "line_linked": { "enable": false },
                                        "move": {
                                            "enable": true,
                                            "speed": 2,
                                            "direction": $el.data('move-direction'),
                                            "random": true,
                                            "out_mode": "out",
                                        }
                                    },
                                    "retina_detect": true
                                });
                                observer.unobserve(entry.target);
                            }
                        }
                    });
                }, { rootMargin: "0px 0px 100px 0px" });

                $rowsParticles.each(function () {
                    particlesObserver.observe(this);
                });
            } else {
                // Fallback for no observer support
                $rowsParticles.each(function () {
                    particlesJS($(this).attr('id'), {
                        "particles": {
                            "number": { "value": $(this).data('number') },
                            "color": { "value": $(this).data('color') },
                            "shape": { "type": "circle" },
                            "size": {
                                "value": $(this).data('size'),
                                "random": $(this).data('size-random'),
                            },
                            "line_linked": { "enable": false },
                            "move": {
                                "enable": true,
                                "speed": 2,
                                "direction": $(this).data('move-direction'),
                                "random": true,
                                "out_mode": "out",
                            }
                        },
                        "retina_detect": true
                    });
                });
            }
        }, 400);

        /* Start Menu Mobile */
        $('.pxl-header-menu li.menu-item-has-children').append('<span class="pxl-menu-toggle"></span>');
        $('.pxl-menu-toggle').on('click', function () {
            if ($(this).hasClass('active')) {
                $(this).closest('ul').find('.pxl-menu-toggle.active').toggleClass('active');
                $(this).closest('ul').find('.sub-menu.active').toggleClass('active').slideToggle();
            } else {
                $(this).closest('ul').find('.pxl-menu-toggle.active').toggleClass('active');
                $(this).closest('ul').find('.sub-menu.active').toggleClass('active').slideToggle();
                $(this).toggleClass('active');
                $(this).parent().find('> .sub-menu').toggleClass('active');
                $(this).parent().find('> .sub-menu').slideToggle();
            }
        });

        $('li.pxl-megamenu').hover(function () {
            $(this).parents('.elementor-element').addClass('section-mega-active')
        }, function () {
            $(this).parents('.elementor-element').removeClass('section-mega-active')
        })

        $("#pxl-nav-mobile, .pxl-anchor-mobile-menu").on('click', function () {
            $(this).toggleClass('active');
            $('body').toggleClass('body-overflow');
            $('.pxl-header-menu').toggleClass('active');
        });

        $(".pxl-menu-close, .pxl-header-menu-backdrop, #pxl-header-mobile .pxl-menu-primary a.is-one-page").on('click', function () {
            $(this).parents('.pxl-header-main').find('.pxl-header-menu').removeClass('active');
            $('#pxl-nav-mobile').removeClass('active');
            $('body').toggleClass('body-overflow');
        });
        /* End Menu Mobile */

        /* Menu Vertical */
        $('.pxl-nav-vertical li.menu-item-has-children > a').append('<span class="pxl-arrow-toggle"><i class="bi-chevron-right"></i></span>');
        $('.pxl-nav-vertical li.menu-item-has-children > a').on('click', function () {
            if ($(this).hasClass('active')) {
                $(this).next().toggleClass('active').slideToggle();
            } else {
                $(this).closest('ul').find('.sub-menu.active').toggleClass('active').slideToggle();
                $(this).closest('ul').find('a.active').toggleClass('active');
                $(this).find('.pxl-menu-toggle.active').toggleClass('active');
                $(this).toggleClass('active');
                $(this).next().toggleClass('active').slideToggle();
            }
        });

        $(".comments-area .btn-submit").append(`
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M0.0255452 17.1785C-0.122363 17.8582 0.399474 18.1459 0.883677 17.9288L17.2485 9.53756H17.2502C17.4453 9.42746 17.5587 9.22906 17.5587 9.00019C17.5587 8.77119 17.4453 8.57266 17.2502 8.46261H17.2485L0.883677 0.0711896C0.399474 -0.145935 -0.122363 0.141874 0.0255452 0.821583C0.035554 0.867623 1.00303 5.17714 1.52904 7.52094L10.0718 9.00015L1.52904 10.4792C1.00303 12.8228 0.0355095 17.1325 0.0255452 17.1785Z" fill="white"/>
            </svg>
            `);

        /* Mega Menu Max Height */
        var m_h_mega = $('li.pxl-megamenu > .sub-menu > .pxl-mega-menu-elementor').outerHeight();
        var w_h_mega = $(window).height();
        var w_h_mega_css = w_h_mega - 120;
        if (m_h_mega > w_h_mega) {
            $('li.pxl-megamenu > .sub-menu > .pxl-mega-menu-elementor').css('max-height', w_h_mega_css + 'px');
            $('li.pxl-megamenu > .sub-menu > .pxl-mega-menu-elementor').css('overflow-y', 'scroll');
            $('li.pxl-megamenu > .sub-menu > .pxl-mega-menu-elementor').css('overflow-x', 'hidden');
        }
        // Active Mega Menu Hover
        $('li.pxl-megamenu').hover(function () {
            $(this).parents('.elementor-element').addClass('section-mega-active');
        }, function () {
            $(this).parents('.elementor-element').removeClass('section-mega-active');
        });
        /* End Mega Menu Max Height */
        /* Search Popup */
        var $search_wrap_init = $("#pxl-search-popup");
        var search_field = $('#pxl-search-popup .search-field');
        var $body = $('body');

        $(".pxl-search-popup-button").on('click', function (e) {
            if (!$search_wrap_init.hasClass('active')) {
                $search_wrap_init.addClass('active');
                setTimeout(function () { search_field.get(0).focus(); }, 500);
            } else if (search_field.val() === '') {
                $search_wrap_init.removeClass('active');
                search_field.get(0).focus();
            }
            e.preventDefault();
            return false;
        });

        $(".pxl-subscribe-popup .pxl-item--overlay, .pxl-subscribe-popup .pxl-item--close").on('click', function (e) {
            $(this).parents('.pxl-subscribe-popup').removeClass('pxl-active');
            e.preventDefault();
            return false;
        });

        $("#pxl-search-popup .pxl-item--overlay, #pxl-search-popup .pxl-item--close").on('click', function (e) {
            $body.addClass('pxl-search-out-anim');
            setTimeout(function () {
                $body.removeClass('pxl-search-out-anim');
            }, 800);
            setTimeout(function () {
                $search_wrap_init.removeClass('active');
            }, 800);
            e.preventDefault();
            return false;
        });

        $(document).on('click', 'a[href="#pxl-search-popup"]', function (e) {
            e.preventDefault();
            $('#pxl-search-popup').addClass('active');
        });


        /* Scroll To Top */
        $('.pxl-scroll-top').click(function () {
            $('html, body').animate({ scrollTop: 0 }, 1200);
            $(this).parents('.pxl-wapper').find('.elementor > .pin-spacer').addClass('scroll-top-active');
            return false;
        });

        /* custom grid filter moving border */
        $('.pxl-grid-filter').each(function () {
            var marker = $(this).find('.filter-marker'),
                item = $(this).find('.filter-item'),
                current = $(this).find('.filter-item.active');

            var offsettop = current.length ? current.position().top : 0;

            marker.css({
                top: offsettop + (current.length ? current.outerHeight() : 0),
                left: current.length ? current.position().left : 0,
                width: current.length ? current.outerWidth() : 0,
                display: "block"
            });

            item.mouseover(function () {
                var self = $(this),
                    offsetactop = self.position().top,
                    offsetleft = self.position().left,
                    width = self.outerWidth() || current.outerWidth(),
                    top = offsetactop == 0 ? 0 : offsetactop || offsettop,
                    left = offsetleft == 0 ? 0 : offsetleft || current.position().left;

                marker.stop().animate({
                    top: top + (current.length ? current.outerHeight() : 0),
                    left: left,
                    width: width,
                }, 300);
            });

            item.on('click', function () {
                current = $(this);
            });

            item.mouseleave(function () {
                var offsetlvtop = current.length ? current.position().top : 0;
                marker.stop().animate({
                    top: offsetlvtop + (current.length ? current.outerHeight() : 0),
                    left: current.length ? current.position().left : 0,
                    width: current.length ? current.outerWidth() : 0
                }, 300);
            });
        });


        /* Animate Time Delay */

        /* Related Post - Slick Slider */
        const postSlider = $(".pxl-related-post .pxl-related-post-inner");
        postSlider
            .slick({
                dots: false,
                infinite: true,
                arrows: false,
                slidesToShow: 3,
                slidesToScroll: 1,
                autoplay: false,
                autoplaySpeed: 500,
                cssEase: 'linear',
                responsive: [
                    {
                        breakpoint: 992,
                        settings: {
                            slidesToShow: 2,
                        },
                    },
                    {
                        breakpoint: 768,
                        settings: {
                            slidesToShow: 1,
                        }
                    }
                ]
            });

        $(".category-carousel").slick({
            dots: false,
            infinite: true,
            arrows: false,
            slidesToShow: 5,
            slidesToScroll: 1,
            autoplay: false,
            autoplaySpeed: 500,
            cssEase: 'linear',
            responsive: [
                {
                    breakpoint: 1200,
                    settings: {
                        slidesToShow: 4,
                    },
                },
                {
                    breakpoint: 991,
                    settings: {
                        slidesToShow: 3,
                    },
                },
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 2,
                    }
                },
                {
                    breakpoint: 578,
                    settings: {
                        slidesToShow: 1,
                    }
                }
            ]
        });

        $('.pxl-grid-masonry').each(function () {
            var eltime = 80;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('> .pxl-grid-item > .wow').each(function (index, obj) {
                $(this).css('animation-delay', eltime + 'ms');
                if (_elt === index) {
                    eltime = 80;
                    _elt = _elt + elt_inner;
                } else {
                    eltime = eltime + 80;
                }
            });
        });

        $('.btn-text-nina').each(function () {
            var eltime = 0.045;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('> .pxl--btn-text > span').each(function (index, obj) {
                $(this).css('transition-delay', eltime + 's');
                eltime = eltime + 0.045;
            });
        });

        $('.btn-text-nanuk').each(function () {
            var eltime = 0.05;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('> .pxl--btn-text > span').each(function (index, obj) {
                $(this).css('animation-delay', eltime + 's');
                eltime = eltime + 0.05;
            });
        });

        $('.btn-text-smoke').each(function () {
            var eltime = 0.05;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('> .pxl--btn-text > span > span > span').each(function (index, obj) {
                $(this).css('--d', eltime + 's');
                eltime = eltime + 0.05;
            });
        });

        $('.btn-text-reverse .pxl-text--front, .btn-text-reverse .pxl-text--back').each(function () {
            var eltime = 0.05;
            var elt_inner = $(this).children().length;
            var _elt = elt_inner - 1;
            $(this).find('.pxl-text--inner > span').each(function (index, obj) {
                $(this).css('transition-delay', eltime + 's');
                eltime = eltime + 0.05;
            });
        });

        /* End Animate Time Delay */

        $('.label-text-fillter').on('click', function () {
            $(this).parents('.pxl-grid-filter').addClass('active');
        });
        $('.filter-item').on('click', function () {
            $('.pxl-grid-filter').removeClass('active');
        });


        /* Lightbox Popup */
        $('.pxl-action-popup').magnificPopup({
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
        });

        $('.pxl-gallery-lightbox').each(function () {
            $(this).magnificPopup({
                delegate: 'a.lightbox',
                type: 'image',
                gallery: {
                    enabled: true
                },
                mainClass: 'mfp-fade',
            });
        });

        /* Page Title Parallax */
        if (pxl_window_width > 1024) {
            if ($('#pxl-page-title-default').hasClass('pxl--parallax')) {
                $(this).stellar();
            }
        }

        /* Cart Sidebar Popup */
        $(".pxl-cart-sidebar-button").on('click', function () {
            $('body').addClass('body-overflow');
            $('#pxl-cart-sidebar').addClass('active');
        });
        $("#pxl-cart-sidebar .pxl-popup--overlay, #pxl-cart-sidebar .pxl-item--close").on('click', function () {
            $('body').removeClass('body-overflow');
            $('#pxl-cart-sidebar').removeClass('active');
        });
        $(".pxl-accordion1.style2 .pxl-accordion--content").find("br").remove();
        /* Hover Active Item */
        $('.pxl--widget-hover').each(function () {
            $(this).hover(function () {
                $(this).parents('.elementor-row').find('.pxl--widget-hover').removeClass('pxl--item-active');
                $(this).parents('.elementor-container').find('.pxl--widget-hover').removeClass('pxl--item-active');
                $(this).addClass('pxl--item-active');
            });
        });
        /* Hover Active button */

        var wobbleElements = document.querySelectorAll('.pxl-wobble');
        wobbleElements.forEach(function (el) {
            el.addEventListener('mouseover', function () {
                if (!el.classList.contains('animating') && !el.classList.contains('mouseover')) {
                    el.classList.add('animating', 'mouseover');
                    var letters = el.innerText.split('');
                    setTimeout(function () { el.classList.remove('animating'); }, (letters.length + 1) * 50);
                    var animationName = el.dataset.animation;
                    if (!animationName) { animationName = "pxl-jump"; }
                    el.innerText = '';
                    letters.forEach(function (letter) {
                        if (letter == " ") {
                            letter = "&nbsp;";
                        }
                        el.innerHTML += '<span class="letter">' + letter + '</span>';
                    });
                    var letterElements = el.querySelectorAll('.letter');
                    letterElements.forEach(function (letter, i) {
                        setTimeout(function () {
                            letter.classList.add(animationName);
                        }, 50 * i);
                    });
                }
            });
            el.addEventListener('mouseout', function () {
                el.classList.remove('mouseover');
            });
        });

        /* Start Icon Bounce */
        var boxEls = $('.el-bounce, .pxl-image-effect1, .el-effect-zigzag');
        $.each(boxEls, function (boxIndex, boxEl) {
            loopToggleClass(boxEl, 'active');
        });

        function loopToggleClass(el, toggleClass) {
            el = $(el);
            if (!el.length) return;

            // Ensure we don't init multiple observers
            if (el.data('loop-init')) return;
            el.data('loop-init', true);

            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            startLoop(el, toggleClass);
                        } else {
                            stopLoop(el, toggleClass);
                        }
                    });
                });
                observer.observe(el[0]);
            } else {
                startLoop(el, toggleClass);
            }
        }

        function startLoop(el, toggleClass) {
            if (el.data('loop-interval')) return;

            // Initial toggle
            el.toggleClass(toggleClass);

            const interval = setInterval(function () {
                el.toggleClass(toggleClass);
            }, 1000);

            el.data('loop-interval', interval);
        }

        function stopLoop(el, toggleClass) {
            const interval = el.data('loop-interval');
            if (interval) {
                clearInterval(interval);
                el.removeData('loop-interval');
                el.removeClass(toggleClass);
            }
        }
        /* End Icon Bounce */

        /* Image Effect */
        if ($('.pxl-image-tilt').length) {
            $('.pxl-image-tilt').parents('.elementor-element').addClass('pxl-image-tilt-active');
            $('.pxl-image-tilt').each(function () {
                var pxl_maxtilt = $(this).data('maxtilt'),
                    pxl_speedtilt = $(this).data('speedtilt'),
                    pxl_perspectivetilt = $(this).data('perspectivetilt');
                VanillaTilt.init(this, {
                    max: pxl_maxtilt,
                    speed: pxl_speedtilt,
                    perspective: pxl_perspectivetilt
                });
            });
        }

        /* Select Theme Style */
        $('.widget.widget_search input').attr('required', true);
        $('.wpcf7-select').each(function () {
            var $this = $(this), numberOfOptions = $(this).children('option').length;

            $this.addClass('pxl-select-hidden');
            $this.wrap('<div class="pxl-select"></div>');
            $this.after('<div class="pxl-select-higthlight"></div>');

            var $styledSelect = $this.next('div.pxl-select-higthlight');
            $styledSelect.text($this.children('option').eq(0).text());

            var $list = $('<ul />', {
                'class': 'pxl-select-options'
            }).insertAfter($styledSelect);

            for (var i = 0; i < numberOfOptions; i++) {
                $('<li />', {
                    text: $this.children('option').eq(i).text(),
                    rel: $this.children('option').eq(i).val()
                }).appendTo($list);
            }

            var $listItems = $list.children('li');

            $styledSelect.click(function (e) {
                e.stopPropagation();
                $('div.pxl-select-higthlight.active').not(this).each(function () {
                    $(this).removeClass('active').next('ul.pxl-select-options').addClass('pxl-select-lists-hide');
                });
                $(this).toggleClass('active');
            });

            $listItems.click(function (e) {
                e.stopPropagation();
                $styledSelect.text($(this).text()).removeClass('active');
                $this.val($(this).attr('rel'));
            });

            $(document).click(function () {
                $styledSelect.removeClass('active');
            });

        });

        /* Nice Select */
        $('.woocommerce-ordering .orderby, #filter-label, .pxl-filter-dropdown, #pxl-sidebar-area select, .variations_form.cart .variations select, .pxl-open-table select, .pxl-nice-select').each(function () {
            $(this).niceSelect();
        });

        $('.pxl-post-list .nice-select').each(function () {
            $(this).niceSelect();
        });

        /* Typewriter */
        if ($('.pxl-title--typewriter').length) {
            function typewriterOut(elements, callback) {
                if (elements.length) {
                    elements.eq(0).addClass('is-active');
                    elements.eq(0).delay(3000);
                    elements.eq(0).removeClass('is-active');
                    typewriterOut(elements.slice(1), callback);
                }
                else {
                    callback();
                }
            }

            function typewriterIn(elements, callback) {
                if (elements.length) {
                    elements.eq(0).addClass('is-active');
                    elements.eq(0).delay(3000).slideDown(3000, function () {
                        elements.eq(0).removeClass('is-active');
                        typewriterIn(elements.slice(1), callback);
                    });
                }
                else {
                    callback();
                }
            }

            function typewriterInfinite() {
                typewriterOut($('.pxl-title--typewriter .pxl-item--text'), function () {
                    typewriterIn($('.pxl-title--typewriter .pxl-item--text'), function () {
                        typewriterInfinite();
                    });
                });
            }
            $(function () {
                typewriterInfinite();
            });
        }
        /* End Typewriter */

        /* Get checked input - Mailchimpp */
        $('.mc4wp-form input:checkbox').change(function () {
            if ($(this).is(":checked")) {
                $('.mc4wp-form').addClass("pxl-input-checked");
            } else {
                $('.mc4wp-form').removeClass("pxl-input-checked");
            }
        });

        /* Scroll to content */
        $('.pxl-link-to-section .btn').on('click', function (e) {
            var id_scroll = $(this).attr('href');
            var offsetScroll = $('.pxl-header-elementor-sticky').outerHeight();
            e.preventDefault();
            $("html, body").animate({ scrollTop: $(id_scroll).offset().top - offsetScroll }, 600);
        });

        // Hover Item Active
        $(".pxl-post-modern1 .pxl-post--content .pxl-post--item")
            .on("mouseenter", function () {
                $(this).addClass("active");
                $(".pxl-post-modern1 .pxl-post--images .pxl-post--featured").removeClass('active');
                var selected_item = $(this).find(".pxl-content--inner").attr("data-image");
                $(selected_item).addClass('active').removeClass('non-active');
            })
            .on("mouseleave", function () {
                $(".pxl-post-modern1 .pxl-post--content .pxl-post--item").removeClass('active');
                $(".pxl-post-modern1 .pxl-post--images .pxl-post--featured").removeClass('non-active');
                var selected_item = $(this).find(".pxl-content--inner").attr("data-image");
                $(selected_item).removeClass('active').addClass('non-active');
            }
            );

        // Hover Overlay Effect
        $('.pxl-overlay-shake').mousemove(function (event) {
            var offset = $(this).offset();
            var W = $(this).outerWidth();
            var X = (event.pageX - offset.left);
            var Y = (event.pageY - offset.top);
            $(this).find('.pxl-overlay--color').css({
                'top': + Y + 'px',
                'left': + X + 'px'
            });
        });

        //Some Widget Default
        //$('.widget .cat-item a, .widget_archive li a').append('<span class="pxl-item--divider"></span>');

        /* Social Button Click */
        $('.pxl-social--button').on('click', function () {
            $(this).toggleClass('active');
        });
        $(document).on('click', function (e) {
            if (e.target.className == 'pxl-social--button active')
                $('.pxl-social--button').removeClass('active');
        });

        // Header Home 2
        $('#home-2-header').append('<span class="pxl-header-divider1"></span><span class="pxl-header-divider2"></span><span class="pxl-header-divider3"></span><span class="pxl-header-divider4"></span>');
        $('#home-2-header-sticky').append('<span class="pxl-header-divider2"></span><span class="pxl-header-divider4"></span>');

    });

    jQuery(document).ajaxComplete(function (event, xhr, settings) {
        auregon_shop_quantity();
        auregon_height_ct_grid();
    });

    jQuery(document).on('updated_wc_div', function () {
        auregon_shop_quantity();
    });

    /* Header Sticky */
    function auregon_header_sticky() {
        if ($pxlHeaderElementor && $pxlHeaderElementor.hasClass('is-sticky')) {
            if (pxl_scroll_top > 100) {
                $pxlHeaderSticky.filter('.pxl-sticky-stb').addClass('pxl-header-fixed');
                $pxlHeaderMobile.addClass('pxl-header-mobile-fixed');
            } else {
                $pxlHeaderSticky.filter('.pxl-sticky-stb').removeClass('pxl-header-fixed');
                $pxlHeaderMobile.removeClass('pxl-header-mobile-fixed');
            }

            if (pxl_scroll_status == 'up' && pxl_scroll_top > 100) {
                $pxlHeaderSticky.filter('.pxl-sticky-stt').addClass('pxl-header-fixed');
            } else {
                $pxlHeaderSticky.filter('.pxl-sticky-stt').removeClass('pxl-header-fixed');
            }
        }

        if ($body) $body.addClass('pxl-header-sticky');
    }

    /* Header Mobile */
    function auregon_header_mobile() {
        var h_header_mobile = $pxlHeaderElementor.outerHeight();
        if (pxl_window_width < 1199) {
            $pxlHeaderElementor.css('min-height', h_header_mobile + 'px');
        }
    }

    /* Scroll To Top */
    function auregon_scroll_to_top() {
        if (pxl_scroll_top < pxl_window_height) {
            $pxlScrollTop.addClass('pxl-off').removeClass('pxl-on');
        }
        if (pxl_scroll_top > pxl_window_height) {
            $pxlScrollTop.addClass('pxl-on').removeClass('pxl-off');
        }
    }

    /* Footer Fixed */
    function auregon_footer_fixed() {
        setTimeout(function () {
            if (!$pxlFooterElementor.length) return;

            var h_footer = $pxlFooterElementor.outerHeight() - 1;
            if ($('.pxl-footer-fixed').length) {
                $pxlMain.css('margin-bottom', h_footer + 'px');
            }
        }, 600);
    }

    /* Custom Check Scroll */
    function auregon_check_scroll() {
        var $gridItems = $('.pxl-check-scroll .pxl-swiper-slide');

        if (!$gridItems.length) return;

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        $(entry.target).addClass('visible');
                    } else {
                        $(entry.target).removeClass('visible');
                    }
                });
            }, { rootMargin: "0px" });

            $gridItems.each(function () {
                observer.observe(this);
            });
        } else {
            // Fallback optimized to batch reads
            var viewportBottom = pxl_scroll_top + $(window).height();
            var items = [];

            $gridItems.each(function () {
                items.push({
                    $el: $(this),
                    top: $(this).offset().top,
                    height: $(this).outerHeight()
                });
            });

            $.each(items, function (i, item) {
                var elementBottom = item.top + item.height;
                if (item.top < viewportBottom && elementBottom > pxl_scroll_top) {
                    item.$el.addClass('visible');
                } else {
                    item.$el.removeClass('visible');
                }
            });
        }
    }

    function dropdown_offices() {
        const filterDropdown = $("#filter-label");
        const items = document.querySelectorAll(".pxl-offices-list .pxl--item");

        if (!filterDropdown.length || items.length === 0) return;

        filterDropdown.on("change", function () {
            const selectedLabel = this.value.toLowerCase();

            items.forEach(item => {
                const itemLabel = item.dataset.label?.toLowerCase() || "";
                item.classList.toggle("hidden", selectedLabel !== "" && itemLabel !== selectedLabel);
            });
        });
    }


    /* Button Parallax */
    /* Button Parallax */
    function auregon_button_parallax() {
        const $buttons = $('.btn.btn-circle,.pxl-icon1.style-vertical a,.pxl-anchor-button.style-2');
        if ($buttons.length === 0) {
            return;
        }

        $buttons.each(function () {
            const $btn = $(this);
            const $text = $btn.find('svg, span');
            let rect = null;
            let centerX = 0;
            let centerY = 0;

            if ($text.length === 0) return;

            $btn.on('mouseenter', function () {
                rect = this.getBoundingClientRect();
                centerX = rect.left + rect.width / 2;
                centerY = rect.top + rect.height / 2;

                gsap.set($text, {
                    transformOrigin: "50% 50%"
                });
            });

            $btn.on('mousemove', function (e) {
                if (!rect) {
                    rect = this.getBoundingClientRect();
                    centerX = rect.left + rect.width / 2;
                    centerY = rect.top + rect.height / 2;
                }

                const deltaX = (e.clientX - centerX) * 0.5;
                const deltaY = (e.clientY - centerY) * 0.5;

                gsap.to([$btn, $text], {
                    duration: 0.1,
                    x: deltaX,
                    y: deltaY,
                    ease: "power3.out",
                    overwrite: 'auto'
                });
            });

            $btn.on('mouseleave', function () {
                rect = null;
                gsap.to([$btn, $text], {
                    duration: 0.1,
                    x: 0,
                    y: 0,
                    ease: "elastic.out(1, 0.3)",
                    overwrite: true
                });
            });
        });
    }

    // Page Load
    function auregon_pageLoad() {
        const $preloader = $('.preloader-wrap');
        if (!$preloader.length) return;

        const FADE_DURATION = 300;
        const MIN_LOAD_TIME = 500;
        const MAX_LOAD_TIME = 2000;
        const DEFAULT_LOAD_TIME = 1000;

        const hasImagesLoaded = typeof imagesLoaded !== 'undefined';
        const hasGSAP = typeof gsap !== 'undefined';

        if (!hasImagesLoaded || !hasGSAP) {
            if (!hasImagesLoaded) console.warn('imagesLoaded library is not loaded');
            if (!hasGSAP) console.warn('GSAP library is not loaded');
            $preloader.fadeOut(FADE_DURATION);
            return;
        }

        const $percentage = $('#precent');
        const $loadbar = $('.loadbar');
        const $percentageEl = $('.percentage');
        const $percentageIntro = $('.percentage-intro');
        const $titleOutline = $('.pxl-heading .pxl-item--title.style-outline-on-loading');
        const $preloaderIntro = $('.preloader-intro span');
        const $flipbox = $('.pxl-image-carousel4 .pxl-flipbox');
        const $heading = $('.pxl-image-carousel4 .pxl-heading');
        const $icon = $('.pxl-icon1.style-vertical.loading a');

        let estimated = DEFAULT_LOAD_TIME;
        try {
            const perfNavigation = performance.getEntriesByType('navigation')[0];
            if (perfNavigation && perfNavigation.loadEventEnd > 0) {
                estimated = perfNavigation.loadEventEnd;
            } else if (window.performance?.timing) {
                const perfData = window.performance.timing;
                if (perfData.loadEventEnd && perfData.loadEventEnd > perfData.navigationStart) {
                    estimated = perfData.loadEventEnd - perfData.navigationStart;
                }
            }
        } catch (e) {
        }
        const loadTime = Math.min(Math.max(estimated, MIN_LOAD_TIME), MAX_LOAD_TIME);

        let animationFrameId = null;
        function animateValue($el, start, end, duration) {
            if (!$el.length) return;

            const range = end - start;
            if (range === 0) {
                $el.text(end);
                return;
            }

            const startTime = Date.now();

            function update() {
                const elapsed = Date.now() - startTime;
                if (elapsed >= duration) {
                    $el.text(end);
                    animationFrameId = null;
                    return;
                }

                const progress = elapsed / duration;
                const current = Math.round(start + range * progress);
                $el.text(current);
                animationFrameId = requestAnimationFrame(update);
            }

            update();
        }

        $loadbar.stop(true, true).css({ width: '100%' }).animate({ width: '0%' }, loadTime);

        if ($percentage.length) {
            animateValue($percentage, 0, 100, loadTime);
        }

        let imagesCheckComplete = false;
        let minTimeElapsed = false;

        function hidePreloader() {
            if (!imagesCheckComplete || !minTimeElapsed) return;

            const ease = 'power2.inOut';

            gsap.to($percentageEl, {
                duration: 0.3,
                opacity: 0,
                y: -30,
                ease: ease
            });

            gsap.to($percentageIntro, {
                duration: 0.3,
                opacity: 0,
                y: 0,
                ease: ease
            });

            gsap.to($preloaderIntro, {
                duration: 0.7,
                opacity: 0,
                yPercent: -101,
                ease: ease
            });

            gsap.to($preloader, {
                duration: 0.7,
                yPercent: -101,
                delay: 0.7,
                ease: ease,
                onComplete: function () {
                    gsap.set($preloader, {
                        visibility: 'hidden',
                        opacity: 0
                    });
                }
            });

            gsap.to($flipbox, {
                duration: 1.5,
                delay: 0.1,
                rotationY: 360,
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
                ease: ease
            });

            gsap.fromTo($heading, {
                opacity: 0,
                scale: 0.85
            }, {
                duration: 1.5,
                delay: 0.25,
                opacity: 1,
                scale: 1,
                ease: ease
            });

            $icon.each(function (index, el) {
                gsap.fromTo(el, {
                    opacity: 0,
                    scale: 0.85
                }, {
                    duration: 0.75,
                    delay: 1 + index * 0.3,
                    opacity: 1,
                    scale: 1,
                    ease: 'power3.inOut'
                });
            });

            setTimeout(function () {
                if (pxl_window_width > 767) {
                    $titleOutline.addClass('pxl-animated');
                }
            }, 1000);
        }

        setTimeout(function () {
            minTimeElapsed = true;
            hidePreloader();
        }, loadTime);

        try {
            imagesLoaded('body', function (instance) {
                imagesCheckComplete = true;
                hidePreloader();
            });
        } catch (e) {
            console.error('Error checking images:', e);
            imagesCheckComplete = true;
            hidePreloader();
        }
    }
    // End of Page Load

    /* WooComerce Quantity */
    function auregon_shop_quantity() {
        "use strict";
        $('#pxl-wapper .quantity').append('<span class="quantity-icon quantity-down pxl-icon--minus"></span><span class="quantity-icon quantity-up pxl-icon--plus"></span>');
        $('.quantity-up').on('click', function () {
            $(this).parents('.quantity').find('input[type="number"]').get(0).stepUp();
            $(this).parents('.woocommerce-cart-form').find('.actions .button').removeAttr('disabled');
        });
        $('.quantity-down').on('click', function () {
            $(this).parents('.quantity').find('input[type="number"]').get(0).stepDown();
            $(this).parents('.woocommerce-cart-form').find('.actions .button').removeAttr('disabled');
        });
        $('.quantity-icon').on('click', function () {
            var quantity_number = $(this).parents('.quantity').find('input[type="number"]').val();
            var add_to_cart_button = $(this).parents(".product, .woocommerce-product-inner").find(".add_to_cart_button");
            add_to_cart_button.attr('data-quantity', quantity_number);
            add_to_cart_button.attr("href", "?add-to-cart=" + add_to_cart_button.attr("data-product_id") + "&quantity=" + quantity_number);
        });
        $('.woocommerce-cart-form .actions .button').removeAttr('disabled');
    }

    /* Menu Responsive Dropdown */
    function auregon_submenu_responsive() {
        var $auregon_menu = $('.pxl-header-elementor-main, .pxl-header-elementor-sticky');
        $auregon_menu.find('.pxl-menu-primary li').each(function () {
            var $auregon_submenu = $(this).find('> ul.sub-menu');
            if ($auregon_submenu.length == 1) {
                if (($auregon_submenu.offset().left + $auregon_submenu.width() + 0) > $(window).width()) {
                    $auregon_submenu.addClass('pxl-sub-reverse');
                }
            }
        });
    }

    function auregon_panel_anchor_toggle() {
        'use strict';
        $(document).on('click', '.pxl-anchor-button', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var target = $(this).attr('data-target');
            $(target).toggleClass('active');
            $('body').addClass('body-overflow');
            $('.pxl-popup--conent .wow').addClass('animated').removeClass('aniOut');
            $('.pxl-popup--conent .fadeInPopup').removeClass('aniOut');
            if ($(target).find('.pxl-search-form').length > 0) {
                setTimeout(function () {
                    $(target).find('.pxl-search-form .pxl-search-field').focus();
                }, 1000);
            }
        });

        $(document).ready(function () {
            $('.pxl-post-taxonomy .pxl-count').each(function () {
                var content = $(this).html();
                if (content) {
                    var newContent = content.replace('(', '');
                    var newContent2 = newContent.replace(')', '');
                    $(this).html(newContent2);
                }
            });
        });


        $('.pxl-anchor-button').each(function () {
            var t_target = $(this).attr('data-target');
            var t_delay = $(this).attr('data-delay-hover');
            $(t_target).find('.pxl-popup--conent').css('transition-delay', t_delay + 'ms');
            $(t_target).find('.pxl-popup--overlay').css('transition-delay', t_delay + 'ms');
        });

        $(".pxl-hidden-panel-popup .pxl-popup--overlay, .pxl-hidden-panel-popup .pxl-close-popup").on('click', function () {
            $('body').removeClass('body-overflow');
            $('.pxl-hidden-panel-popup').removeClass('active');
            $('.pxl-popup--conent .wow').addClass('aniOut').removeClass('animated');
            $('.pxl-popup--conent .fadeInPopup').addClass('aniOut');
        });

        $(".pxl-icon-box6 .btn-show-more").on('click', function () {
            $(this).parents('.pxl-icon-box6').addClass('active');
            $(this).parents('.pxl-icon-box6').find('.content-2').addClass('active');
        });


        $(".pxl-popup--close").on('click', function () {
            $('body').removeClass('body-overflow');
            $(this).parent().removeClass('active');
        });
        $(".pxl-close-popup").on('click', function () {
            $('body').removeClass('body-overflow');
            $('.pxl-page-popup').removeClass('active');
        });
    }

    /* Page Title Scroll Opacity */
    var ptitle_limit = 0;
    var $ptitle_divs = $('#pxl-page-title-elementor.pxl-scroll-opacity .elementor-widget');
    var $ptitle_wrap = $('#pxl-page-title-elementor.pxl-scroll-opacity');

    function update_ptitle_limit() {
        if ($ptitle_wrap.length) {
            ptitle_limit = $ptitle_wrap.outerHeight();
        }
    }
    // Update on resize
    $(window).on('resize', update_ptitle_limit);
    // Init
    update_ptitle_limit();

    function auregon_ptitle_scroll_opacity() {
        if (ptitle_limit > 0 && pxl_scroll_top <= ptitle_limit) {
            $ptitle_divs.css({ 'opacity': (1 - pxl_scroll_top / ptitle_limit) });
        }
    }

    /* Slider Column Offset */
    function auregon_slider_column_offset() {
        var content_w = ($('#pxl-main').width() - 1200) / 2;
        if (pxl_window_width > 1200) {
            $('.pxl-slider2 .pxl-item--left').css('padding-left', content_w + 'px');
        }
    }

    function auregon_circle_svg(element, linearGradientId, linearGradientId1) {
        var activeWidth = window.innerWidth || document.documentElement.clientWidth;
        if (activeWidth <= 1200) {
            return;
        }

        var svgEl = Snap(element);
        if (!svgEl) {
            return;
        }

        var size = 3.5;
        var filter = svgEl.filter(Snap.filter.shadow(0, 4, 30, 'rgba(0, 255, 255, 0.6)')).addClass('filter1');
        var filter1 = svgEl.filter(Snap.filter.shadow(0, 4, 30, 'rgba(0, 255, 255, 0.1)')).addClass('filter2');
        var circle1 = svgEl.circle(0, 0, size * 1);
        var linearGradient = svgEl.select('.pxl-circle-svg svg .' + linearGradientId);

        circle1.attr({ id: 'circle1', class: 'dot', fill: 'url(#' + linearGradientId + ')' });
        circle1.attr({ filter: filter });

        var circle2 = svgEl.circle(0, 0, size * 1);
        circle2.attr({ id: 'circle2', class: 'dot', fill: 'url(#' + linearGradientId1 + ')' });
        circle2.attr({ filter: filter1 });

        var dotEl1 = svgEl.select('#circle1');
        var dotEl2 = svgEl.select('#circle2');

        var motionPath1 = svgEl.select('path').getTotalLength();
        var motionPath2 = svgEl.select('path').getTotalLength();

        var motionPath1Partial = motionPath1 * 0.7;
        var motionPath2Partial = motionPath2 * 0.7;

        dotEl1.transform('t0,0');
        dotEl2.transform('t0,0');

        var carouselInnerEl = $(".pxl-carousel-inner,.pxl-swiper-arrow");
        var animation1, animation2;
        var isHovered = false;
        var isVisible = false;
        var isRunning = false;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                isVisible = entry.isIntersecting;
                if (isVisible && !isRunning) {
                    isRunning = true;
                    animateDot1(true);
                }
            });
        });
        observer.observe(element);

        function animateDot1(forward) {
            if (!isVisible) { isRunning = false; return; }

            var fromVal, toVal;
            if (forward) {
                fromVal = 0;
                toVal = motionPath1;
            } else {
                fromVal = motionPath2;
                toVal = 0;
            }

            // Only run if visible
            if (!isVisible) { isRunning = false; return; }

            animation1 = Snap.animate(fromVal, toVal, function (val) {
                var point = svgEl.select("path").getPointAtLength(val);
                dotEl1.attr({ cx: point.x, cy: point.y });
            }, 15000, function () {
                if (isVisible && !isHovered) {
                    dotEl1.transform('t0,0');
                    animateDot1(true);
                } else {
                    isRunning = false;
                }
            });
        }

        function animateDot2(forward) {
            var fromVal, toVal;
            if (forward) {
                fromVal = motionPath1;
                toVal = 0;
            } else {
                fromVal = 0;
                toVal = motionPath2;
            }

            animation2 = Snap.animate(fromVal, toVal, function (val) {
                var point = svgEl.select("path").getPointAtLength(motionPath2 - val);
                dotEl2.attr({ cx: point.x, cy: point.y });
            }, 15000, function () {
                if (!isHovered) {
                    dotEl2.transform('t0,0');
                    animateDot2(false);
                }
            });
        }

        carouselInnerEl.on("mouseenter", function () {
            isHovered = true;
            if (animation1) {
                animation1.pause();
            }
            if (animation2) {
                animation2.pause();
            }
        });

        carouselInnerEl.on("mouseleave", function () {
            isHovered = false;
            if (animation1) {
                animation1.stop();
            }
            if (animation2) {
                animation2.stop();
            }
            dotEl1.transform('t0,0');
            dotEl2.transform('t0,0');
            animateDot1(true);
            animateDot2(false);
        });

        animateDot1(true);
        animateDot2(false);
    }

    /* Preloader Default */
    $.fn.extend({
        jQueryImagesLoaded: function () {
            var $imgs = this.find('img[src!=""]')

            if (!$imgs.length) {
                return $.Deferred()
                    .resolve()
                    .promise()
            }

            var dfds = []

            $imgs.each(function () {
                var dfd = $.Deferred()
                dfds.push(dfd)
                var img = new Image()
                img.onload = function () {
                    dfd.resolve()
                }
                img.onerror = function () {
                    dfd.resolve()
                }
                img.src = this.src
            })

            return $.when.apply($, dfds)
        }
    })

    /* Button Parallax */
    /* Button Parallax */
    function auregon_button_parallax1() {
        $('.btn-text-parallax, .pxl-blog-style2, .pxl-hover-parallax').each(function () {
            let rect = null;
            const $btn = $(this);

            $btn.on('mouseenter', function () {
                rect = this.getBoundingClientRect();
                $(this).addClass('hovered');
            });

            $btn.on('mouseleave', function () {
                $(this).removeClass('hovered');
            });

            $btn.on('mousemove', function (e) {
                if (!rect) rect = this.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height;
                const deltaX = Math.floor((centerX - e.clientX)) * 0.222;
                const deltaY = Math.floor((centerY - e.clientY)) * 0.333;

                // For pxl--btn-text
                if ($btn.hasClass('btn-text-parallax')) {
                    $btn.find('.pxl--btn-text').css({
                        transform: 'translate3d(' + deltaX * 0.32 + 'px, ' + deltaY * 0.32 + 'px, 0px)'
                    });
                }

                // For blog/hover-parallax
                if ($btn.hasClass('pxl-blog-style2') || $btn.hasClass('pxl-hover-parallax')) {
                    $btn.find('.pxl-item-parallax, .pxl-post--button').css({
                        transform: 'translate3d(' + deltaX * 0.32 + 'px, ' + deltaY * 0.32 + 'px, 0px)'
                    });
                }
            });
        });
    }

    function auregon_bgr_parallax() {
        setTimeout(function () {
            $('.pxl-section-bg-parallax').each(function () {
                if (!$(this).hasClass('pinned-zoom-clipped') && !$(this).hasClass('pinned-circle-zoom-clipped') && !$(this).hasClass('mask-parallax')) {
                    jarallax(this, {
                        speed: 0.2,
                    });
                }
            });
        }, 300);
    }

    function auregon_el_parallax() {
        $('.el-parallax-wrap').each(function () {
            let bounds = null;
            const $this = $(this);

            $this.on('mouseenter', function () {
                bounds = this.getBoundingClientRect();
                $this.addClass('hovered');
                $this.find('.el-parallax-item').css({
                    transition: 'none'
                });
            });

            $this.on('mouseleave', function () {
                $this.removeClass('hovered');
                $this.find('.el-parallax-item').css({
                    transition: 'transform 0.5s ease',
                    transform: 'translate3d(0px, 0px, 0px)'
                });
            });

            $this.on('mousemove', function (e) {
                if (!bounds) bounds = this.getBoundingClientRect();
                const centerX = bounds.left + bounds.width / 2;
                const centerY = bounds.top + bounds.height / 2;
                const deltaX = (centerX - e.clientX) * 0.07104;
                const deltaY = (centerY - e.clientY) * 0.10656;

                requestAnimationFrame(() => {
                    $this.find('.el-parallax-item').css({
                        transform: `translate3d(${deltaX}px, ${deltaY}px, 0px)`
                    });
                });
            });
        });
    }

    /* Team Grid URL State (filter + search) */
    function initTeamGridUrlState() {
        var $grids = $('.pxl-team-grid1');
        if (!$grids.length) return;

        // Helper: safely create URL object
        function getCurrentUrl() {
            try {
                return new URL(window.location.href);
            } catch (e) {
                return null;
            }
        }

        // Apply state from URL on first load
        var currentUrl = getCurrentUrl();
        var urlDep = currentUrl ? currentUrl.searchParams.get('team_dep') : null;
        var urlSearch = currentUrl ? currentUrl.searchParams.get('team_search') : null;

        $grids.each(function () {
            var $grid = $(this);
            var $select = $grid.find('.pxl-filter-dropdown');
            var $search = $grid.find('.grid-search-input');

            // 1. Apply department from URL
            if ($select.length && urlDep) {
                var selectVal = urlDep === 'all' ? '*' : '.' + urlDep;
                if ($select.val() !== selectVal) {
                    $select.val(selectVal).trigger('change');
                    if (typeof $select.niceSelect === 'function') {
                        $select.niceSelect('update');
                    }
                }
            }

            // 2. Apply search text from URL
            if ($search.length && urlSearch) {
                var applySearchFromUrl = function () {
                    $search.val(urlSearch);

                    // Trigger native input event (bubble) so delegated handlers in grid.js run
                    var inputEl = $search.get(0);
                    if (inputEl && typeof Event === 'function') {
                        try {
                            var evt = new Event('input', { bubbles: true });
                            inputEl.dispatchEvent(evt);
                        } catch (e) {
                            // Fallback for very old browsers
                            var legacyEvt = document.createEvent('Event');
                            legacyEvt.initEvent('input', true, true);
                            inputEl.dispatchEvent(legacyEvt);
                        }
                    }

                    // Also trigger jQuery events as backup
                    $search.trigger('input').trigger('keyup');
                };

                // Nếu có cả filter theo department (team_dep) thì delay một chút
                // để AJAX/filter hoàn thành rồi mới apply search, tránh bị overwrite.
                if (urlDep && $select.length) {
                    setTimeout(applySearchFromUrl, 800);
                } else {
                    applySearchFromUrl();
                }
            }

            // 3. When user changes dropdown, sync to URL
            if ($select.length) {
                // Avoid duplicate bindings if function runs multiple times
                $select.off('.pxlTeamUrlState');
                $select.on('change.pxlTeamUrlState', function () {
                    var val = $(this).val() || '';
                    var slug = (val === '' || val === '*') ? 'all' : String(val).replace(/^\./, '');

                    var u = getCurrentUrl();
                    if (!u) return;

                    if (slug === 'all') {
                        u.searchParams.delete('team_dep');
                    } else {
                        u.searchParams.set('team_dep', slug);
                    }
                    window.history.replaceState({}, '', u.toString());
                });
            }

            // 4. When user types search, sync to URL (debounced)
            if ($search.length) {
                var debounceTimer = null;
                $search.off('.pxlTeamUrlState');
                $search.on('input.pxlTeamUrlState', function () {
                    var value = $(this).val().trim();

                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }

                    debounceTimer = setTimeout(function () {
                        var u = getCurrentUrl();
                        if (!u) return;

                        if (value === '') {
                            u.searchParams.delete('team_search');
                        } else {
                            u.searchParams.set('team_search', value);
                        }
                        window.history.replaceState({}, '', u.toString());
                    }, 300);
                });
            }
        });
    }

    /* Menu Divider Move */
    function auregon_menu_divider_move() {
        $('.pxl-nav-menu1.fr-style-divider').each(function () {
            var current = $(this).find('.pxl-menu-primary > .current-menu-item, .pxl-menu-primary > .current-menu-parent, .pxl-menu-primary > .current-menu-ancestor');
            if (current.length > 0) {
                var marker = $(this).find('.pxl-divider-move');
                marker.css({
                    left: current.position().left,
                    width: current.outerWidth(),
                    display: "block"
                });
                marker.addClass('active');
                current.addClass('pxl-shape-active');
                if (Modernizr.csstransitions) {
                    $(this).find('.pxl-menu-primary > li').mouseover(function () {
                        var self = $(this),
                            offsetLeft = self.position().left,
                            width = self.outerWidth() || current.outerWidth(),
                            left = offsetLeft == 0 ? 0 : offsetLeft || current.position().left;
                        marker.css({
                            left: left,
                            width: width,
                        });
                        marker.addClass('active');
                        current.removeClass('pxl-shape-active');
                    });
                    $(this).find('.pxl-menu-primary').mouseleave(function () {
                        marker.css({
                            left: current.position().left,
                            width: current.outerWidth()
                        });
                        current.addClass('pxl-shape-active');
                    });
                }
            } else {
                var marker = $(this).find('.pxl-divider-move');
                var current = $(this).find('.pxl-menu-primary > li:nth-child(1)');
                marker.css({
                    left: current.position().left,
                    width: current.outerWidth(),
                    display: "block"
                });
                if (Modernizr.csstransitions) {
                    $(this).find('.pxl-menu-primary > li').mouseover(function () {
                        var self = $(this),
                            offsetLeft = self.position().left,
                            width = self.outerWidth() || current.outerWidth(),
                            left = offsetLeft == 0 ? 0 : offsetLeft || current.position().left;
                        marker.css({
                            left: left,
                            width: width,
                        });
                        marker.addClass('active');
                    });
                    $(this).find('.pxl-menu-primary').mouseleave(function () {
                        marker.css({
                            left: current.position().left,
                            width: current.outerWidth()
                        });
                        marker.removeClass('active');
                    });
                }
            }
        });
    }

    /* Back To Top Progress Bar */
    function auregon_backtotop_progess_bar() {
        if ($('.pxl-scroll-top').length > 0) {
            var progressPath = document.querySelector('.pxl-scroll-top path');
            var pathLength = progressPath.getTotalLength();
            progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
            progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
            progressPath.style.strokeDashoffset = pathLength;
            progressPath.getBoundingClientRect();
            progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';
            var updateProgress = function () {
                var scroll = $(window).scrollTop();
                var height = $(document).height() - $(window).height();
                var progress = pathLength - (scroll * pathLength / height);
                progressPath.style.strokeDashoffset = progress;
            }
            updateProgress();
            $(window).scroll(updateProgress);
            var offset = 50;
            var duration = 550;
            $(window).on('scroll', function () {
                if ($(this).scrollTop() > offset) {
                    $('.pxl-scroll-top').addClass('active-progress');
                } else {
                    $('.pxl-scroll-top').removeClass('active-progress');
                }
            });
        }
    }

    /* Custom Type File Upload*/
    function auregon_type_file_upload() {

        var multipleSupport = typeof $('<input/>')[0].multiple !== 'undefined',
            isIE = /msie/i.test(navigator.userAgent);

        $.fn.pxl_custom_type_file = function () {

            return this.each(function () {

                var $file = $(this).addClass('pxl-file-upload-hidden'),
                    $wrap = $('<div class="pxl-file-upload-wrapper">'),
                    $button = $('<button type="button" class="pxl-file-upload-button">Choose File</button>'),
                    $input = $('<input type="text" class="pxl-file-upload-input" placeholder="No File Choose" />'),
                    $label = $('<label class="pxl-file-upload-button" for="' + $file[0].id + '">Choose File</label>');
                $file.css({
                    position: 'absolute',
                    opacity: '0',
                    visibility: 'hidden'
                });

                $wrap.insertAfter($file)
                    .append($file, $input, (isIE ? $label : $button));

                $file.attr('tabIndex', -1);
                $button.attr('tabIndex', -1);

                $button.click(function () {
                    $file.focus().click();
                });

                $file.change(function () {

                    var files = [], fileArr, filename;

                    if (multipleSupport) {
                        fileArr = $file[0].files;
                        for (var i = 0, len = fileArr.length; i < len; i++) {
                            files.push(fileArr[i].name);
                        }
                        filename = files.join(', ');
                    } else {
                        filename = $file.val().split('\\').pop();
                    }

                    $input.val(filename)
                        .attr('title', filename)
                        .focus();
                });

                $input.on({
                    blur: function () { $file.trigger('blur'); },
                    keydown: function (e) {
                        if (e.which === 13) {
                            if (!isIE) {
                                $file.trigger('click');
                            }
                        } else if (e.which === 8 || e.which === 46) {
                            $file.replaceWith($file = $file.clone(true));
                            $file.trigger('change');
                            $input.val('');
                        } else if (e.which === 9) {
                            return;
                        } else {
                            return false;
                        }
                    }
                });

            });

        };
        $('.wpcf7-file[type=file]').pxl_custom_type_file();
    }



    //Shop View Grid/List
    function auregon_shop_view_layout() {

        $(document).on('click', '.pxl-view-layout .view-icon a', function (e) {
            e.preventDefault();
            if (!$(this).parent('li').hasClass('active')) {
                $('.pxl-view-layout .view-icon').removeClass('active');
                $(this).parent('li').addClass('active');
                $(this).parents('.pxl-content-area').find('ul.products').removeAttr('class').addClass($(this).attr('data-cls'));
            }
        });
    }

    function auregon_height_ct_grid($scope) {
        $('.pxl-portfolio-grid-layout1 .pxl-grid-item,.pxl-portfolio-carousel2 .pxl-swiper-slide').each(function () {
            var elementHeight = $(this).find(".pxl-post-content-hide").height();
            $(this).find(".pxl-post-content-hide").css("margin-bottom", "-" + elementHeight + "px");
        });
    }
    // Zoom Point
    function auregon_zoom_point() {
        $(".pxl-zoom-point").each(function () {

            let scaleOffset = $(this).data('offset');
            let scaleAmount = $(this).data('scale-mount');

            function scrollZoom() {
                const images = document.querySelectorAll("[data-scroll-zoom]");
                let scrollPosY = 0;
                scaleAmount = scaleAmount / 100;

                const observerConfig = {
                    rootMargin: "0% 0% 0% 0%",
                    threshold: 0
                };

                images.forEach(image => {
                    let isVisible = false;
                    const observer = new IntersectionObserver((elements, self) => {
                        elements.forEach(element => {
                            isVisible = element.isIntersecting;
                        });
                    }, observerConfig);

                    observer.observe(image);

                    image.style.transform = `scale(${1 + scaleAmount * percentageSeen(image)})`;

                    window.addEventListener("scroll", () => {
                        if (isVisible) {
                            scrollPosY = window.pageYOffset;
                            image.style.transform = `scale(${1 +
                                scaleAmount * percentageSeen(image)})`;
                        }
                    });
                });

                function percentageSeen(element) {
                    const parent = element.parentNode;
                    const viewportHeight = window.innerHeight;
                    const scrollY = window.scrollY;
                    const elPosY = parent.getBoundingClientRect().top + scrollY + scaleOffset;
                    const borderHeight = parseFloat(getComputedStyle(parent).getPropertyValue('border-bottom-width')) + parseFloat(getComputedStyle(element).getPropertyValue('border-top-width'));
                    const elHeight = parent.offsetHeight + borderHeight;

                    if (elPosY > scrollY + viewportHeight) {
                        return 0;
                    } else if (elPosY + elHeight < scrollY) {
                        return 100;
                    } else {
                        const distance = scrollY + viewportHeight - elPosY;
                        let percentage = distance / ((viewportHeight + elHeight) / 100);
                        percentage = Math.round(percentage);

                        return percentage;
                    }
                }
            }

            scrollZoom();

        });
    }
})(jQuery);