requirejs.config({
    urlArgs: "ver=" + (new Date()).getTime(),
    baseUrl: "widget",
    paths: {
        main: "main",
        card: "js/card/card",
        cardProperty: "js/card/cardProperty",
        cardWidget: "js/card/cardWidget",
        cardDashboard: "js/card/cardDashboard",
        jquery: "../vendor/js/jquery-3.2.1.min",
        lodash: "../vendor/js/lodash-4.17.4.min",
        handlebars: "../vendor/js/handlebars-4.0.11.min",
        bootstrap: "../vendor/js/bootstrap-3.3.7.min",
        smartmenus: "../vendor/js/jquery.smartmenus",
        smartmenus2: "../vendor/js/jquery.smartmenus.bootstrap",
        notify: "../vendor/js/bootstrap-notify.min",
        luxon: "../vendor/js/luxon"
        //underscore: "../vendor/js/underscore-1.8.3.min",
        //backbone: "../vendor/js/backbone.min"
    },
    shim: {
        //'underscore': {
        //    exports: '_'
        //},
        //'backbone': {
        //    deps: ['jquery', 'underscore'],
        //    exports: 'Backbone'
        //},
        "smartmenus2": {
            "deps": ['smartmenus']
        },
        "smartmenus": {
            "deps": ['jquery']
        },
        "bootstrap": {
            "deps": ['jquery']
        },
        'handlebars': {
            exports: 'Handlebars'
        }
    }
});

requirejs(['jquery', 'lodash', 'handlebars', 'notify', 'luxon', 'main', 'bootstrap', 'smartmenus', 'smartmenus2'],
    function ($, lo, handlebars, notify, luxon, main) {
        owfdojo.addOnLoad(function () {
            $(document).ready(function () {
                window.Handlebars = handlebars;
                window.Luxon = luxon;

                // https://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional
                Handlebars.registerHelper('ifCond', function (v1, v2, options) {
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                });
                Handlebars.registerHelper('ifCond2', function (v1, operator, v2, options) {

                    switch (operator) {
                        case '==':
                            return (v1 == v2) ? options.fn(this) : options.inverse(this);
                        case '===':
                            return (v1 === v2) ? options.fn(this) : options.inverse(this);
                        case '!=':
                            return (v1 != v2) ? options.fn(this) : options.inverse(this);
                        case '!==':
                            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                        case '<':
                            return (v1 < v2) ? options.fn(this) : options.inverse(this);
                        case '<=':
                            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                        case '>':
                            return (v1 > v2) ? options.fn(this) : options.inverse(this);
                        case '>=':
                            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                        case '&&':
                            return (v1 && v2) ? options.fn(this) : options.inverse(this);
                        case '||':
                            return (v1 || v2) ? options.fn(this) : options.inverse(this);
                        default:
                            return options.inverse(this);
                    }
                });

                // https://stackoverflow.com/questions/26715805/handlebarsjs-registerhelper-for-comparing-two-dates
                Handlebars.registerHelper("ifPassed", function (dueDate, matchDate, options) {
                    if (Luxon.DateTime.fromISO(dueDate).isAfter(Luxon.DateTime.fromISO(matchDate))) {
                        return options.fn(this);
                    } else {
                        return options.inverse(this);
                    }
                });

                // assign config to global window object
                window.SharedConfig = main.SharedConfig;

                var widget = new main.Widget();
                widget.initialize(main.Card, main.CardProperty,
                    main.CardWidget, main.CardDashboard);
            });
        });
    }
);