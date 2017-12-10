// widget object wrapper
var CardObject = (function () {
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
    }

    // ----- start ----- common card   functions ----- start ----
    Card.prototype.isReady = function() {
        var self = this;
        
        return self._ready;
    }

    Card.prototype.importCSS = function() {
        var self = this;

        $('<link>')
            .appendTo('head')
            .attr({
                type: 'text/css',
                rel: 'stylesheet',
                href: 'widget/js/card/card.css'
            });
    }

    Card.prototype.importHTML = function() {
        var self = this;

        $.get("widget/js/card/card.html", function(response) {
            self._source = response;
            self._template = Handlebars.compile(self._source);

            self._ready = true;
       });
    }

    Card.prototype.initialize = function() {
        var self = this;

        self.importCSS();
        self.importHTML();
    }

    Card.prototype.createCard = function(data) {
        var self = this;
        var html = self._template(data);
        
        return html;
    }
    // -----  end  ----- common card   functions -----  end  ----

    return Card;
})();
