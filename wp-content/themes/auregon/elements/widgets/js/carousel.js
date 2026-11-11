(function ($) {

    function pxl_swiper_handler($scope) {
        $scope.find('.pxl-swiper-slider').each(function (index, element) {
            var $this = $(this);

            var settings = $this.find(".pxl-swiper-container").data().settings;
            var numberOfSlides = $this.find(".pxl-swiper-slide").length;
            var carousel_settings = {
                direction: settings['slide_direction'],
                effect: settings['slide_mode'],
                wrapperClass: 'pxl-swiper-wrapper',
                slideClass: 'pxl-swiper-slide',
                slidesPerView: settings['slides_to_show'],
                slidesPerGroup: settings['slides_to_scroll'],
                slidesPerColumn: settings['slide_percolumn'],
                allowTouchMove: settings['allow_touch_move'] !== undefined ? settings['allow_touch_move'] : true,
                spaceBetween: 0,
                observer: true,
                observeParents: true,
                // mousewheel: true,
                parallax: true,
                navigation: {
                    nextEl: $this.find('.pxl-swiper-arrow-next')[0],
                    prevEl: $this.find('.pxl-swiper-arrow-prev')[0],
                },
                pagination: {
                    type: settings['pagination_type'],
                    el: $this.find('.pxl-swiper-dots')[0],
                    clickable: true,
                    modifierClass: 'pxl-swiper-pagination-',
                    bulletClass: 'pxl-swiper-pagination-bullet',
                    renderCustom: function (swiper, element, current, total) {
                        return current + ' of ' + total;
                    }
                },
                speed: settings['speed'],
                watchSlidesProgress: true,
                watchSlidesVisibility: true,
                breakpoints: {
                    0: {
                        slidesPerView: settings['slides_to_show_xs'],
                        slidesPerGroup: settings['slides_to_scroll'],
                    },
                    576: {
                        slidesPerView: settings['slides_to_show_sm'],
                        slidesPerGroup: settings['slides_to_scroll'],
                    },
                    768: {
                        slidesPerView: settings['slides_to_show_md'],
                        slidesPerGroup: settings['slides_to_scroll'],
                    },
                    992: {
                        slidesPerView: settings['slides_to_show_lg'],
                        slidesPerGroup: settings['slides_to_scroll'],
                    },
                    1200: {
                        slidesPerView: settings['slides_to_show'],
                        slidesPerGroup: settings['slides_to_scroll'],
                    },
                    1400: {
                        slidesPerView: settings['slides_to_show_xxl'],
                        slidesPerGroup: settings['slides_to_scroll'],
                    }
                },
                on: {
                    init: function (swiper) {
                        const progress = 0;
                        if ($scope.find('.pxl-portfolio-carousel1').length > 0) {
                            animateFilterWhileDragging(progress);
                        }
                        if ($scope.find('.pxl-service-carousel').length > 0) {
                            auregon_svg_color();
                        }
                        setBoxHeight();
                        auregon_text_hover_image();

                        if (swiper.thumbs && swiper.thumbs.swiper) {
                            setTimeout(function () {
                                var thumbSwiper = swiper.thumbs.swiper;
                                var targetIndex = swiper.realIndex !== undefined ? swiper.realIndex : swiper.activeIndex;
                                if (thumbSwiper.params && thumbSwiper.params.loop) {
                                    thumbSwiper.slideToLoop(targetIndex, 0);
                                } else {
                                    thumbSwiper.slideTo(targetIndex, 0);
                                }
                            }, 50);
                        }

                        if (typeof window.initRipples === 'function') {
                            var initRippleOnSlides = function () {
                                var $allSlides = $scope.find('.pxl-swiper-slide');
                                if ($allSlides.length) {
                                    window.initRipples($allSlides);
                                }
                            };
                            setTimeout(initRippleOnSlides, 50);
                            setTimeout(initRippleOnSlides, 200);
                            setTimeout(initRippleOnSlides, 400);
                            setTimeout(initRippleOnSlides, 600);
                        }
                    },

                    slideChange: function (swiper) {

                        const currentIndex = swiper.activeIndex;
                        const totalSlides = swiper.slides.length;
                        const progress = currentIndex / (totalSlides - 1);

                        // Ensure autoplay continues with reverse direction
                        if ((settings['reverse'] || settings['reverse'] === 'true') && swiper.autoplay) {
                            if (!swiper.autoplay.running && swiper.params && swiper.params.autoplay) {
                                // Restart autoplay if it stopped unexpectedly
                                setTimeout(function () {
                                    if (swiper.autoplay && !swiper.autoplay.running) {
                                        swiper.autoplay.start();
                                    }
                                }, 50);
                            }
                        }

                        if (swiper.thumbs && swiper.thumbs.swiper) {
                            var thumbSwiper = swiper.thumbs.swiper;
                            var realIndex = swiper.realIndex !== undefined ? swiper.realIndex : currentIndex;
                            var thumbRealIndex = thumbSwiper.realIndex !== undefined ? thumbSwiper.realIndex : thumbSwiper.activeIndex;
                            if (thumbRealIndex !== realIndex && !thumbSwiper.animating) {
                                if (thumbSwiper.params && thumbSwiper.params.loop) {
                                    thumbSwiper.slideToLoop(realIndex, 300);
                                } else {
                                    thumbSwiper.slideTo(realIndex, 300);
                                }
                            }
                        }

                        if ($scope.find('.pxl-portfolio-carousel1').length > 0) {
                            animateFilterWhileDragging(progress);
                        }

                        if (typeof window.cleanupInvisibleDuplicates === 'function') {
                            window.cleanupInvisibleDuplicates($scope);
                        }
                        if (typeof window.initRipples === 'function') {
                            setTimeout(function () {
                                var $visibleSlides = $scope.find('.pxl-swiper-slide.swiper-slide-visible');
                                if ($visibleSlides.length) {
                                    window.initRipples($visibleSlides);
                                }
                            }, 100);
                        }
                    },

                    imagesReady: function (swiper) {
                        if (typeof window.initRipples === 'function') {
                            setTimeout(function () {
                                var $slides = $scope.find('.pxl-swiper-slide.swiper-slide-visible');
                                if (!$slides.length) {
                                    $slides = $scope.find('.pxl-swiper-slide');
                                }
                                if ($slides.length) {
                                    window.initRipples($slides);
                                }
                            }, 100);
                            setTimeout(function () {
                                var $allSlides = $scope.find('.pxl-swiper-slide');
                                if ($allSlides.length) {
                                    window.initRipples($allSlides);
                                }
                            }, 300);
                        }
                    },

                    autoplayStart: function (swiper) {
                        // Ensure autoplay continues smoothly with reverse direction
                        if (settings['reverse'] || settings['reverse'] === 'true') {
                            if (swiper.autoplay && swiper.params && swiper.params.autoplay && swiper.params.autoplay.reverseDirection) {
                                // Autoplay is starting with reverse direction
                            }
                        }
                    },

                    autoplayStop: function (swiper) {
                        // Handle autoplay stop if needed
                    },

                    beforeDestroy: function (swiper) {
                        if (typeof window.destroyRipples === 'function') {
                            window.destroyRipples($scope);
                        }
                    },
                }
            };

            if (settings['center_slide'] || settings['center_slide'] === 'true') {
                if (settings['loop'] || settings['loop'] === 'true') {
                    carousel_settings['initialSlide'] = Math.floor(numberOfSlides / 2);
                } else {
                    if (carousel_settings['slidesPerView'] > 1) {
                        carousel_settings['initialSlide'] = Math.floor((numberOfSlides - carousel_settings['slidesPerView']) / 2);
                    } else {
                        carousel_settings['initialSlide'] = Math.ceil((numberOfSlides / 2) - 1);
                    }
                }
            } else if ((settings['reverse'] || settings['reverse'] === 'true') && numberOfSlides > 0) {
                // When reverse is enabled, start from the last slide
                if (settings['loop'] || settings['loop'] === 'true') {
                    // With loop, start from near the end
                    carousel_settings['initialSlide'] = Math.max(0, numberOfSlides - 1);
                } else {
                    // Without loop, start from the last slide
                    carousel_settings['initialSlide'] = Math.max(0, numberOfSlides - carousel_settings['slidesPerView']);
                }
            }

            if (settings['center_slide'] || settings['center_slide'] == 'true')
                carousel_settings['centeredSlides'] = true;

            if (settings['loop'] || settings['loop'] === 'true') {
                carousel_settings['loop'] = true;
            }

            if (settings['autoplay'] || settings['autoplay'] === 'true') {
                carousel_settings['autoplay'] = {
                    delay: settings['delay'],
                    disableOnInteraction: settings['pause_on_interaction']
                };

                // Set reverse direction if enabled
                if (settings['reverse'] || settings['reverse'] === 'true') {
                    carousel_settings['autoplay']['reverseDirection'] = true;
                }
            } else {
                carousel_settings['autoplay'] = false;
            }

            // parallax
            if (settings['parallax'] === 'true') {
                carousel_settings['parallax'] = true;
            }

            if (settings['slide_mode'] === 'fade') {
                carousel_settings['fadeEffect'] = {
                    crossFade: true
                };
            }

            if (settings['slide_mode'] === 'cards') {
                carousel_settings['centeredSlides'] = true;
                carousel_settings['cardsEffect'] = {
                    perSlideRotate: 7,
                    // perSlideOffset: 0,
                };
            }

            if (settings['slide_mode'] === 'carousel') {
                carousel_settings['modules'] = [EffectCarousel]
            }

            if (settings['slide_mode'] === 'gl') {
                carousel_settings['modules'] = [SwiperGL]
            }

            // Coverflow Effect
            if (settings['slide_mode'] === 'coverflow') {
                carousel_settings['centeredSlides'] = true;
                carousel_settings['coverflowEffect'] = {
                    rotate: 0,
                    stretch: 175,
                    depth: 0,
                    scale: 1,
                    modifier: 1,
                    slideShadows: false,
                };
            }

            // Start Swiper Thumbnail
            var slide_thumbs = null;
            if ($this.find('.pxl-swiper-thumbs').length > 0) {

                var thumb_settings = $this.find('.pxl-swiper-thumbs').data().settings;

                var thumb_carousel_settings = {
                    effect: thumb_settings['slide_mode'] === 'fade' ? 'fade' : 'slide',
                    direction: 'horizontal',
                    wrapperClass: 'pxl-swiper-wrapper',
                    slideClass: 'pxl-swiper-slide',
                    spaceBetween: 0,
                    slidesPerView: thumb_settings['slides_to_show'],
                    freeMode: true,
                    watchSlidesProgress: true,
                    slideToClickedSlide: true,
                };

                if (thumb_settings['center_slide'] || thumb_settings['center_slide'] === 'true') {
                    thumb_carousel_settings['centeredSlides'] = true;
                }

                if (thumb_settings['loop'] || thumb_settings['loop'] === 'true') {
                    thumb_carousel_settings['loop'] = true;
                }

                slide_thumbs = new Swiper($this.find('.pxl-swiper-thumbs')[0], thumb_carousel_settings);
                carousel_settings['thumbs'] = { swiper: slide_thumbs };
            }
            // End Swiper Thumbnail

            var allSlides = $this.find(".pxl-swiper-slide");

            var swiper = new Swiper($this.find(".pxl-swiper-container")[0], carousel_settings);

            // Ensure autoplay with reverse direction works correctly after initialization
            if ((settings['reverse'] || settings['reverse'] === 'true') && swiper.autoplay) {
                // Restart autoplay to ensure reverseDirection is properly applied
                setTimeout(function () {
                    if (swiper.autoplay && swiper.autoplay.running) {
                        swiper.autoplay.stop();
                        swiper.autoplay.start();
                    } else if (swiper.autoplay) {
                        swiper.autoplay.start();
                    }
                }, 100);
            }

            if (settings['autoplay'] === 'true' && settings['pause_on_hover'] === 'true') {
                $($this.find('.pxl-swiper-container')).on({
                    mouseenter: function mouseenter() {
                        this.swiper.autoplay.stop();
                    },
                    mouseleave: function mouseleave() {
                        this.swiper.autoplay.start();
                    }
                });
            }

            // Navigation-Carousel
            $('.pxl-navigation-carousel').parents('.elementor-element').addClass('pxl--hide-arrow');
            setTimeout(function () {
                $('.pxl-navigation-carousel .pxl-navigation-arrow-prev').on('click', function () {
                    $(this).parents('.elementor-element').find('.pxl-swiper-arrow.pxl-swiper-arrow-prev').trigger('click');
                });
                $('.pxl-navigation-carousel .pxl-navigation-arrow-next').on('click', function () {
                    $(this).parents('.elementor-element').find('.pxl-swiper-arrow.pxl-swiper-arrow-next').trigger('click');
                });
            }, 300);

            $(".pxl-portfolio-carousel2").on("mouseenter", ".pxl-swiper-slide .pxl-post--inner", function () {
                $(".pxl-post--inner").removeClass("active");
                $(this).addClass("active");
            });

            /* Arrow Custom */
            var section_tab = $('.pxl-pagination-carousel').parents('.elementor-element:not(.elementor-inner-section)').addClass('pxl--hide-arrow');
            var target = section_tab.find('.pxl-swiper-slider .pxl-swiper-dots');

            var target_tab = target.parents('.elementor-element.pxl--hide-arrow').find('.pxl-pagination-carousel');
            target_tab.empty();

            var target_clone = target.clone();
            target_tab.append(target_clone);

            target_tab.find('.pxl-swiper-pagination-bullet').each(function (index) {
                var stepText = 'Step ' + (index + 1) + '.';
                $(this).text(stepText);
            });

            target_tab.find('.pxl-swiper-pagination-bullet').on('click', function () {
                var $this = $(this);
                var $section = $this.parents('.elementor-element.pxl--hide-arrow');

                $section.find('.pxl-pagination-carousel .pxl-swiper-pagination-bullet').removeClass('swiper-pagination-bullet-active').attr('aria-current', 'false');
                $section.find('.pxl-swiper-slider .pxl-swiper-pagination-bullet').removeClass('swiper-pagination-bullet-active').attr('aria-current', 'false');

                $this.addClass('swiper-pagination-bullet-active').attr('aria-current', 'true');
                var index = $this.index();
                $section.find('.pxl-swiper-slider .pxl-swiper-pagination-bullet').eq(index).addClass('swiper-pagination-bullet-active').attr('aria-current', 'true');

                $section.find('.pxl-swiper-slider .pxl-swiper-pagination-bullet').eq(index).trigger('click');
            });
            // 

            $scope.find(".pxl--filter-inner .filter-item").on("click", function () {
                var target = $(this).attr('data-filter-target');
                var $parent = $(this).closest('.pxl-swiper-slider');
                $(this).siblings().removeClass("active");
                $(this).addClass("active");
                $parent.find(".pxl-swiper-slide").remove();
                if (target == "all") {
                    allSlides.each(function () {

                        $this.find('.pxl-swiper-wrapper').append($(this)[0].outerHTML);

                    });

                } else {
                    allSlides.each(function () {
                        if ($(this).is("[data-filter^='" + target + "']") || $(this).is("[data-filter*='" + target + "']")) {
                            $this.find('.pxl-swiper-wrapper').append($(this)[0].outerHTML);
                        }
                    });
                }
                numberOfSlides = $parent.find(".pxl-swiper-slide").length;
                if (carousel_settings['centeredSlides']) {
                    if (carousel_settings['loop']) {
                        carousel_settings['initialSlide'] = Math.floor(numberOfSlides / 2);
                    } else {
                        if (carousel_settings['slidesPerView'] > 1) {
                            carousel_settings['initialSlide'] = Math.ceil((numberOfSlides - carousel_settings['slidesPerView']) / 2);
                        } else {
                            carousel_settings['initialSlide'] = Math.ceil((numberOfSlides / 2) - 1);
                        }
                    }

                }

                if (typeof window.destroyRipples === 'function') {
                    window.destroyRipples($parent);
                }
                swiper.destroy();
                swiper = new Swiper($parent.find(".pxl-swiper-container")[0], carousel_settings);
                if (typeof window.initRipples === 'function') {
                    setTimeout(function () {
                        var $slides = $parent.find('.pxl-swiper-slide.swiper-slide-visible');
                        if (!$slides.length) {
                            $slides = $parent.find('.pxl-swiper-slide');
                        }
                        if ($slides.length) {
                            window.initRipples($slides);
                        }
                    }, 150);
                }
            });
        });

        function auregon_svg_color() {
            $('.pxl-service-carousel .pxl-post--icon img').each(function () {
                var $img = jQuery(this);
                var imgID = $img.attr('id');
                var imgClass = $img.attr('class');
                var imgURL = $img.attr('src');

                if (imgURL) {
                    setTimeout(function () {
                        jQuery.get(imgURL, function (data) {
                            var $svg = jQuery(data).find('svg');
                            if (imgID) {
                                $svg.attr('id', imgID);
                            }
                            if (imgClass) {
                                $svg.attr('class', imgClass + ' replaced-svg');
                            }
                            $svg.removeAttr('xmlns:a');
                            if (!$svg.attr('viewBox') && $svg.attr('height') && $svg.attr('width')) {
                                $svg.attr('viewBox', '0 0 24 24');
                            }
                            $img.replaceWith($svg);
                        }, 'xml');
                    }, 500);
                }
            });
        }

        function findCenteredSlides(swiper, $parent) {
            var slides = $parent.find('.swiper-slide-visible'),
                elOffsetLeft = $(swiper.$el).offset().left,
                elOffsetRight = elOffsetLeft + $(swiper.$el).outerWidth();
            slides.each(function () {
                if ($(this).hasClass('swiper-slide-visible')) {
                    var thisSlideOffsetLeft = $(this).offset().left - 1,
                        thisSlideOffsetRight = $(this).offset().left + 1 + $(this).outerWidth();

                    if (thisSlideOffsetLeft > elOffsetLeft && thisSlideOffsetRight < elOffsetRight) {
                        $(this).addClass('swiper-slide-active').removeClass('swiper-slide-uncentered');
                    } else {
                        $(this).removeClass('swiper-slide-active').addClass('swiper-slide-uncentered');
                    }
                }
            });
        }

        function auregon_text_hover_image() {

            var $portfolioCarousel = $('.pxl-portfolio-carousel2');
            if (!$portfolioCarousel.length) return;
            var mouseX = 0,
                mouseY = 0;

            var $hoverAreas = $portfolioCarousel.find('.pxl-swiper-wrapper');
            if (!$hoverAreas.length) return;

            $hoverAreas.mousemove(function (e) {
                var offset = $(this).offset();
                mouseX = (e.pageX - offset.left);
                mouseY = (e.pageY - offset.top);

            });

            $portfolioCarousel.find('.pxl-swiper-slide').on("mouseenter", function () {
                $(this).removeClass('deactive').addClass('active');
                var target = $(this).attr('data-target');
                $(this).closest('.pxl-swiper-wrapper').find(target).removeClass('deactive').addClass('active');
            });
            $portfolioCarousel.find('.pxl-swiper-slide').on("mouseleave", function () {
                $(this).addClass('deactive').removeClass('active');
                var target = $(this).attr('data-target');
                $(this).closest('.pxl-swiper-wrapper').find(target).addClass('deactive').removeClass('active');
            });
            const s = {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            },
                setHoverPosition = gsap.quickSetter($hoverAreas, "css");

            gsap.ticker.add((() => {
                const i = 1 - Math.pow(.85, gsap.ticker.deltaRatio());
                s.x += (mouseX - s.x) * i,
                    s.y += (mouseY - s.y) * i,
                    setHoverPosition({
                        "--pxl-mouse-x": `${s.x}px`,
                        "--pxl-mouse-y": `${s.y}px`
                    })
            }))
        }

        function setBoxHeight() {
            var $verticalCarousels = $('.swiper-vertical');
            if (!$verticalCarousels.length) {
                return;
            }

            $verticalCarousels.each(function () {
                var $carousel = $(this);
                var totalHeight = 0;
                var processedIndexes = {};
                var $visibleSlides = $carousel
                    .find('.pxl-swiper-slide.swiper-slide-visible')
                    .not('.swiper-slide-duplicate');

                if (!$visibleSlides.length) {
                    $visibleSlides = $carousel
                        .find('.pxl-swiper-slide.swiper-slide-active')
                        .not('.swiper-slide-duplicate');
                }

                $visibleSlides.each(function () {
                    var $slide = $(this);
                    var slideIndex = $slide.attr('data-swiper-slide-index');

                    if (slideIndex !== undefined) {
                        if (processedIndexes[slideIndex]) {
                            return; // Skip duplicated slides when loop is enabled
                        }
                        processedIndexes[slideIndex] = true;
                    }

                    var slideHeight = 0;
                    var $slideInner = $slide.find('.pxl-post--inner, .pxl-swiper-slide-box');

                    $slideInner.each(function () {
                        var innerHeight = parseFloat($(this).outerHeight()) || 0;
                        slideHeight += innerHeight;
                    });

                    var paddingTop = parseFloat($slide.css('padding-top')) || 0;
                    var paddingBottom = parseFloat($slide.css('padding-bottom')) || 0;
                    var paddingInnerTop = 0;
                    var paddingInnerBottom = 0;

                    if ($slideInner.length) {
                        var $firstInner = $slideInner.first();
                        paddingInnerTop = parseFloat($firstInner.css('padding-top')) || 0;
                        paddingInnerBottom = parseFloat($firstInner.css('padding-bottom')) || 0;
                    }

                    slideHeight += paddingTop + paddingBottom + paddingInnerTop + paddingInnerBottom + 2;
                    totalHeight += slideHeight;
                });

                $carousel.height(totalHeight);
            });
        }

        function animateFilterWhileDragging(progress) {
            if (window.innerWidth <= 767) return;
            const filterElements = document.querySelectorAll('.pxl-portfolio-carousel1 .swiper-filter.style-2');

            filterElements.forEach((filterElement) => {
                let translateX = progress * -1000;
                let rotateY = progress * -1000;
                let translateZ = 5 * progress * -1000;

                gsap.to(filterElement, {
                    duration: 0.5,
                    x: translateX,
                    z: translateZ,
                    rotateY: rotateY,
                    opacity: 1,
                    ease: 'power3.out'
                });
            });
        }

    };

    $(window).on('elementor/frontend/init', function () {

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_post_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_slider_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_team_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_client_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_text_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_process.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_image_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_testimonial_slip.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_tab_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_testimonial_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_partner_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_iconbox_carousel.default', function ($scope) {
            pxl_swiper_handler($scope);
        });

    });
})(jQuery);