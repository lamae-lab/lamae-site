(function ($) {

    $(document).ready(function () {
        $(".pxl-tabs").each(function () {
            var $tabs = $(this);

            $tabs.find("#toggle-input").on("change", function () {
                let $switchBtn = $(this).closest(".pxl-tabs__switch-btn");
                let $tabsContent = $tabs.find(".pxl-tabs__content");
                let $tabItems = $tabsContent.find(".pxl-tabs__item");
                let dataTab1 = $switchBtn.data("st");
                let dataTab2 = $switchBtn.data("nd");

                $tabItems.toggleClass("active");

                $tabItems.filter(".active").prependTo($tabsContent);
            });

            pxl_widget_tabs_handler({
                find: function (selector) {
                    return $tabs.find(selector);
                }
            }, $);
        });
    });

    var pxl_widget_tabs_handler = function ($scope, $) {
        var $tabs = $scope.find(".pxl-tabs");

        $tabs.each(function () {
            var $tabContainer = $(this);
            var $titles = $tabContainer.find(".pxl-tabs--title .pxl-item--title");
            var $contents = $tabContainer.find(".pxl-tabs--content .pxl-item--content");

            var defaultIndex = $titles.index($titles.filter('.active'));
            if (defaultIndex === -1) defaultIndex = 0;

            function activateTab(index) {
                if ($titles.length === 0 || $contents.length === 0) {
                    return;
                }

                if (index < 0) index = $titles.length - 1;
                if (index >= $titles.length) index = 0;

                var $newActiveTitle = $titles.eq(index);
                var target = $newActiveTitle.data("target");

                if (!target) {
                    return;
                }

                var $newActiveContent = $(target);

                if (!$newActiveContent.length) {
                    return;
                }

                $titles.removeClass("active");
                $newActiveTitle.addClass("active");

                if ($tabContainer.hasClass("tab-effect-slide")) {
                    $contents.not($newActiveContent).stop(true, true).slideUp(300);
                    $newActiveContent.stop(true, true).slideDown(300);
                } else if ($tabContainer.hasClass("tab-effect-fade")) {
                    $contents.removeClass("active").fadeOut(200);
                    $newActiveContent.fadeIn(200).addClass("active");
                } else {
                    $contents.hide();
                    $newActiveContent.show();
                }
            }

            $titles.on("click", function (e) {
                e.preventDefault();
                var index = $titles.index(this);
                if (index === -1) {
                    return;
                }
                activateTab(index);
            });

            $tabContainer.find(".pxl-tabs-next").on("click", function () {
                var index = $titles.index($tabContainer.find(".pxl-item--title.active"));
                if (index === -1) index = 0;
                activateTab(index + 1);
            });

            $tabContainer.find(".pxl-tabs-prev").on("click", function () {
                var index = $titles.index($tabContainer.find(".pxl-item--title.active"));
                if (index === -1) index = 0;
                activateTab(index - 1);
            });

            activateTab(defaultIndex);
        });
    };

    $(window).on('elementor/frontend/init', function () {
        elementorFrontend.hooks.addAction('frontend/element_ready/pxl_tabs.default', pxl_widget_tabs_handler);
    });
})(jQuery);
