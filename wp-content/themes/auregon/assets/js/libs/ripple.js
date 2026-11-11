(function ($) {
    'use strict';

    var $window = $(window);

    // Polyfill for String.prototype.endsWith
    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }

    /**
     * Check WebGL support with float textures
     */
    function hasWebGLSupport() {
        var canvas = document.createElement('canvas');
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            canvas.remove();
            return false;
        }
        var ok = !!(
            gl.getExtension('OES_texture_float') &&
            gl.getExtension('OES_texture_float_linear')
        );
        canvas.remove();
        return ok;
    }

    var supportsWebGL = hasWebGLSupport();

    /**
     * Create WebGL shader program (with safe attribute location)
     */
    function createProgram(gl, vertexSource, fragmentSource) {
        function compileSource(type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                var info = gl.getShaderInfoLog(shader) || '';
                gl.deleteShader(shader);
                throw new Error('compile error: ' + info);
            }
            return shader;
        }

        var program = {
            id: gl.createProgram(),
            uniforms: {},
            locations: {}
        };

        var vertexShader = compileSource(gl.VERTEX_SHADER, vertexSource);
        var fragmentShader = compileSource(gl.FRAGMENT_SHADER, fragmentSource);

        gl.attachShader(program.id, vertexShader);
        gl.attachShader(program.id, fragmentShader);
        gl.linkProgram(program.id);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program.id, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(program.id) || '';
            gl.deleteProgram(program.id);
            throw new Error('link error: ' + info);
        }

        gl.useProgram(program.id);

        // Lấy đúng attribute location cho 'vertex'
        var vertexLocation = gl.getAttribLocation(program.id, 'vertex');
        if (vertexLocation !== -1) {
            program.locations.vertex = vertexLocation;
            gl.enableVertexAttribArray(vertexLocation);
        }

        // Extract uniform locations (uniform <type> <name>)
        var regex = /uniform\s+(\w+)\s+(\w+)/g;
        var match;
        var shaderCode = vertexSource + '\n' + fragmentSource;
        while ((match = regex.exec(shaderCode)) !== null) {
            var uniformName = match[2];
            program.locations[uniformName] = gl.getUniformLocation(program.id, uniformName);
        }

        return program;
    }

    /**
     * Bind texture to texture unit
     */
    function bindTexture(gl, texture, unit) {
        gl.activeTexture(gl.TEXTURE0 + (unit || 0));
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    /**
     * Check if number is power of two
     */
    function isPowerOfTwo(x) {
        return (x & (x - 1)) === 0;
    }

    // =========================
    //  RIPPLES CLASS
    // =========================

    function Ripples(el, options) {
        this.$el = $(el);
        this.$el.addClass('ripples');

        this._failed = false;
        this._lastDropTime = 0;
        this._minDropInterval = options.minDropInterval || 16;
        this.resolution = options.resolution || 256;
        this.textureDelta = new Float32Array([1 / this.resolution, 1 / this.resolution]);
        this.perturbance = (options.perturbance !== undefined) ? options.perturbance : Ripples.DEFAULTS.perturbance;
        this.devicePixelRatio = window.devicePixelRatio || 1;

        // Get background image URL
        var backgroundUrl = options.imageUrl;
        if (!backgroundUrl) {
            var cssBg = this.$el.css('background-image') || '';
            var match = /url\(["']?([^"']*)["']?\)/.exec(cssBg);
            if (match && match[1]) {
                backgroundUrl = match[1];
            }
        }

        if (!backgroundUrl) {
            console.warn('Ripples: no imageUrl or background-image found.');
            this._failed = true;
            return;
        }

        // Find image element (nếu có)
        this.$img = this.$el.find('img').first();

        // Create canvas
        var dimensions = this._getImageDimensions();
        var imgWidth = dimensions.width || 0;
        var imgHeight = dimensions.height || 0;

        if (imgWidth <= 0 || imgHeight <= 0) {
            // Chờ ResizeObserver / image load để set size sau
            imgWidth = 1;
            imgHeight = 1;
        }

        var canvas = document.createElement('canvas');
        this.canvas = canvas;

        // Set real pixel size (DPR)
        canvas.width = imgWidth * this.devicePixelRatio;
        canvas.height = imgHeight * this.devicePixelRatio;

        // Set CSS display size = container size
        var displaySize = this._getDisplaySize();
        $(canvas).css({
            width: displaySize.width + 'px',
            height: displaySize.height + 'px',
            display: 'block'
        });

        this.$el.append(canvas);

        // Get WebGL context
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.warn('Ripples: cannot get WebGL context.');
            this._failed = true;
            canvas.remove();
            return;
        }

        this.gl = gl;
        this.context = gl;

        // Load WebGL extensions (đã check trước nhưng vẫn gọi cho chắc)
        gl.getExtension('OES_texture_float');
        gl.getExtension('OES_texture_float_linear');

        // Setup resize handler
        this._resizeTimer = null;
        this._onResize = this._createResizeHandler();
        $window.on('resize.ripples', this._onResize);

        // Setup observers / image load
        this._setupImageLoadAndResize();

        // Setup event listeners
        this.$el.on('mousemove.ripples', $.proxy(this.mousemove, this));
        this.$el.on('mousedown.ripples', $.proxy(this.mousedown, this));

        // Initialize WebGL resources
        this._initWebGLResources();

        // Initialize shaders
        this.initShaders();

        // Load background image
        this.backgroundTexture = null;
        this.backgroundWidth = 0;
        this.backgroundHeight = 0;
        this._loadBackgroundImage(backgroundUrl);

        // Visibility / boundary cache
        this._isVisible = true;
        this._boundaryCache = null;
        this._boundaryCacheTime = 0;
        this._boundaryCacheTimeout = 100;

        if (window.IntersectionObserver) {
            var that = this;
            this._observer = new IntersectionObserver(function (entries) {
                if (entries && entries[0]) {
                    that._isVisible = entries[0].isIntersecting;
                }
            }, {
                threshold: 0.01
            });
            this._observer.observe(this.$el[0]);
        }

        // Start animation loop
        this._startAnimationLoop();
    }

    Ripples.DEFAULTS = {
        resolution: 128,
        perturbance: 0.038,
        minDropInterval: 16
    };

    Ripples.prototype = {
        /**
         * Get image dimensions (ưu tiên container cho layout responsive)
         */
        _getImageDimensions: function () {
            var width, height;

            var containerWidth = this.$el.outerWidth();
            var containerHeight = this.$el.outerHeight();

            if (this.$img.length > 0) {
                var img = this.$img[0];
                var imgComputedWidth = this.$img.width();
                var imgComputedHeight = this.$img.height();

                if (containerWidth > 0 && containerHeight > 0) {
                    // Nếu container khác image → dùng container
                    if (Math.abs(containerWidth - imgComputedWidth) > 1 ||
                        Math.abs(containerHeight - imgComputedHeight) > 1) {
                        width = containerWidth;
                        height = containerHeight;
                    } else if (img.naturalWidth && img.naturalHeight) {
                        // Dùng natural size để chất lượng tốt hơn
                        width = img.naturalWidth;
                        height = img.naturalHeight;
                    } else {
                        width = imgComputedWidth || containerWidth;
                        height = imgComputedHeight || containerHeight;
                    }
                } else {
                    // Fallback image
                    if (img.naturalWidth && img.naturalHeight) {
                        width = img.naturalWidth;
                        height = img.naturalHeight;
                    } else {
                        width = imgComputedWidth || containerWidth;
                        height = imgComputedHeight || containerHeight;
                    }
                }
            } else {
                width = containerWidth;
                height = containerHeight;
            }

            return {
                width: width || 0,
                height: height || 0
            };
        },

        /**
         * Get display size for CSS (luôn dùng container)
         */
        _getDisplaySize: function () {
            var containerWidth = this.$el.outerWidth();
            var containerHeight = this.$el.outerHeight();

            if (containerWidth > 0 && containerHeight > 0) {
                return {
                    width: containerWidth,
                    height: containerHeight
                };
            }

            if (this.$img.length > 0) {
                return {
                    width: this.$img.width() || 0,
                    height: this.$img.height() || 0
                };
            }

            return { width: 0, height: 0 };
        },

        /**
         * Update canvas size
         */
        _updateCanvasSize: function (width, height) {
            if (!this.canvas) return;

            var dpr = this.devicePixelRatio;
            var canvasWidth = width * dpr;
            var canvasHeight = height * dpr;

            if (canvasWidth <= 0 || canvasHeight <= 0) return;

            if (canvasWidth !== this.canvas.width || canvasHeight !== this.canvas.height) {
                this.canvas.width = canvasWidth;
                this.canvas.height = canvasHeight;

                $(this.canvas).css({
                    width: width + 'px',
                    height: height + 'px'
                });

                this._boundaryCache = null;
            }
        },

        /**
         * Create resize handler (window resize fallback)
         */
        _createResizeHandler: function () {
            var that = this;
            return function () {
                clearTimeout(that._resizeTimer);
                that._resizeTimer = setTimeout(function () {
                    var size = that._getDisplaySize();
                    if (size.width > 0 && size.height > 0) {
                        that._updateCanvasSize(size.width, size.height);
                    }
                }, 150);
            };
        },

        /**
         * Setup image load + ResizeObserver
         */
        _setupImageLoadAndResize: function () {
            var that = this;

            // Image load → cập nhật lần nữa (phòng khi container thay đổi)
            if (this.$img.length > 0) {
                this.$img.on('load.ripples', function () {
                    var size = that._getDisplaySize();
                    if (size.width > 0 && size.height > 0) {
                        that._updateCanvasSize(size.width, size.height);
                    }
                });
            }

            // ResizeObserver cho container
            if (window.ResizeObserver) {
                this._resizeObserver = new ResizeObserver(function (entries) {
                    for (var i = 0; i < entries.length; i++) {
                        var entry = entries[i];
                        var w = entry.contentRect.width;
                        var h = entry.contentRect.height;
                        if (w > 0 && h > 0) {
                            that._updateCanvasSize(w, h);
                        }
                    }
                });
                this._resizeObserver.observe(this.$el[0]);
            } else {
                // Nếu không có ResizeObserver thì rely vào window resize
                var size = this._getDisplaySize();
                if (size.width > 0 && size.height > 0) {
                    this._updateCanvasSize(size.width, size.height);
                }
            }
        },

        /**
         * Initialize WebGL resources
         */
        _initWebGLResources: function () {
            var gl = this.gl;
            this.textures = [];
            this.framebuffers = [];

            for (var i = 0; i < 2; i++) {
                var tex = gl.createTexture();
                var fb = gl.createFramebuffer();

                gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
                fb.width = this.resolution;
                fb.height = this.resolution;

                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.resolution, this.resolution, 0, gl.RGBA, gl.FLOAT, null);

                var rb = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.resolution, this.resolution);

                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
                fb.renderbuffer = rb;

                if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    throw new Error('Rendering to this texture is not supported (incomplete framebuffer)');
                }

                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                this.textures.push(tex);
                this.framebuffers.push(fb);
            }

            // Create quad buffer
            this.quad = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1,
                +1, -1,
                +1, +1,
                -1, +1
            ]), gl.STATIC_DRAW);
        },

        /**
         * Load background image
         */
        _loadBackgroundImage: function (backgroundUrl) {
            var that = this;
            var image = new Image();
            image.crossOrigin = '';

            image.onload = function () {
                var gl = that.gl;
                if (!gl) return;

                var wrapping = (isPowerOfTwo(image.width) && isPowerOfTwo(image.height))
                    ? gl.REPEAT
                    : gl.CLAMP_TO_EDGE;

                that.backgroundWidth = image.width;
                that.backgroundHeight = image.height;

                var bgTex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, bgTex);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapping);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapping);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

                that.backgroundTexture = bgTex;
                that._boundaryCache = null;
            };

            image.onerror = function () {
                console.warn('Ripples: failed to load background image:', backgroundUrl);
            };

            image.src = backgroundUrl;
        },

        /**
         * Start animation loop
         */
        _startAnimationLoop: function () {
            var that = this;
            var step = function () {
                if (that._isVisible && that.backgroundTexture) {
                    that.update();
                }
                that._rafId = window.requestAnimationFrame(step);
            };
            this._rafId = window.requestAnimationFrame(step);
        },

        /**
         * Update ripples animation
         */
        update: function () {
            var gl = this.gl;
            if (!gl || !this.backgroundTexture) return;

            this.updateTextures();
            this.render();
        },

        /**
         * Draw quad with given program
         */
        _drawQuadWith: function (program) {
            var gl = this.gl;
            if (!gl || !program) return;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);

            var loc = (program.locations && typeof program.locations.vertex === 'number')
                ? program.locations.vertex
                : 0;

            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        },

        /**
         * Render frame
         */
        render: function () {
            var gl = this.gl;
            if (!gl || !this.renderProgram) return;

            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.useProgram(this.renderProgram.id);

            bindTexture(gl, this.backgroundTexture, 0);
            bindTexture(gl, this.textures[0], 1);

            // Ensure uniforms are initialized
            var uniforms = this.renderProgram.uniforms;
            if (!uniforms.topLeft) {
                uniforms.topLeft = new Float32Array([0, 0]);
            }
            if (!uniforms.bottomRight) {
                uniforms.bottomRight = new Float32Array([1, 1]);
            }
            if (!uniforms.containerRatio) {
                uniforms.containerRatio = new Float32Array([1, 1]);
            }

            gl.uniform2fv(this.renderProgram.locations.topLeft, uniforms.topLeft);
            gl.uniform2fv(this.renderProgram.locations.bottomRight, uniforms.bottomRight);
            gl.uniform2fv(this.renderProgram.locations.containerRatio, uniforms.containerRatio);
            gl.uniform1i(this.renderProgram.locations.samplerBackground, 0);
            gl.uniform1i(this.renderProgram.locations.samplerRipples, 1);

            this._drawQuadWith(this.renderProgram);
        },

        /**
         * Update ripple textures
         */
        updateTextures: function () {
            var gl = this.gl;
            if (!gl) return;

            this.computeTextureBoundaries();

            gl.viewport(0, 0, this.resolution, this.resolution);

            for (var i = 0; i < 2; i++) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[i]);
                bindTexture(gl, this.textures[1 - i], 0);
                gl.useProgram(this.updateProgram[i].id);
                this._drawQuadWith(this.updateProgram[i]);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },

        /**
         * Compute texture boundaries for background mapping
         */
        computeTextureBoundaries: function () {
            var now = Date.now();
            if (this._boundaryCache && (now - this._boundaryCacheTime) < this._boundaryCacheTimeout) {
                var cache = this._boundaryCache;
                this.renderProgram.uniforms.topLeft = cache.topLeft;
                this.renderProgram.uniforms.bottomRight = cache.bottomRight;
                this.renderProgram.uniforms.containerRatio = cache.containerRatio;
                return;
            }

            var backgroundSize = this.$el.css('background-size') || 'cover';
            var backgroundAttachment = this.$el.css('background-attachment') || 'scroll';
            var backgroundPosition = (this.$el.css('background-position') || 'center center').split(' ');

            var parElement = backgroundAttachment === 'fixed' ? $window : this.$el;
            var winOffset = this._getWindowOffset(backgroundAttachment, parElement);
            var winWidth = parElement.outerWidth() || 0;
            var winHeight = parElement.outerHeight() || 0;

            if (!this.backgroundWidth || !this.backgroundHeight ||
                this.backgroundWidth <= 0 || this.backgroundHeight <= 0) {

                var defTopLeft = new Float32Array([0, 0]);
                var defBottomRight = new Float32Array([1, 1]);
                var defRatio = new Float32Array([1, 1]);

                this.renderProgram.uniforms.topLeft = defTopLeft;
                this.renderProgram.uniforms.bottomRight = defBottomRight;
                this.renderProgram.uniforms.containerRatio = defRatio;

                this._boundaryCache = {
                    topLeft: defTopLeft,
                    bottomRight: defBottomRight,
                    containerRatio: defRatio
                };
                this._boundaryCacheTime = now;
                return;
            }

            var bgDimensions = this._calculateBackgroundDimensions(backgroundSize, winWidth, winHeight);
            var bgPosition = this._calculateBackgroundPosition(
                backgroundPosition,
                winOffset,
                winWidth,
                winHeight,
                bgDimensions.width,
                bgDimensions.height
            );

            var elementOffset = this.$el.offset();
            if (!elementOffset) {
                var defTopLeft2 = new Float32Array([0, 0]);
                var defBottomRight2 = new Float32Array([1, 1]);
                var defRatio2 = new Float32Array([1, 1]);

                this.renderProgram.uniforms.topLeft = defTopLeft2;
                this.renderProgram.uniforms.bottomRight = defBottomRight2;
                this.renderProgram.uniforms.containerRatio = defRatio2;

                this._boundaryCache = {
                    topLeft: defTopLeft2,
                    bottomRight: defBottomRight2,
                    containerRatio: defRatio2
                };
                this._boundaryCacheTime = now;
                return;
            }

            var elWidth = this.$el.outerWidth() || 0;
            var elHeight = this.$el.outerHeight() || 0;

            if (bgDimensions.width <= 0 || bgDimensions.height <= 0 ||
                elWidth <= 0 || elHeight <= 0) {

                var defTopLeft3 = new Float32Array([0, 0]);
                var defBottomRight3 = new Float32Array([1, 1]);
                var defRatio3 = new Float32Array([1, 1]);

                this.renderProgram.uniforms.topLeft = defTopLeft3;
                this.renderProgram.uniforms.bottomRight = defBottomRight3;
                this.renderProgram.uniforms.containerRatio = defRatio3;

                this._boundaryCache = {
                    topLeft: defTopLeft3,
                    bottomRight: defBottomRight3,
                    containerRatio: defRatio3
                };
                this._boundaryCacheTime = now;
                return;
            }

            var topLeft = new Float32Array([
                (elementOffset.left - bgPosition.x) / bgDimensions.width,
                (elementOffset.top - bgPosition.y) / bgDimensions.height
            ]);

            var bottomRight = new Float32Array([
                topLeft[0] + elWidth / bgDimensions.width,
                topLeft[1] + elHeight / bgDimensions.height
            ]);

            var maxSide = Math.max(this.canvas.width, this.canvas.height);
            if (maxSide <= 0) {
                maxSide = 1;
            }

            var containerRatio = new Float32Array([
                this.canvas.width / maxSide,
                this.canvas.height / maxSide
            ]);

            this.renderProgram.uniforms.topLeft = topLeft;
            this.renderProgram.uniforms.bottomRight = bottomRight;
            this.renderProgram.uniforms.containerRatio = containerRatio;

            this._boundaryCache = {
                topLeft: topLeft,
                bottomRight: bottomRight,
                containerRatio: containerRatio
            };
            this._boundaryCacheTime = now;
        },

        /**
         * Get window offset
         */
        _getWindowOffset: function (backgroundAttachment, parElement) {
            if (backgroundAttachment === 'fixed') {
                return {
                    left: window.pageXOffset || 0,
                    top: window.pageYOffset || 0
                };
            }
            var elOffset = parElement.offset();
            return elOffset || { left: 0, top: 0 };
        },

        /**
         * Calculate background dimensions
         */
        _calculateBackgroundDimensions: function (backgroundSize, winWidth, winHeight) {
            var backgroundWidth, backgroundHeight, scale;

            if (backgroundSize === 'cover') {
                scale = Math.max(winWidth / this.backgroundWidth, winHeight / this.backgroundHeight);
                backgroundWidth = this.backgroundWidth * scale;
                backgroundHeight = this.backgroundHeight * scale;
            } else if (backgroundSize === 'contain') {
                scale = Math.min(winWidth / this.backgroundWidth, winHeight / this.backgroundHeight);
                backgroundWidth = this.backgroundWidth * scale;
                backgroundHeight = this.backgroundHeight * scale;
            } else {
                var sizeParts = backgroundSize.split(' ');
                backgroundWidth = sizeParts[0];
                backgroundHeight = sizeParts[1] || sizeParts[0];

                if (backgroundWidth.endsWith('%')) {
                    backgroundWidth = winWidth * parseFloat(backgroundWidth) / 100;
                } else if (backgroundWidth === 'auto') {
                    backgroundWidth = this.backgroundWidth;
                } else {
                    backgroundWidth = parseFloat(backgroundWidth);
                }

                if (backgroundHeight.endsWith('%')) {
                    backgroundHeight = winHeight * parseFloat(backgroundHeight) / 100;
                } else if (backgroundHeight === 'auto') {
                    backgroundHeight = this.backgroundHeight;
                } else {
                    backgroundHeight = parseFloat(backgroundHeight);
                }
            }

            return {
                width: backgroundWidth || 1,
                height: backgroundHeight || 1
            };
        },

        /**
         * Calculate background position
         */
        _calculateBackgroundPosition: function (backgroundPosition, winOffset, winWidth, winHeight, backgroundWidth, backgroundHeight) {
            var backgroundX = backgroundPosition[0];
            var backgroundY = backgroundPosition[1] || 'center';

            if (backgroundX === 'left') {
                backgroundX = winOffset.left;
            } else if (backgroundX === 'center') {
                backgroundX = winOffset.left + winWidth / 2 - backgroundWidth / 2;
            } else if (backgroundX === 'right') {
                backgroundX = winOffset.left + winWidth - backgroundWidth;
            } else if (backgroundX.endsWith('%')) {
                backgroundX = winOffset.left + (winWidth - backgroundWidth) * parseFloat(backgroundX) / 100;
            } else {
                backgroundX = parseFloat(backgroundX);
            }

            if (backgroundY === 'top') {
                backgroundY = winOffset.top;
            } else if (backgroundY === 'center') {
                backgroundY = winOffset.top + winHeight / 2 - backgroundHeight / 2;
            } else if (backgroundY === 'bottom') {
                backgroundY = winOffset.top + winHeight - backgroundHeight;
            } else if (backgroundY.endsWith('%')) {
                backgroundY = winOffset.top + (winHeight - backgroundHeight) * parseFloat(backgroundY) / 100;
            } else {
                backgroundY = parseFloat(backgroundY);
            }

            return { x: backgroundX, y: backgroundY };
        },

        /**
         * Initialize shaders
         */
        initShaders: function () {
            var gl = this.gl;

            var vertexShaderSrc = [
                'attribute vec2 vertex;',
                'varying vec2 coord;',
                'void main() {',
                '  coord = vertex * 0.5 + 0.5;',
                '  gl_Position = vec4(vertex, 0.0, 1.0);',
                '}'
            ].join('\n');

            // Drop program
            this.dropProgram = createProgram(gl, vertexShaderSrc, [
                'precision highp float;',
                'const float PI = 3.141592653589793;',
                'uniform sampler2D texture;',
                'uniform vec2 center;',
                'uniform float radius;',
                'uniform float strength;',
                'varying vec2 coord;',
                'void main() {',
                '  vec4 info = texture2D(texture, coord);',
                '  float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);',
                '  drop = 0.5 - cos(drop * PI) * 0.5;',
                '  info.r += drop * strength;',
                '  gl_FragColor = info;',
                '}'
            ].join('\n'));

            // Update programs
            this.updateProgram = [];

            this.updateProgram[0] = createProgram(gl, vertexShaderSrc, [
                'precision highp float;',
                'uniform sampler2D texture;',
                'uniform vec2 delta;',
                'varying vec2 coord;',
                'void main() {',
                '  vec4 info = texture2D(texture, coord);',
                '  vec2 dx = vec2(delta.x, 0.0);',
                '  vec2 dy = vec2(0.0, delta.y);',
                '  float average = (',
                '    texture2D(texture, coord - dx).r +',
                '    texture2D(texture, coord - dy).r +',
                '    texture2D(texture, coord + dx).r +',
                '    texture2D(texture, coord + dy).r',
                '  ) * 0.25;',
                '  info.g += (average - info.r) * 2.0;',
                '  info.g *= 0.98;',
                '  info.r += info.g;',
                '  gl_FragColor = info;',
                '}'
            ].join('\n'));
            gl.useProgram(this.updateProgram[0].id);
            gl.uniform2fv(this.updateProgram[0].locations.delta, this.textureDelta);

            this.updateProgram[1] = createProgram(gl, vertexShaderSrc, [
                'precision highp float;',
                'uniform sampler2D texture;',
                'uniform vec2 delta;',
                'varying vec2 coord;',
                'void main() {',
                '  vec4 info = texture2D(texture, coord);',
                '  vec3 dx = vec3(delta.x, texture2D(texture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);',
                '  vec3 dy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);',
                '  info.ba = normalize(cross(dy, dx)).xz;',
                '  gl_FragColor = info;',
                '}'
            ].join('\n'));
            gl.useProgram(this.updateProgram[1].id);
            gl.uniform2fv(this.updateProgram[1].locations.delta, this.textureDelta);

            // Render program
            this.renderProgram = createProgram(gl, [
                'precision highp float;',
                'attribute vec2 vertex;',
                'uniform vec2 topLeft;',
                'uniform vec2 bottomRight;',
                'uniform vec2 containerRatio;',
                'varying vec2 ripplesCoord;',
                'varying vec2 backgroundCoord;',
                'void main() {',
                '  backgroundCoord = mix(topLeft, bottomRight, vertex * 0.5 + 0.5);',
                '  backgroundCoord.y = 1.0 - backgroundCoord.y;',
                '  ripplesCoord = vec2(vertex.x, -vertex.y) * containerRatio * 0.5 + 0.5;',
                '  gl_Position = vec4(vertex.x, -vertex.y, 0.0, 1.0);',
                '}'
            ].join('\n'), [
                'precision highp float;',
                'uniform sampler2D samplerBackground;',
                'uniform sampler2D samplerRipples;',
                'uniform float perturbance;',
                'varying vec2 ripplesCoord;',
                'varying vec2 backgroundCoord;',
                'void main() {',
                '  vec2 offset = -texture2D(samplerRipples, ripplesCoord).ba;',
                '  float specular = pow(max(0.0, dot(offset, normalize(vec2(-0.6, 1.0)))), 4.0);',
                '  gl_FragColor = texture2D(samplerBackground, backgroundCoord + offset * perturbance) + specular;',
                '}'
            ].join('\n'));
            gl.useProgram(this.renderProgram.id);
            gl.uniform1f(this.renderProgram.locations.perturbance, this.perturbance);

            // Initialize uniforms with default values
            this.renderProgram.uniforms.topLeft = new Float32Array([0, 0]);
            this.renderProgram.uniforms.bottomRight = new Float32Array([1, 1]);
            this.renderProgram.uniforms.containerRatio = new Float32Array([1, 1]);
        },

        /**
         * Create drop at mouse position
         */
        dropAtMouse: function (e, radius, strength) {
            var gl = this.gl;
            if (!gl) return;

            var elOffset = this.$el.offset();
            if (!elOffset) return;

            // Normalize event offset
            var offsetX = (e.offsetX !== undefined) ? e.offsetX : (e.pageX - elOffset.left);
            var offsetY = (e.offsetY !== undefined) ? e.offsetY : (e.pageY - elOffset.top);

            var elWidth = this.$el.outerWidth();
            var elHeight = this.$el.outerHeight();
            var longestSide = Math.max(elWidth, elHeight);
            if (longestSide <= 0) return;

            var dropPosition = new Float32Array([
                (2 * offsetX - elWidth) / longestSide,
                (elHeight - 2 * offsetY) / longestSide
            ]);

            gl.viewport(0, 0, this.resolution, this.resolution);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0]);
            bindTexture(gl, this.textures[1], 0);

            gl.useProgram(this.dropProgram.id);
            gl.uniform2fv(this.dropProgram.locations.center, dropPosition);
            gl.uniform1f(this.dropProgram.locations.radius, radius);
            gl.uniform1f(this.dropProgram.locations.strength, strength);

            this._drawQuadWith(this.dropProgram);

            // Swap buffers
            var tFb = this.framebuffers[0];
            this.framebuffers[0] = this.framebuffers[1];
            this.framebuffers[1] = tFb;

            var tTex = this.textures[0];
            this.textures[0] = this.textures[1];
            this.textures[1] = tTex;

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        },

        /**
         * Mouse move handler
         */
        mousemove: function (e) {
            var now = (window.performance && performance.now) ? performance.now() : Date.now();
            if (now - this._lastDropTime < this._minDropInterval) return;
            this._lastDropTime = now;
            this.dropAtMouse(e, 0.03, 0.01);
        },

        /**
         * Mouse down handler
         */
        mousedown: function (e) {
            this.dropAtMouse(e, 0.09, 0.14);
        },

        /**
         * Cleanup and destroy instance
         */
        destroy: function () {
            // Cancel animation frame
            if (this._rafId) {
                window.cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }

            // Clear resize timer
            if (this._resizeTimer) {
                clearTimeout(this._resizeTimer);
                this._resizeTimer = null;
            }

            // Remove event listeners
            $window.off('resize.ripples', this._onResize);
            this.$el.off('.ripples');

            // Disconnect intersection observer
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }

            // Disconnect resize observer
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }

            // Clear cache
            this._boundaryCache = null;

            // Cleanup WebGL resources
            if (this.gl) {
                var gl = this.gl;

                if (this.textures) {
                    for (var i = 0; i < this.textures.length; i++) {
                        if (this.textures[i]) {
                            gl.deleteTexture(this.textures[i]);
                        }
                    }
                }

                if (this.framebuffers) {
                    for (var j = 0; j < this.framebuffers.length; j++) {
                        if (this.framebuffers[j]) {
                            if (this.framebuffers[j].renderbuffer) {
                                gl.deleteRenderbuffer(this.framebuffers[j].renderbuffer);
                            }
                            gl.deleteFramebuffer(this.framebuffers[j]);
                        }
                    }
                }

                if (this.backgroundTexture) {
                    gl.deleteTexture(this.backgroundTexture);
                }

                if (this.quad) {
                    gl.deleteBuffer(this.quad);
                }

                if (this.dropProgram && this.dropProgram.id) {
                    gl.deleteProgram(this.dropProgram.id);
                }

                if (this.updateProgram) {
                    for (var k = 0; k < this.updateProgram.length; k++) {
                        if (this.updateProgram[k] && this.updateProgram[k].id) {
                            gl.deleteProgram(this.updateProgram[k].id);
                        }
                    }
                }

                if (this.renderProgram && this.renderProgram.id) {
                    gl.deleteProgram(this.renderProgram.id);
                }

                this.gl = null;
            }

            // Remove canvas
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }

            // Remove class and data
            this.$el.removeClass('ripples');
            this.$el.removeData('ripples');
        }
    };

    // =========================
    //  jQuery PLUGIN
    // =========================

    var old = $.fn.ripples;

    $.fn.ripples = function (option) {
        var args = Array.prototype.slice.call(arguments, 1);

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('ripples');

            if (typeof option === 'string') {
                // Gọi method: $('.el').ripples('destroy');
                if (data && typeof data[option] === 'function') {
                    data[option].apply(data, args);
                }
                return;
            }

            if (!supportsWebGL) {
                if (window.console) {
                    console.warn('Ripples: WebGL / float textures not supported in this browser.');
                }
                return;
            }

            if (!data) {
                var options = $.extend({}, Ripples.DEFAULTS, $this.data(), typeof option === 'object' && option);
                var instance = new Ripples(this, options);
                if (!instance._failed) {
                    $this.data('ripples', instance);
                }
            }
        });
    };

    $.fn.ripples.Constructor = Ripples;

    $.fn.ripples.noConflict = function () {
        $.fn.ripples = old;
        return this;
    };

    // =========================
    //  AUTO INIT
    // =========================

    function destroyRipples($scope, onlyDuplicates) {
        var $target = $scope ? $scope.find('.hover-imge-ripple') : $('.hover-imge-ripple');
        $target.each(function () {
            var $el = $(this);
            var $slide = $el.closest('.pxl-swiper-slide, .swiper-slide');
            if (onlyDuplicates && (!$slide.length || !$slide.hasClass('swiper-slide-duplicate'))) {
                return;
            }
            var existingRipples = $el.data('ripples');
            if (existingRipples && typeof existingRipples.destroy === 'function') {
                try {
                    existingRipples.destroy();
                } catch (e) { }
            }
        });
    }

    function cleanupInvisibleDuplicates($scope) {
        var $target = $scope ? $scope.find('.hover-imge-ripple') : $('.hover-imge-ripple');
        $target.each(function () {
            var $el = $(this);
            var $slide = $el.closest('.pxl-swiper-slide, .swiper-slide');
            if ($slide.length && $slide.hasClass('swiper-slide-duplicate') && !$slide.hasClass('swiper-slide-visible')) {
                var existingRipples = $el.data('ripples');
                if (existingRipples && typeof existingRipples.destroy === 'function') {
                    try {
                        existingRipples.destroy();
                    } catch (e) { }
                }
            }
        });
    }

    function initRipples($scope, forceReinit) {
        var isMobile = window.matchMedia
            ? window.matchMedia('(max-width: 767px)').matches
            : (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) <= 767;
        if (isMobile) return;

        var $target = $scope ? $scope.find('.hover-imge-ripple') : $('.hover-imge-ripple');
        $target.each(function () {
            var $el = $(this);
            var $slide = $el.closest('.pxl-swiper-slide, .swiper-slide');
            var isDuplicate = $slide.length && $slide.hasClass('swiper-slide-duplicate');
            var isVisible = $slide.length && $slide.hasClass('swiper-slide-visible');
            var isInSwiper = $slide.length > 0;

            if (isDuplicate && !isVisible) return;

            if (!isInSwiper) {
                if (!$el.is(':visible') || $el.outerWidth() === 0 || $el.outerHeight() === 0) return;
            } else if (isDuplicate) {
                if ($el.outerWidth() === 0 || $el.outerHeight() === 0) return;
            } else {
                // Regular slides in Swiper: allow init even without dimensions on first load
                // Ripples will handle resize via ResizeObserver
                if (!$el.length || !$el[0].parentNode) return;
                // Don't check dimensions for regular slides - allow init and let ResizeObserver handle it
            }

            var existingRipples = $el.data('ripples');

            // Fix for Swiper loop/cloned slides:
            // If there's no data instance but we see artifacts (class or canvas), it's a "zombie" clone. Clean it up.
            if (!existingRipples) {
                if ($el.hasClass('ripples') || $el.find('canvas').length > 0) {
                    $el.removeClass('ripples');
                    $el.find('canvas').remove();
                }
            }

            if (forceReinit && existingRipples && typeof existingRipples.destroy === 'function') {
                try {
                    existingRipples.destroy();
                } catch (e) { }
                existingRipples = null;
            }

            if (!existingRipples) {
                var imageUrl = $el.attr('data-image-url');
                if (!imageUrl) {
                    var cssBg = $el.css('background-image') || '';
                    var match = /url\(["']?([^"']*)["']?\)/.exec(cssBg);
                    if (match && match[1]) {
                        imageUrl = match[1];
                    }
                }
                if (imageUrl) {
                    try {
                        $el.ripples({
                            resolution: 256,
                            perturbance: 0.035,
                            minDropInterval: 16,
                            imageUrl: imageUrl
                        });
                    } catch (e) { }
                }
            }
        });
    }

    window.initRipples = initRipples;
    window.destroyRipples = destroyRipples;
    window.cleanupInvisibleDuplicates = cleanupInvisibleDuplicates;

    $(document).ready(function () {
        initRipples();
        setTimeout(initRipples, 300);
    });

    $(window).on('load', function () {
        setTimeout(initRipples, 100);
        setTimeout(initRipples, 300);
        setTimeout(initRipples, 600);
    });

    $(window).on('beforeunload', function () {
        destroyRipples();
    });

})(jQuery);
