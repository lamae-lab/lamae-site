(function ($) {
    $(window).on('elementor/frontend/init', function () {
        setTimeout(function () {
            $('.pxl-grid').each(function (index, element) {
                var $grid_scope = $(this);
                auregon_svg_color($grid_scope);
                var isTeamGrid = $grid_scope.hasClass('pxl-team-grid');

                if ($grid_scope.hasClass('pxl-post-list')) {
                    var isoOptions = {};
                    var $grid_isotope = null;
                } else {
                    var $grid_masonry = $grid_scope.find('.pxl-grid-masonry');
                    var isoOptions = {
                        itemSelector: '.pxl-grid-item',
                        layoutMode: $(this).closest('.pxl-grid').attr('data-layout'),
                        fitRows: {
                            gutter: 0
                        },
                        percentPosition: true,
                        masonry: {
                            columnWidth: '.grid-sizer',
                        },
                        containerStyle: null,
                        stagger: 30,
                        transitionDuration: '0.6s',
                        sortBy: 'name',
                    };
                    var $grid_isotope = $grid_masonry.isotope(isoOptions);
                    if (isTeamGrid) {
                        $grid_masonry.on('arrangeComplete', function () {
                            requestAnimationFrame(function () {
                                $grid_scope.find('.pxl-grid-item:not(.pxl-hidden)').addClass('pxl-grid-item--visible');
                                $grid_scope.removeClass('pxl-team-grid--filtering');
                            });
                        });
                        // Ensure initial items become visible once images finish loading
                        $grid_masonry.imagesLoaded(function () {
                            requestAnimationFrame(function () {
                                $grid_scope.find('.pxl-grid-item:not(.pxl-hidden)').addClass('pxl-grid-item--visible');
                                $grid_scope.removeClass('pxl-team-grid--filtering');
                            });
                        });
                    }


                    $grid_scope.on('click', '.pxl-grid-filter .filter-item', function (e) {

                        var $this = $(this);
                        var term_slug = $this.attr('data-filter');

                        $this.siblings('.filter-item.active').removeClass('active');
                        $this.addClass('active');
                        $grid_scope.find('.pxl-post--inner').removeClass('animated');

                        if ($this.closest('.pxl-grid-filter').hasClass('ajax')) {
                            var loadmore = $grid_scope.data('loadmore');
                            loadmore.term_slug = term_slug;
                            auregon_grid_ajax_handler($this, $grid_scope, $grid_isotope,
                                { action: 'auregon_load_more_post_grid', loadmore: loadmore, iso_options: isoOptions, handler_click: 'filter', scrolltop: 0 }
                            );
                        } else {
                            $grid_isotope.isotope({ filter: term_slug });

                        }
                    });

                    // Handle dropdown filter for team grid
                    $grid_scope.on('change', '.pxl-filter-dropdown', function (e) {
                        var $this = $(this);
                        var term_slug = $this.val();
                        var allTeamData = $grid_scope.data('all-team-data');

                        $grid_scope.find('.pxl-post--inner').removeClass('animated');
                        if (isTeamGrid) {
                            $grid_scope.addClass('pxl-team-grid--filtering');
                            $grid_scope.find('.pxl-grid-item').removeClass('pxl-grid-item--visible');
                        }

                        // If this is a team grid with all data available, filter client-side
                        if (allTeamData && $grid_scope.hasClass('pxl-team-grid')) {
                            auregon_filter_team_grid($grid_scope, term_slug, allTeamData);
                        } else if ($this.closest('.pxl-grid-filter').hasClass('ajax')) {
                            var loadmore = $grid_scope.data('loadmore');
                            loadmore.term_slug = term_slug;
                            auregon_grid_ajax_handler($this, $grid_scope, $grid_isotope,
                                { action: 'auregon_load_more_post_grid', loadmore: loadmore, iso_options: isoOptions, handler_click: 'filter', scrolltop: 0 }
                            );
                        } else {
                            $grid_isotope.isotope({ filter: term_slug });
                        }
                    });
                }

                /**
                 * Remove accents from string for accent-insensitive search
                 * Supports Vietnamese, French, Spanish, German, Portuguese, and other languages
                 */
                function removeAccents(str) {
                    if (!str) return '';
                    str = str.toLowerCase();

                    if (typeof str.normalize === 'function') {
                        // Modern browsers: use Unicode normalization
                        return str.normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
                            .replace(/đ/g, 'd'); // Vietnamese đ (not handled by NFD)
                    } else {
                        // Fallback for older browsers
                        var accents = {
                            'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
                            'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
                            'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
                            'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
                            'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
                            'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
                            'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
                            'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
                            'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
                            'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
                            'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
                            'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
                            'đ': 'd',
                            'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u', 'ÿ': 'y',
                            'ñ': 'n', 'ç': 'c', 'æ': 'ae', 'œ': 'oe'
                        };
                        return str.split('').map(function (char) {
                            return accents[char] || char;
                        }).join('');
                    }
                }

                /**
                 * Check if string contains accented characters
                 */
                function hasAccents(str) {
                    if (!str) return false;
                    if (typeof str.normalize === 'function') {
                        var normalized = str.normalize('NFD');
                        return /[\u0300-\u036f]/.test(normalized) || /đ/.test(str.toLowerCase());
                    } else {
                        return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđäëïöüÿñçæœ]/.test(str);
                    }
                }

                // Search input handler
                $grid_scope.on('input', '.grid-search-input', function () {
                    var searchQuery = $(this).val().toLowerCase();
                    var queryHasAccents = hasAccents(searchQuery);
                    var normalizedSearchQuery = removeAccents(searchQuery);

                    if ($grid_isotope) {
                        $grid_isotope.isotope({
                            filter: function () {
                                var itemTitle = $(this).find('.pxl-post--title a').text().toLowerCase();
                                var dataName = ($(this).attr('data-name') || '').toLowerCase();

                                // If query has accents: exact match
                                // If query has no accents: accent-insensitive match
                                if (queryHasAccents) {
                                    return itemTitle.indexOf(searchQuery) !== -1 ||
                                        dataName.indexOf(searchQuery) !== -1;
                                } else {
                                    var normalizedItemTitle = removeAccents(itemTitle);
                                    var normalizedDataName = removeAccents(dataName);
                                    return normalizedItemTitle.indexOf(normalizedSearchQuery) !== -1 ||
                                        normalizedDataName.indexOf(normalizedSearchQuery) !== -1;
                                }
                            }
                        });
                    } else {
                        // AJAX search if Isotope is not used
                        var loadmore = $grid_scope.data('loadmore') || {};
                        loadmore.search_query = searchQuery;
                        auregon_grid_ajax_handler('auregon_load_more_post_grid', {
                            action: 'auregon_load_more_post_grid',
                            loadmore: loadmore,
                            iso_options: isoOptions,
                            handler_click: 'search',
                            scrolltop: 0
                        }, 'search');
                    }
                });

                $grid_scope.on('click', '.pxl-grid-pagination .ajax a.page-numbers', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $this = $(this);
                    var loadmore = $grid_scope.data('loadmore');
                    var paged = $this.attr('href');
                    paged = paged.replace('#', '');
                    loadmore.paged = parseInt(paged);
                    auregon_grid_ajax_handler($this, $grid_scope, $grid_isotope,
                        { action: 'auregon_load_more_post_grid', loadmore: loadmore, iso_options: isoOptions, handler_click: 'pagination', scrolltop: 0 }
                    );
                    $('html,body').animate({ scrollTop: $grid_scope.offset().top - 130 }, 500);
                });

                $grid_scope.on('click', '.btn-grid-loadmore', function (e) {
                    e.preventDefault();
                    var $this = $(this);
                    var loadmore = $grid_scope.data('loadmore');

                    // Parse loadmore data if it's a string
                    if (typeof loadmore === 'string') {
                        try {
                            loadmore = JSON.parse(loadmore);
                        } catch (e) {
                            console.error('Error parsing loadmore data:', e);
                            return;
                        }
                    }

                    if (!loadmore || typeof loadmore !== 'object') {
                        console.error('Invalid loadmore data:', loadmore);
                        return;
                    }

                    // Calculate next page
                    var next_page = parseInt($grid_scope.data('start-page')) + 1;
                    loadmore.paged = next_page;

                    // Determine action based on widget type
                    var action = 'auregon_load_more_post_grid';
                    if (loadmore.widget_type === 'team_grid') {
                        action = 'auregon_load_more_team_grid';
                        // For team grid, use paged as current_page for consistency
                        loadmore.current_page = next_page;
                    }


                    auregon_grid_ajax_handler($this, $grid_scope, $grid_isotope,
                        { action: action, loadmore: loadmore, iso_options: isoOptions, handler_click: 'loadmore', scrolltop: 0 }
                    );
                });

                $grid_scope.on('change', '.orderby', function (e) {
                    e.preventDefault();
                    var $this = $(this);
                    var loadmore = $grid_scope.data('loadmore');
                    loadmore.orderby = $this.val();

                    auregon_grid_ajax_handler($this, $grid_scope, $grid_isotope,
                        { action: 'auregon_load_more_post_grid', loadmore: loadmore, iso_options: isoOptions, handler_click: 'select_orderby', scrolltop: 0 }
                    );
                });

            });


            function auregon_filter_team_grid($grid_scope, filter_value, allTeamData) {
                var loadmore_data = $grid_scope.data('loadmore');

                // Parse loadmore data if it's a string
                if (typeof loadmore_data === 'string') {
                    try {
                        loadmore_data = JSON.parse(loadmore_data);
                    } catch (e) {
                        console.error('Error parsing loadmore data in filter:', e);
                        return;
                    }
                }

                if (!loadmore_data || typeof loadmore_data !== 'object') {
                    console.error('Invalid loadmore data in filter:', loadmore_data);
                    return;
                }

                // Update the loadmore data with filter
                loadmore_data.term_slug = filter_value;
                loadmore_data.current_page = 1; // Reset to first page when filtering

                // Make AJAX call to get filtered results
                $.ajax({
                    url: main_data.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'auregon_load_more_team_grid',
                        settings: loadmore_data,
                        handler_click: 'filter',
                        nonce: main_data.nonce
                    },
                    success: function (res) {
                        if (res.status == true) {
                            // Clear current items and add filtered ones
                            $grid_scope.find('.pxl-grid-inner .pxl-grid-item').remove();
                            $grid_scope.find('.pxl-grid-inner').append(res.data.html);

                            // Reset to page 1 when filtering
                            $grid_scope.data('start-page', 1);

                            // Reinitialize Isotope
                            var $grid_masonry = $grid_scope.find('.pxl-grid-masonry');
                            if ($grid_masonry.length) {
                                var isoOptions = {
                                    itemSelector: '.pxl-grid-item',
                                    layoutMode: $grid_scope.attr('data-layout'),
                                    fitRows: {
                                        gutter: 0
                                    },
                                    percentPosition: true,
                                    masonry: {
                                        columnWidth: '.grid-sizer',
                                    },
                                    containerStyle: null,
                                    stagger: 30,
                                    transitionDuration: '0.6s',
                                    sortBy: 'name',
                                };
                                $grid_masonry.isotope('destroy');
                                $grid_masonry.isotope(isoOptions).on('arrangeComplete', function () {
                                    requestAnimationFrame(function () {
                                        $grid_scope.find('.pxl-grid-item:not(.pxl-hidden)').addClass('pxl-grid-item--visible');
                                        $grid_scope.removeClass('pxl-team-grid--filtering');

                                        // Initialize ripples after Isotope layout completes
                                        if (typeof window.initRipples === 'function') {
                                            setTimeout(function () {
                                                window.initRipples($grid_scope);
                                            }, 50);
                                        }
                                    });
                                });
                            } else {
                                // Initialize ripples immediately if no Isotope
                                if (typeof window.initRipples === 'function') {
                                    setTimeout(function () {
                                        window.initRipples($grid_scope);
                                    }, 100);
                                }
                            }

                            // Update load more button visibility for team grid
                            var $loadmore = $grid_scope.find('.pxl-load-more');
                            if ($loadmore.length) {
                                // Use same logic as regular load more
                                if (res.data.already_displayed >= res.data.total) {
                                    $loadmore.hide();
                                } else {
                                    $loadmore.show();
                                }
                            }
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('Error filtering team grid');
                    }
                });
            }

            function auregon_svg_color($scope) {
                var $target = $scope ? $scope.find('.pxl-post--icon img') : $('.pxl-service-grid .pxl-post--icon img, .pxl-portfolio-grid .pxl-post--icon img');

                $target.each(function () {
                    var $img = jQuery(this);
                    var imgID = $img.attr('id');
                    var imgClass = $img.attr('class');
                    var imgURL = $img.attr('src');

                    // Avoid re-processing
                    if ($img.hasClass('svg-replaced')) return;
                    $img.addClass('svg-replaced');

                    if (imgURL) {
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
                    }
                });
            }

            function auregon_grid_ajax_handler($this, $grid_scope, $grid_isotope, args = {}) {
                var settings = $.extend(true, {}, {
                    action: '',
                    loadmore: '',
                    iso_options: {},
                    handler_click: '',
                    scrolltop: 0
                }, args);

                var offset_top = $grid_scope.offset().top;

                if (settings.handler_click == 'loadmore') {
                    var loadmore_text = $this.closest('.pxl-load-more').data('loadmore-text');
                    var loading_text = $this.closest('.pxl-load-more').data('loading-text');
                    var curoffsettop = $this.offset().top;
                }

                $.ajax({
                    url: main_data.ajax_url,
                    type: 'POST',
                    data: {
                        action: settings.action,
                        settings: settings.loadmore,
                        handler_click: settings.handler_click,
                        nonce: main_data.nonce
                    },
                    success: function (res) {
                        if (res.status == true) {

                            if (settings.handler_click == 'loadmore') {
                                if (settings.loadmore.wg_type == 'post-list') {
                                    $grid_scope.find('.pxl-list-inner').append(res.data.html)
                                } else {
                                    $grid_scope.find('.pxl-grid-inner').append(res.data.html)
                                }
                            } else {
                                if (settings.loadmore.wg_type == 'post-list') {
                                    $grid_scope.find('.pxl-list-inner .list-item').remove();
                                    $grid_scope.find('.pxl-list-inner').append(res.data.html);
                                } else {
                                    $grid_scope.find('.pxl-grid-inner .pxl-grid-item').remove();
                                    $grid_scope.find('.pxl-grid-inner').append(res.data.html);
                                }
                            }

                            if (settings.iso_options && $grid_isotope != null) {
                                $grid_isotope.isotope('destroy');
                                $grid_isotope.isotope(settings.iso_options);

                                // Wait for Isotope layout to complete before initializing ripples
                                $grid_isotope.one('arrangeComplete', function () {
                                    if (typeof window.initRipples === 'function') {
                                        setTimeout(function () {
                                            window.initRipples($grid_scope);
                                        }, 50);
                                    }
                                });
                            } else {
                                // Initialize ripples immediately if no Isotope
                                if (typeof window.initRipples === 'function') {
                                    setTimeout(function () {
                                        window.initRipples($grid_scope);
                                    }, 100);
                                }
                            }


                            $grid_scope.data('start-page', res.data.paged);

                            // Handle load more button visibility for both post grid and team grid
                            if (settings.loadmore['pagination_type'] == 'loadmore' ||
                                (typeof settings.loadmore === 'object' && settings.loadmore.widget_type === 'team_grid')) {

                                // Hide button if all items are displayed
                                if (res.data.already_displayed >= res.data.total) {
                                    $grid_scope.find('.pxl-load-more').hide();
                                } else {
                                    $grid_scope.find('.pxl-load-more').show();
                                }
                            }
                            if (settings.loadmore['pagination_type'] == 'pagination') {
                                $grid_scope.find(".pxl-grid-pagination").html(res.data.pagin_html);
                            }

                            if ($grid_scope.find('.result-count').length > 0) {
                                $grid_scope.find(".result-count").html(res.data.result_count);
                            }
                        }

                    },
                    error: function (xhr, status, error) {
                        console.error('AJAX Error');

                        // Reset loading state
                        $grid_scope.find('.pxl-grid-overlay-loading').removeClass('loader').addClass('loaded');
                        if (settings.handler_click == 'loadmore') {
                            $this.find('.pxl-loadmore-text').text('Load More');
                            $this.parent().removeClass('loading');
                        }
                    },
                    beforeSend: function () {
                        $grid_scope.find('.pxl-grid-overlay-loading').removeClass('loaded').addClass('loader');
                        if (settings.handler_click == 'loadmore') {
                            $this.find('.pxl-loadmore-text').text(loading_text);
                            $this.parent().addClass('loading');
                        }
                    },
                    complete: function () {
                        auregon_svg_color($grid_scope);
                        $grid_scope.find('.pxl-grid-overlay-loading').removeClass('loader').addClass('loaded');
                        if (settings.handler_click == 'loadmore') {
                            $this.find('.pxl-loadmore-text').text(loadmore_text);
                            $this.parent().removeClass('loading');
                        }
                        if (settings.scrolltop) {
                            $('html, body').animate({ scrollTop: offset_top - 100 }, 0);
                        }

                        // Initialize ripples after everything is complete (fallback)
                        if (typeof window.initRipples === 'function') {
                            setTimeout(function () {
                                window.initRipples($grid_scope);
                            }, 200);
                        }
                    }
                });
            }
        }, 150);
    });
    $(document).ready(function () {
        $('.filter-item').on('click', function () {
            var activeContent = $(this).text().trim();
            $('.label-text-fillter').text(activeContent);
        });
    });

})(jQuery); 