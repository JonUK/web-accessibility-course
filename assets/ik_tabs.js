;(function ( $, window, document, undefined ) {
	 
	var pluginName = 'ik_tabs',
		defaults = {
			tabLocation: 'top',
			selectedIndex: 0
		};
	
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 * @param {number} [options.tabLocation='top'] - Tab location (currently supports only top).
	 * @param {number} [options.selectedIndex] - Initially selected tab.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, $elem, $tabbar;
		
		var plugin = this;
		id = 'tabs' + $('.ik_tabs').length; // create unique id
		$elem = this.element.addClass('ik_tabs');
		
		$tabbar = $('<ul/>') // create ul element to hold all tabs
			.addClass('ik_tabbar cf')
			.attr({
				'role': 'tablist'
			})
			.prependTo($elem);
		
		plugin.panels = $elem // initialize panels and create tabs
			.children('div')
			.each( function(i, el) {
				
				var $tab, $panel, lbl;
				var panelId = id + '_panel' + i;
				
				$panel = $(el).attr({
					'id': panelId,  // Add unique id for a panel
					'role': 'tabpanel',
					'aria-hidden': 'true', // Initially hide the panel
					'tabindex': 0 // Allow the panel to receive focus
				})
				.addClass('ik_tabpanel')
				.hide();
				
				lbl = $panel.attr('title'); // get tab label from panel title
				
				$panel.removeAttr('title');
				
				$tab = $('<li/>').attr({
					'id': id + '_tab' + i, // Create unique id for a tab
					'role': 'tab',
					'aria-controls': panelId
				})
				.text(lbl > '' ? lbl : 'Tab ' + (i + 1))
				.on('click', {'plugin': plugin, 'index': i}, plugin.selectTab) // Add mouse event handler
				.on('keydown', {'plugin': plugin, 'index': i}, plugin.onKeyDown) // Add keyboard event handler
				.appendTo($tabbar);
			});
		
		plugin.tabs = $tabbar.find('li');
		
		plugin.selectTab({ // select a pre-defined tab / panel 
			data:{
				'plugin': plugin, 
				'index': plugin.options.selectedIndex
			}
		});
	};
	
	/** 
	 * Selects specified tab.
	 * 
	 * @param {Object} [event] - Keyboard event (optional).
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 * @param {object} event.data.index - Index of a tab to be selected.
	 */
	Plugin.prototype.selectTab = function (event) {

		var plugin = event.data.plugin, 
			ind = event.data.index, 
			$tabs, 
			$panels;
		
		var $elem = plugin.element;
		$tabs = plugin.tabs;
		$panels = plugin.panels;
		
		$tabs // deselect all tabs
			.removeClass('selected')
			.attr({
				'aria-selected': 'false',
				'tabindex': -1
			})
			.blur();
		
		$($tabs[ind]) // select specified tab
			.addClass('selected')
			.attr({
				'aria-selected': 'true',
				'tabindex': 0
			});

        $($tabs[ind]).focus(); // move focus to current tab if reached by mouse or keyboard
		
		$panels // hide all panels
			.attr('aria-hidden', 'true')
			.hide(); 
		
		$($panels[ind]) // show current panel
            .attr('aria-hidden', 'false')
			.show();
	};

    /**
     * Handles keydown event on header button.
     *
     * @param {Object} event - Keyboard event.
     * @param {object} event.data - Event data.
     * @param {object} event.data.plugin - Reference to plugin.
     */
    Plugin.prototype.onKeyDown = function (event) {
        var plugin = event.data.plugin,
            ind = event.data.index,
            $tabs,
            $panels,
            next;

        var $elem = plugin.element;
        $tabs = plugin.tabs;
        $panels = plugin.panels;

        switch (event.keyCode) {
            case ik_utils.keys.left:
            case ik_utils.keys.up:
                next = ind > 0 ? --ind : 0;
                plugin.selectTab({data:{'plugin': plugin, 'index': next}});
                break;
            case ik_utils.keys.right:
            case ik_utils.keys.down:
                next = ind < $tabs.length - 1 ? ++ind : $tabs.length - 1;
                plugin.selectTab({data:{'plugin': plugin, 'index': next}});
                break;
            case ik_utils.keys.space:
                event.preventDefault();
                event.stopPropagation();
                return false;
        }
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