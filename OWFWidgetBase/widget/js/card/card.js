// widget object wrapper
define(function () {
    // static variables

    // static objects

    var Card = function () {
        // global class variables

        // interval/workers trackking

        // state object
        this._ready = false;

        // timer tracking

        // waiting image

        // widget elements
        this._source = null;
        this._template = null;

        // bound event listener (bind returns new address)
        this._onClick = null;
    }

    // ----- start ----- common card   functions ----- start ----
    Card.prototype.isReady = function () {
        var self = this;

        return self._ready;
    }

    Card.prototype.importCSS = function () {
        var self = this;

        $('<link>')
            .appendTo('head')
            .attr({
                type: 'text/css',
                rel: 'stylesheet',
                href: 'widget/js/card/card.css'
            });
    }

    Card.prototype.importHTML = function (data) {
        var self = this;

        $.get("widget/js/card/card.html", function (response) {
            self._source = response;
            self._template = Handlebars.compile(self._source);

            // create reference to the onClick for bind
            self._onClick = self.onClick.bind(self);

            self._ready = true;
        }).done(function () {
            self._create(data);
        });
    }

    Card.prototype.initialize = function (data, options) {
        var self = this;

        self.importCSS();
        self.importHTML(data);

        self._options = options;
    }

    Card.prototype._create = function (data) {
        var self = this;

        // local variables
        var html = "";
        var i = 0,
            dataId;

        // initialize the object
        self._data = {};

        $.each(data, function (index, item) {
            item.cardId = i++;
            item.prefix = self._options.prefix;
            item.class = self._options.class;
            item.id = index;

            // parse template with data
            item.html = self._template(item);

            // store the data
            self._data[index] = item;
            html += item.html;
        });

        // add to the document element
        if (!self._options.append || (self._options.append === false)) {
            $("#" + self._options.element).children().remove();
            $("#" + self._options.element).html("");
        }
        $(html).appendTo($("#" + self._options.element));

        // link click event to the todo
        var todos = $("." + self._options.class);
        for (i = 0; i < todos.length; i++) {
            dataId = $(todos[i]).attr("data-id");
            self._data[dataId].element = $(todos[i])[0];

            // remove and link event listener (to prevent duplication)
            todos[i].removeEventListener("click", self._onClick);
            todos[i].addEventListener("click", self._onClick);
        }
    }

    Card.prototype.onClick = function (event) {
        var self = this;

        var target = $(event.target);

        // if child element is clicked; bubble up to the parent as target
        if (!target.hasClass("." + self._options.class)) {
            target = target.closest("." + self._options.class);
        }

        // call the parent
        if (self._options.callback) {
            self._options.callback(target);
        }
    }
    // -----  end  ----- common card   functions -----  end  ----

    return Card;
});