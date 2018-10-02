;(function ( $, window, document, undefined ) {

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
	 * @param {number} options.minLength - Mininmum string length before sugestions start showing.
	 * @param {number} options.maxResults - Maximum number of shown suggestions.
	 */
	function Plugin( element, options ) {

		this.element = $(element);
		this.options = $.extend( {}, defaults, options);
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
				'role': 'combobox',
                'aria-expanded': 'false',
				'aria-haspopup': 'listbox',
                'aria-autocomplete': 'list',
                'aria-controls': suggestionsListId,
                'aria-describedby': instructionsId
            })
            .wrap('<span class="ik_suggest"></span>')
            .on('keydown', {'plugin': plugin}, plugin.onKeyDown) // add keydown event
            .on('keyup', {'plugin': plugin}, plugin.onKeyUp) // add keyup event
			.on('focusout', {'plugin': plugin}, plugin.onFocusOut);  // add focusout event

        plugin.notify = $('<div/>') // add hidden live region to be used by screen readers
            .addClass('ik_readersonly')
            .attr({
                'id': instructionsId,
                'role': 'region',
                'aria-live': 'polite'
            })
            .text(defaults.instructions);

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

		var plugin, selected;

		plugin = event.data.plugin;

		switch (event.keyCode) {

			case ik_utils.keys.tab:
			case ik_utils.keys.esc:

				plugin.list.empty().hide(); // empty list and hide suggestion box

				break;

			case ik_utils.keys.enter:

				selected = plugin.list.find('.selected');
				plugin.element.val( selected.text() ); // set text field value to the selected option
				plugin.list.empty().hide(); // empty list and hide suggestion box

				break;

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

        var plugin, $me, suggestions, selected, msg;

        plugin = event.data.plugin;
        $me = $(event.currentTarget);

        // If the up or down arrow keys have been pressed then handle these separately
        switch (event.keyCode) {

            case ik_utils.keys.down: // select next suggestion from list

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

                return; // Nothing else we want to do here

            case ik_utils.keys.up: // select previous suggestion from list

                selected = plugin.list.find('.selected');

                if(selected.length) {
                    msg = selected.removeClass('selected').prev().addClass('selected').text();
                }
                plugin.notify.text(msg);  // add suggestion text to live region to be read by screen reader

                return // Nothing else we want to do here;
        }

        suggestions = plugin.getSuggestions(plugin.options.source, $me.val());

        if (suggestions.length) {
            plugin.element.attr('aria-expanded', 'true');
            plugin.notify.text('Suggestions are available for this field. Use up and down arrows to select a suggestion and enter key to use it.');
            plugin.list.show();
        } else {
            plugin.element.attr('aria-expanded', 'false');
            plugin.notify.text(defaults.instructions);
            plugin.list.hide();
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
	 * Handles focusout event on text field.
	 *
	 * @param {object} event - Focus event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onFocusOut = function (event) {

		var plugin = event.data.plugin;

		setTimeout(function() {
            plugin.element.attr('aria-expanded', 'false');
            plugin.notify.text(defaults.instructions);
			plugin.list.empty().hide();
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
		plugin.list.empty().hide();

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

	$.fn[pluginName] = function ( options ) {

		return this.each(function () {

			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}

		});

	}

})( jQuery, window, document );