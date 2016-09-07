/**
 * LBS SPA(Scroll Page Animation)
 * Date: 2016-3-16
 * ===================================================
 * opts.spaClass 要动画的元素的类名 默认 'spa' (通过这个类名选择要动画的元素)
 * opts.activeClass 激活动画的类名(当元素在视口中时) 默认: 'animated'
 * opts.disable 是否禁用对(不支持transition过度 不支持animation动画)的浏览器支持
 		 默认true (禁用：true 不禁用：false) (禁用后不会绑定事件 不会激活类名) 	
 * opts.unbind 当所有动画元素都激活时，是否解除事件的绑定
 		默认true (解绑：true 不解绑：false)	(解绑后add方法增加的动画元素不能监听)
 * opts.visible 初始化时元素是否可见(opacity) 默认false (可见：true 不可见：false) 
 * opts.delay 防抖的延迟时间 默认100(ms) 
 * opts.onLoad 当视口中动画元素激活时执行函数(已激活则忽略)
 * opts.onEnd 当所有动画元素都激活时执行函数
 * ===================================================
 * this.start() 开始方法 1.实例化开始监听 2.增加元素后可再次监听
 * this.add(el) 增加一个需要动画的元素或者元素集
   (增加元素后 调用start方法开始监听 当该元素在视口中时会激活动画类名) 
 * ===================================================
 * 元素标签 设置 (data-animate="classname") 
 	当前标签激活动画类名为 classname 不是全局的 activeClass
 * ===================================================
 * IE6789 不支持transition过度 不支持animation动画 
 * 当不禁用时(disable为false) 可以绑定事件并可增加类名
 * ===================================================
 **/

(function(window, document) {
	'use strict';

	var utils = (function() {
		var d = document,
			doc = d.documentElement,
			body = d.body,

			supportCss = function(property) {
				var style = d.createElement('div').style,
					toHumb = function(str) {
						return str.replace(/-\D/g, function(match) {
							return match.charAt(1).toUpperCase();
						});
					};
				if (toHumb(property) in style) return true;
				var prefix = ['webkit', 'Moz', 'ms', 'O'],
					i = 0,
					l = prefix.length,
					s = '';
				for (; i < l; i++) {
					s = prefix[i] + '-' + property;
					if (toHumb(s) in style) return true;
				}
				return false;
			},

			offset = function(el) {
				var rect = el.getBoundingClientRect(),
					clientTop = doc.clientTop || body.clientTop || 0,
					clientLeft = doc.clientLeft || body.clientLeft || 0,
					width = rect.width,
					height = rect.height,
					left = rect.left + (self.pageXOffset || doc.scrollLeft || body.scrollLeft) - clientLeft,
					top = rect.top + (self.pageYOffset || doc.scrollTop || body.scrollTop) - clientTop;
				return {
					left: left,
					top: top,
					width: width,
					height: height
				};
			},

			scroll = function() {
				var left = doc.scrollLeft || body.scrollLeft,
					top = doc.scrollTop || body.scrollTop;
				if (d.compatMode != 'CSS1Compat') {
					left = body.scrollLeft;
					top = body.scrollTop;
				}
				return {
					left: left,
					top: top
				};
			},

			size = function() {
				var width = doc.clientWidth || body.clientWidth,
					height = doc.clientHeight || body.clientHeight;
				if (d.compatMode != 'CSS1Compat') {
					width = body.clientWidth;
					height = body.clientHeight;
				}
				return {
					width: width,
					height: height
				};
			},

			on = function(el, type, handler) {
				if (el.addEventListener) return el.addEventListener(type, handler, false);
				return el.attachEvent('on' + type, handler);
			},

			off = function(el, type, handler) {
				if (el.removeEventListener) return el.removeEventListener(type, handler, false);
				return el.detachEvent('on' + type, handler);
			},

			addEvents = function(el, types, handler) {
				for (var i = 0, l = types.length; i < l; i++) {
					on(el, types[i], handler);
				}
			},

			animateEnd = function(el, fn) {
				addEvents(el, [
					'webkitAnimationEnd', 'mozAnimationEnd', 'MSAnimationEnd', 'oanimationend', 'animationend',
					'webkitTransitionEnd', 'MSTransitionEnd', 'oTransitionEnd', 'transitionend'
				], function() {
					fn && fn();
				});
			},

			hasClass = function(el, name) {
				return (' ' + el.className + ' ').indexOf(' ' + name + ' ') > -1;
			},

			addClass = function(el, name) {
				if (!hasClass(el, name)) el.className += ' ' + name;
			},

			removeClass = function(el, name) {
				if (hasClass(el, name)) el.className = el.className.replace(new RegExp('(\\s|^)' + name + '(\\s|$)'), '');
			},

			getClass = function(name, node) {
				if (document.getElementsByClassName) return (node || document).getElementsByClassName(name);
				var elements = [],
					reg = new RegExp('(^| )' + name + '( |$)'),
					nodes = (node || document).getElementsByTagName('*'),
					i = 0,
					l = nodes.length;
				for (; i < l; i++) {
					if (reg.test(nodes[i].className)) elements.push(nodes[i]);
				}
				return elements;
			};

		return {
			supportCss: supportCss,
			offset: offset,
			scroll: scroll,
			size: size,
			on: on,
			off: off,
			animateEnd: animateEnd,
			addClass: addClass,
			removeClass: removeClass,
			getClass: getClass
		};
	}());

	var SPA = function(opts) {
		opts = opts || {};
		this.nodes = utils.getClass(opts.spaClass || 'spa');
		this.activeClass = opts.activeClass || 'animated';
		this.unbind = opts.unbind === false ? false : true;
		this.disable = opts.disable === false ? false : true;
		this.support = !!(utils.supportCss('transition') && utils.supportCss('animation'));
		this.enable = this.support ? true : false;
		if (this.disable === false) this.enable = true;
		this.visible = opts.visible || false;
		this.delay = opts.delay || 100;
		this.data = [];
		this.count = 0;
		this.onLoad = opts.onLoad || function() {};
		this.onEnd = opts.onEnd || function() {};
		this._init();
	};
	SPA.prototype = {
		_init: function() {
			if (!this.enable) return;
			this._set();
			this._fix();
			this._bind();
		},
		_set: function() {
			var node, i = 0,
				l = this.nodes.length;
			if (l < 1) return;
			for (; i < l; i++) {
				node = this.nodes[i];
				!this.visible && this._hide(node);
				this.data.push({
					node: node,
					loaded: false,
					animate: node.getAttribute('data-animate') || ''
				});
			}
			this.count = this.data.length;
		},
		_fix: function() {
			this._scroll();
			this._size();
		},
		_scroll: function() {
			var scroll = utils.scroll();
			this.scrollX = scroll.left;
			this.scrollY = scroll.top;
		},
		_size: function() {
			var size = utils.size();
			this.wWidth = size.width;
			this.wHeight = size.height;
		},
		_bind: function() {
			var _this = this,
				_change = function(e) {
					var evt = e || window.event,
						type = evt.type;
					if (_this.count < 1) {
						if (!_this.unbind) return;
						utils.off(window, 'scroll', _change);
						utils.off(window, 'resize', _change);
						_this.onEnd && _this.onEnd();
						return;
					}
					_this.timer && clearTimeout(_this.timer);
					_this.timer = setTimeout(function() {
						if (type == 'resize') _this._size();
						if (type == 'scroll') _this._scroll();
						_this._check();
					}, _this.delay);
				};
			utils.on(window, 'resize', _change);
			utils.on(window, 'scroll', _change);
		},
		_check: function() {
			if (this.count < 1) return;
			var spa, i = 0,
				l = this.data.length;
			for (; i < l; i++) {
				if (!this.data[i].rect) this.data[i].rect = utils.offset(this.data[i].node);
				spa = this.data[i];
				if (spa.loaded) continue;
				if (this._visible(spa.rect)) {
					this._show(spa.node);
					spa.animate != '' ? utils.addClass(spa.node, spa.animate) : utils.addClass(spa.node, this.activeClass);
					spa.loaded = true;
					this.count--;
					this.onLoad && this.onLoad(spa.node);
				}
			}
		},
		_visible: function(rect) {
			var ex = rect.left,
				ey = rect.top,
				ew = ex + rect.width,
				eh = ey + rect.height,
				sx = this.scrollX,
				sy = this.scrollY,
				sw = sx + this.wWidth,
				sh = sy + this.wHeight;
			return ((ex < sw && ew > sx) && (ey < sh && eh > sy));
		},
		_show: function(el) {
			if (!this.support) return;
			el.style.opacity = 1;
		},
		_hide: function(el) {
			if (!this.support) return;
			el.style.opacity = 0;
		},
		_add: function(el) {
			this.data.push({
				node: el,
				loaded: false,
				animate: node.getAttribute('data-animate') || '',
				rect: utils.offset(el)
			});
		},
		add: function(el) {
			if (el.length && el.length > 0) {
				for (var i = 0, l = el.length; i < l; i++) {
					this._add(el[i]);
					this.count++;
				}
			} else {
				this._add(el);
				this.count++;
			}
			return this;
		},
		start: function() {
			if (!this.enable) return;
			this._check();
		}
	};
	if (typeof define === 'function' && (define.amd || define.cmd)) {
		define('SPA', [], function() {
			return SPA;
		});
	} else {
		window.SPA = SPA;
	}
})(window, document);