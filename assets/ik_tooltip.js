;(function ( $, window, document, undefined ) {
 
	var pluginName = 'ik_tooltip',
		defaults = {
			'position': 'top'
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 * @param {number} [options.position='top'] - Tooltip location (currently supports only top).
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options);

		// If the tooltip is last invoked when the trigger element receives focus, then it
		// is dismissed when it no longer has focus (onBlur). If the tooltip is last invoked
		// with mouseIn then it is dismissed with on mouseOut.
		this.triggeredFromMouse = false;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, $elem, $tooltip, tip, plugin;

		id = 'tip' + $('.ik_tooltip').length; // generate unique id
		
		$elem = this.element;
		tip = $elem.attr('title'); // get text from element title attribute (required)
        plugin = this;
		
		if(tip.length > 0) {
			
			$tooltip = $('<span/>') // create tooltip
				.text(tip)
				.addClass('ik_tooltip')
				.attr({
					'id': id,
					'role': 'tooltip',
					'aria-hidden': 'true',
					'aria-live': 'polite' // aria-live intentionally used instead of aria-described due to announcement issues in Chrome
				});
			
			$elem
                .attr('tabindex', 0)
				.css('position', 'relative')
				.removeAttr('title') // remove title to prevent it from being read
				.after($tooltip)
				.on('mouseover', function(event) {
                    this.triggeredFromMouse = true;
                    plugin.showTooltip($elem, $tooltip, event);
				})
                .on('focus', function(event) {
                    this.triggeredFromMouse = false;
                    plugin.showTooltip($elem, $tooltip, event);
                })
				.on('mouseout', function() {
					if (this.triggeredFromMouse) {
						plugin.hideTooltip($tooltip);
					}
				})
				.on('blur', function () {
                    if (!this.triggeredFromMouse) {
                        plugin.hideTooltip($tooltip);
					}
                })
                .on('keydown', function(event) {
                    if(event.keyCode === ik_utils.keys.esc) { // hide when escape key is pressed
                        plugin.hideTooltip($tooltip);
                    }
                });
		}
	};

    Plugin.prototype.showTooltip = function ($elem, $tooltip, event) {

        var y, x;

        y = $elem.position().top - $tooltip.height() - 20;
        x = $elem.position().left;

        if(!$elem.is(':focus')) { // remove focus from a focused element
            $(':focus').blur();
        }

        $('.ik_tooltip').removeClass('mouseover'); // remove mouseover class from all tooltips

        if (event.type === 'mouseover') {
            $tooltip.addClass('mouseover'); // add mouseover class when mouse moves over the current element
        }

		$tooltip // position and show tooltip
			.css({
				'top': y,
				'left': x
			})
			.addClass('visible')
			.attr('aria-hidden', 'false');
    };

    Plugin.prototype.hideTooltip = function ($tooltip) {

        $tooltip
            .removeClass('visible mouseover')
            .attr('aria-hidden', 'true');

    };

	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );