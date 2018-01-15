if (!window.contextPath) {
    /**
     * Specifies absolute path to root of this webapp. Only works if the
     * JavaScript file defining this member is loaded by index.html (or
     * another file in the webapp root).
     * @global
     */
    window.contextPath = (function () {
        var loc = window.location;
        var path = loc.protocol + "//";

        if (loc.hostname) {
            path += loc.hostname;

            if (loc.port) {
                path += ":" + loc.port;
            }
        }

        path += loc.pathname;

        // Remove filename if present
        path = path.replace(/\/[^\/]+$/, "/");

        return path;
    })();
}

if (!window.vendorPath) {
    /**
     * Specifies path to ESRI JavaScript API. Returns the location hosted on
     * the Internet by default. When isOffline() is true returns a location
     * hosted within this webapp.
     * @global
     */
    window.vendorPath = (function () {
        var path = window.contextPath + "vendor/";

        return path;
    })();
}

if (!window.widgetPath) {
    /**
     * Specifies path to ESRI JavaScript API. Returns the location hosted on
     * the Internet by default. When isOffline() is true returns a location
     * hosted within this webapp.
     * @global
     */
    window.widgetPath = (function () {
        var path = window.contextPath + "widget/";

        return path;
    })();
}

/**
 * Dojo AMD loader configuration defined to allow ESRI libraries to be
 * loaded either from the Internet or within this webapp depending on the
 * value of isOffline().
 * @global
 */
var dojoConfig = dojoConfig || {};

// ESRI JavaScript API 3.7 does not load asynchronously
dojoConfig.async = false;
dojoConfig.cacheBust = true;

dojoConfig.packages = [{
        location: window.vendorPath + "dojo/digit",
        main: "digit",
        name: "digit"
    }, 
    {
        location: window.vendorPath + "dojo/dojox",
        main: "dojox",
        name: "dojox"
    }, 
    {
        location: window.vendorPath + "js",
        main: "handlebars",
        name: "handlebars"
    },
    {
        location: window.vendorPath + "js",
        main: "luxon",
        name: "luxon"
    },
    {
        location: window.vendorPath + "js",
        main: "lodash",
        name: "lodash"
    },
    {
        location: window.vendorPath + "js",
        main: "notify",
        name: "notify"
    },
    {
        location: window.widgetPath + "js",
        main: "widgetConfig",
        name: "widgetConfig"
    },
    {
        location: window.widgetPath + "js",
        main: "widget",
        name: "widget"
    },
    {
        location: window.widgetPath + "js/card",
        main: "card",
        name: "card"
    },
    {
        location: window.widgetPath + "js/card",
        main: "cardDashboard",
        name: "cardDashboard"
    },
    {
        location: window.widgetPath + "js/card",
        main: "cardProperty",
        name: "cardProperty"
    },
    {
        location: window.widgetPath + "js/card",
        main: "cardWidget",
        name: "cardWidget"
    }
];