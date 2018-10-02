;(function ($) {

var pluginName = "ik_suggest",
	defaults = {
        'instructions': "As you start typing the application might suggest similar search terms. Use up and down arrow keys to select a suggested search string.",
		'minLength': 2,
		'maxResults': 10,
		'source': []
	};

	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} options - Configuration options.
	 * @param {string} options.instructions - Custom instructions for screen reader users.
	 * @param {number} options.minLength - Minimum string length before sugestions start showing.
	 * @param {number} options.maxResults - Maximum number of shown suggestions.
	 */
	function Plugin( element, options ) {

		this.element = $(element);
		this.options = $.extend( {}, defaults, options);
		this.suggestionsListVisible = false;
		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	/** Initializes plugin. */
	Plugin.prototype.init = function () {

        var $elem, plugin, instructionsId, suggestionsListId;

        plugin = this;
        instructionsId = this.element.attr('id') + 'Instructions';
        suggestionsListId = this.element.attr('id') + 'SuggestionsList';

        $elem = this.element
            .attr({
                'autocomplete': 'off',
                'aria-expanded': 'false',
				'aria-haspopup': 'listbox',
                'aria-autocomplete': 'list',
                'aria-controls': suggestionsListId,
                'aria-describedby': instructionsId
            })
            .wrap('<span class="ik_suggest"></span>')
            .on('keydown', {'plugin': plugin}, plugin.onKeyDown) // add keydown event
            .on('keyup', {'plugin': plugin}, plugin.onKeyUp) // add keyup event
            .on('focus', {'plugin': plugin}, plugin.onFocus)  // add focus event
			.on('focusout', {'plugin': plugin}, plugin.onFocusOut);  // add focusout event

        plugin.notify = $('<div/>') // Add hidden live region to be used by screen readers
            .addClass('ik_readersonly')
            .attr({
                'id': instructionsId,
                'role': 'region',
                'aria-live': 'polite'
            });

		this.list = $('<ul/>')
			.addClass('suggestions')
            .attr({
				'id': suggestionsListId,
                'role': 'listbox'
            });

		$elem.after(this.notify, this.list);

	};

    /**
     * Handles keydown event on text field.
     *
     * @param {object} event - Keyboard event.
     * @param {object} event.data - Event data.
     * @param {object} event.data.plugin - Reference to plugin.
     */
    Plugin.prototype.onKeyDown = function (event) {

        var selected, msg;
        var plugin = event.data.plugin;
        var $me = $(event.currentTarget);

        switch (event.keyCode) {

            case ik_utils.keys.esc: // Hide the suggestions list and clear the textbox
                plugin.hideSuggestionsList();
                $me.val(null);
                return; // Nothing else to do in this function

            case ik_utils.keys.tab: // Hide the suggestions list (don't clear the textbox)
                plugin.hideSuggestionsList();
                return; // Nothing else to do in this function

            case ik_utils.keys.enter:
                selected = plugin.list.find('.selected');
                plugin.element.val( selected.text() ); // Set text field value to the selected option
                plugin.hideSuggestionsList();
                return; // Nothing else to do in this function

            case ik_utils.keys.down: // Select next suggestion from list

                selected = plugin.list.find('.selected');

                if(selected.length && selected.next().length) { // Item is selected and not last item
                    msg = selected.removeClass('selected').next().addClass('selected').text();
                } else if (selected.length) { // Last item is selected
                    selected.removeClass('selected');
                    msg = plugin.list.find('li:first').addClass('selected').text();
                } else { // No item is selected
                    msg = plugin.list.find('li:first').addClass('selected').text();
                }

                plugin.notify.text(msg); // add suggestion text to live region to be read by screen reader

                event.preventDefault(); // Prevent the cursor from being moved in the textbox
                return; // Nothing else to do in this function

            case ik_utils.keys.up: // Select previous suggestion from list

                selected = plugin.list.find('.selected');

                if(selected.length && selected.prev().length) { // Item is selected and not first item
                    msg = selected.removeClass('selected').prev().addClass('selected').text();
                } else if (selected.length) { // First item is selected
                    selected.removeClass('selected');
                    msg = plugin.list.find('li:last').addClass('selected').text();
                } else {
                    msg = plugin.list.find('li:last').addClass('selected').text();
                }

                plugin.notify.text(msg); // add suggestion text to live region to be read by screen reader

                event.preventDefault(); // Prevent the cursor from being moved in the textbox
                return; // Nothing else to do in this function
        }
    };

	/**
	 * Handles keyup event on text field.
	 *
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onKeyUp = function (event) {

        var suggestions;
        var plugin = event.data.plugin;
        var $me = $(event.currentTarget);

        switch (event.keyCode) {

            case ik_utils.keys.enter:
            case ik_utils.keys.down:
            case ik_utils.keys.up:
                return; // Nothing to do as handled in key down
        }

        suggestions = plugin.getSuggestions(plugin.options.source, $me.val());

        if (suggestions.length) {
			plugin.showSuggestionsList();
        } else {
            plugin.hideSuggestionsList();
        }

        plugin.list.empty();

        for (var i = 0, l = suggestions.length; i < l; i++) {

            $('<li/>')
                .attr('role', 'option')
                .html(suggestions[i])

                .on('click', {'plugin': plugin}, plugin.onOptionClick) // add click event handler
                .appendTo(plugin.list);
        }
	};

    /**
     * Handles focus event on text field.
     *
     * @param {object} event - Focus event.
     * @param {object} event.data - Event data.
     * @param {object} event.data.plugin - Reference to plugin.
     */
    Plugin.prototype.onFocus = function (event) {

        var plugin = event.data.plugin;

        setTimeout(function() {
            plugin.notify.text(defaults.instructions);
        }, 200);

    };

	/**
	 * Handles focusout event on text field.
	 *
	 * @param {object} event - Focus event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onFocusOut = function (event) {

		var plugin = event.data.plugin;

		setTimeout(function() {
            plugin.notify.text(null);
            plugin.hideSuggestionsList();
		}, 200);

	};

	/**
	 * Handles click event on suggestion box list item.
	 *
	 * @param {object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onOptionClick = function (event) {

		var plugin, $option;

		event.preventDefault();
		event.stopPropagation();

		plugin = event.data.plugin;
		$option = $(event.currentTarget);
		plugin.element.val( $option.text() );
        plugin.hideSuggestionsList();

	};

	/**
	 * Gets a list of suggestions.
	 *
	 * @param {array} arr - Source array.
	 * @param {string} str - Search string.
	 */
	Plugin.prototype.getSuggestions = function (arr, str) {

		var r, pattern, regex, len, limit;

		r = [];
		pattern = '(\\b' + str + ')';
		regex = new RegExp(pattern, 'gi');
		len = this.options.minLength;
		limit = this.options.maxResults;

		if (str.length >= len) {
			for (var i = 0, l = arr.length; i < l ; i++) {
				if (r.length > limit ) {
					break;
				}
				if ( regex.test(arr[i]) ) {
					r.push(arr[i].replace(regex, '<span>$1</span>'));
				}
			}
		}

		return r;

	};

    Plugin.prototype.showSuggestionsList = function() {

        var plugin = this;

    	if (!this.suggestionsListVisible) {
            plugin.list.show();
            plugin.element.attr('aria-expanded', 'true');
            this.suggestionsListVisible = true;

            plugin.notify.text('Suggestions are available for this field. Use up and down arrows to select a suggestion and enter key to use it.');
		}
    };

    Plugin.prototype.hideSuggestionsList = function() {

        var plugin = this;

		if (this.suggestionsListVisible) {
            plugin.element.attr('aria-expanded', 'false');
            plugin.list.empty().hide();
            this.suggestionsListVisible = false;

            plugin.notify.text(null);
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