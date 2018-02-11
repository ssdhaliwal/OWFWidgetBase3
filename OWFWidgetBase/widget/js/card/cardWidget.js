// widget object wrapper
define(function () {
    // static variables

    // static objects

    var CardWidget = function () {
        // global class variables

        // interval/workers trackking

        // state object
        this._ready = false;

        // timer tracking

        // waiting image

        // widget elements
        this._source = null;
        this._template = null;

        // store for individual components
        this._store = {};
    }

    // ----- start ----- common card   functions ----- start ----
    CardWidget.prototype.isReady = function () {
        var self = this;

        return self._ready;
    }

    CardWidget.prototype.importCSS = function () {
        var self = this;
        var ver = "?ver=" + (new Date()).getTime();

        $('<link>')
            .appendTo('head')
            .attr({
                type: 'text/css',
                rel: 'stylesheet',
                href: 'widget/js/card/cardWidget.css' + ver
            });
    }

    CardWidget.prototype.importHTML = function () {
        var self = this;

        $.get("widget/js/card/cardWidget.html", function (response) {
            self._source = response;
            self._template = Handlebars.compile(self._source);

            self._ready = true;
        });
    }

    CardWidget.prototype.initialize = function () {
        var self = this;

        self.importCSS();
        self.importHTML();
    }

    CardWidget.prototype._updateEvents = function (options) {
        var self = this;

        // store all items and link click event to the todo
        var cards = $(".card-" + options.class);
        for (i = 0; i < cards.length; i++) {
            dataId = $(cards[i]).attr("data-id");
            self._store[options.class]["data"][dataId].element = $(cards[i])[0];

            // assign click to the main element
            if (options.callback) {
                cards[i].removeEventListener("click", options.callback);
                cards[i].addEventListener("click", options.callback);
            }
        }
    }

    CardWidget.prototype.create = function (data, options) {
        var self = this;

        // local variables
        var html = "";

        // create reference to the onClick for bind
        var i = 0,
            dataId = "";

        // add to the document element
        $("#" + options.element).children().remove();
        $("#" + options.element).html("");

        self._store[options.class] = {};
        self._store[options.class]["data"] = {};
        self._store[options.class]["options"] = options;

        // initalize the object
        $.each(data, function (index, item) {
            item.cardId = i++;
            item.prefix = options.prefix;
            item.class = options.class;
            item.id = index.replace(new RegExp(' ', 'g'), '');

            item.html = self._template(item);

            // append to others and update item in store
            html += item.html;
            self._store[options.class]["data"][index] = item;
        });

        // add to the document element
        $(html).appendTo($("#" + options.element));
        self._updateEvents(options);

        return self._store[options.class];
    }
    // -----  end  ----- common card   functions -----  end  ----

    return CardWidget;
});