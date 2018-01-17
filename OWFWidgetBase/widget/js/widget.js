//The location is assumed to be at /<context>/js/eventing/rpc_relay.uncompressed.html if it is not set
OWF.relayFile = "../../vendor/js/eventing/rpc_relay.uncompressed.html";
owfdojo.config.dojoBlankHtmlUrl = '../../vendor/js/dojo-1.5.0-windowname-only/dojo/resources/blank.html';

// widget object wrapper
define(["handlebars", "lodash", "luxon",
    "widgetConfig", "card", "cardDashboard", "cardProperty", "cardWidget",
    "dijit/registry", "dojo/dom-style",
    "dijit/MenuBar", "dijit/Menu", "dijit/DropDownMenu", "dijit/MenuSeparator",
    "dijit/MenuItem", "dijit/PopupMenuItem", "dijit/PopupMenuBarItem",
    "notify", "dojo/domReady!"
], function (Handlebars, _, Luxon,
    WidgetConfig, Card, CardDashboard, CardProperty, CardWidget,
    registry, domStyle,
    MenuBar, Menu, DropDownMenu, MenuSeparator, MenuItem, PopupMenuItem, PopupMenuBarItem) {
    // static variables

    // static objects
    window.Handlebars = Handlebars;
    window.Luxon = Luxon;

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

    var Widget = function () {
        // global class variables
        this._Logger = OWF.Log.getDefaultLogger();
        this._LoggerAppender = this._Logger.getEffectiveAppenders()[0];

        // interval/workers trackking
        this._WidgetStateController = null;

        // user object
        this._config = new WidgetConfig();
        this._OWF = {};

        // timer tracking
        this._Interval = {};

        // waiting image
        this._WaitingIcon = $("#waitingImage");

        // external objects
        this._card = null;
        this._cardProperty = null;
        this._cardWidget = null;
        this._cardDashboard = null;

        // widget elements
        this._dataDiv = $("#dataDiv");
        this._infoDiv = $("#infoDiv");

        // widget buttons
        this._btnReset = $("#reset");
    }

    // ----- start ----- common widget functions ----- start ----
    // Enable logging
    Widget.prototype.setLogThreshold = function () {
        this._LoggerAppender.setThreshold(log4javascript.Level.INFO);
        OWF.Log.setEnabled(false);
    }

    // shared functions
    Widget.prototype.ajaxCall = function (url, data, callback, stateChange, type,
        contentType) {
        var self = this;

        // fix input vars if not defined
        if ((data === undefined) || (data === null) || (!data)) {
            data = {};
        }

        if ((callback === undefined) || (callback === null) || (!callback)) {
            callback = function () {};
        }

        if ((stateChange === undefined) || (stateChange === null) || (!stateChange)) {
            stateChange = function () {};
        }

        if ((type === undefined) || (type === null) || (!type)) {
            //default to a GET request
            type = 'GET';
        }

        // initiate the call
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            stateChange({
                state: req.readyState,
                status: req.status
            });

            if (req.readyState === 4 && req.status === 200) {
                return callback(req.responseText);
            }
        };
        req.open(type, url, true);
        req.withCredentials = true;

        //req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        //req.setRequestHeader("Content-type", "application/json");
        if (!contentType) {
            req.setRequestHeader("Content-type", contentType);
        } else {
            req.setRequestHeader("Content-type", "text/plain");
        }

        if (type === 'GET') {
            req.send();
        } else {
            req.send(JSON.stringify(data));
        }

        // return the object
        return req;
    }

    // document level events
    Widget.prototype.documentBindings = function () {
        var self = this;
        // prevent document to show contextmenu
        //$(document).bind("contextmenu",function(event)
        //{
        //  return false;
        //});

        $.notify.addStyle('happyblue', {
            html: "<div><div class='clearfix'><div id='title' data-notify-html='title'></div></div></div>",
            classes: {
                base: {
                    "white-space": "nowrap",
                    "background-color": "lightblue",
                    "padding": "5px"
                },
                superblue: {
                    "color": "white",
                    "background-color": "blue"
                }
            }
        });

        $.notify.defaults({
            autoHide: false,
            clickToHide: true,
            style: 'happyblue'
        });

        // global resize event
        $(window).resize(function () {});
    }

    // component level events
    Widget.prototype.componentBindings = function () {
        var self = this;

        // detect change to navbar size

        // detect change to the div
        self._dataDiv.on('DOMNodeInserted DOMNodeRemoved', function () {
            self.scrollDataDivToBottom();
        });
        self._infoDiv.on('DOMNodeInserted DOMNodeRemoved', function () {
            self.scrollInfoDivToTop();
        });
    }

    // configure the popup for alerts
    Widget.prototype.displayNotification = function (message, type, statusMessage) {
        var d = new Date();
        var dtg = d.format(dateFormat.masks.isoTime);

        // append content
        //$("#infoDiv").append(dtg + ", " + type + ", " + message +
        //    ((statusMessage === undefined) ? "" : ", " + statusMessage) +
        //    "<br/>");
        $("#infoDiv").prepend(dtg + ", " + type + ", " + message +
            ((statusMessage === undefined) ? "" : ", " + statusMessage) +
            "<br/>");

        if ((message !== undefined) && (message !== null) && (message.length !== 0)) {
            if ((type !== undefined) && (type !== null) && (type.length !== 0)) {
                $("#notification").css('color', 'white');
                $("#notification").html(dtg + " " + message);
            }
        }

        if ((statusMessage !== undefined) && (statusMessage !== null) &&
            (statusMessage.length !== 0)) {
            if ((type !== undefined) && (type !== null) && (type.length !== 0)) {
                if (type === "success") { // this._reen background-#DFF0D8
                    $("#notification").css('color', '#468847');
                } else if (type === "info") { // blue background-#D9EDF7
                    $("#notification").css('color', '#3A87AD');
                } else if (type === "warn") { // yellow background-#FCF8E3
                    $("#notification").css('color', '#C09853');
                } else if (type === "error") { // red background-#F2DEDE
                    $("#notification").css('color', '#B94A48');
                } else {
                    $("#notification").css('color', 'white');
                }
            }

            $("#notification").html(dtg + " " + message + ", " + statusMessage);
        }
    }

    // waiting image
    Widget.prototype.waitingStatus = function (state) {
        var self = this;

        if ((state !== undefined) && (state !== null) && (state.length !== 0)) {
            self._WaitingIcon.show();
        } else {
            self._WaitingIcon.hide();
        }
    }

    // main initialize and run functions for OWF
    Widget.prototype.shutdownWidget = function (sender, msg) {
        var self = this;

        // remove listener override to prevent looping
        self._WidgetStateController.removeStateEventOverrides({
            events: ['beforeclose'],
            callback: function () {
                // unsubcribe the events

                // close widget
                self._WidgetStateController.closeWidget();
            }
        });
    }

    // initialize for class (fixes the html components)
    Widget.prototype.initialize = function () {
        var self = this;

        // set initial state of the controls
        self.displayNotification("initializing widget", "info");

        // widget state controller
        self._WidgetStateController = Ozone.state.WidgetState.getInstance({
            widgetEventingController: Ozone.eventing.Widget.getInstance(),
            autoInit: true,

            // this is fired on any event that you are registered for.
            // the msg object tells us what event it was
            onStateEventReceived: function (sender, msg) {
                if (msg.eventName == "beforeclose") {
                    self.shutdownWidget(null, null);
                }
            }
        });

        self._WidgetStateController.addStateEventOverrides({
            events: ["beforeclose"]
        });

        // initialize external objects
        self._card = new Card();
        self._cardProperty = new CardProperty();
        self._cardWidget = new CardWidget();
        self._cardDashboard = new CardDashboard();

        // wait for card library to be loaded
        // use below code to make sure document is fully loaded due to template
        // loading javascript before the entire page is loaded
        self.owner = this;
        self._Interval.t1 = setInterval(function () {
            clearInterval(self._Interval.t1);
            self.waitingStatus();

            // register all document/component event bindings
            self.documentBindings();
            self.componentBindings();

            // notify widget is ready
            OWF.notifyWidgetReady();
            self.displayNotification("widget initialization complete", "info");
            self.waitingStatus();

            // create menu
            self.createMenu();

            // display the base OWF info
            self.getOwfInfo();

        }, 1000);
    }

    Widget.prototype.createMenu = function () {
        var self = this;

        var pMenuBar = new MenuBar({});

        var pSubMenu = new DropDownMenu({});
        pSubMenu.addChild(new MenuItem({
            id: "menuUserInfo",
            label: "Info",
            onClick: self.getUserInfo.bind(self)
        }));
        pSubMenu.addChild(new MenuItem({
            id: "menuUserUUID",
            label: "UUID",
            disabled: true,
            onClick: self.getUserUUID.bind(self)
        }));
        pSubMenu.addChild(new MenuItem({
            id: "menuUserSummary",
            label: "Summary",
            disabled: true,
            onClick: self.getUserCounts.bind(self)
        }));
        pSubMenu.addChild(new MenuSeparator({}));
        var pViewMenu = new DropDownMenu({});
        pViewMenu.addChild(new MenuItem({
            id: "menuUserGroups",
            label: "Groups",
            disabled: true,
            onClick: self.getUserGroups.bind(self)
        }));
        pViewMenu.addChild(new MenuItem({
            id: "menuUserWidgets",
            label: "Widgets",
            disabled: true,
            onClick: self.getUserWidgets.bind(self)
        }));
        pViewMenu.addChild(new MenuItem({
            id: "menuUserDashboard",
            label: "Dashboard",
            disabled: true,
            onClick: self.getUserDashboards.bind(self)
        }));
        pSubMenu.addChild(new PopupMenuItem({
            label: "View(s)",
            popup: pViewMenu
        }));
        pMenuBar.addChild(new PopupMenuBarItem({
            label: "User",
            popup: pSubMenu
        }));
        var pSubMenu2 = new DropDownMenu({});
        pSubMenu2.addChild(new MenuItem({
            id: "menuAbout",
            label: "About",
            onClick: self.getAbout.bind(self)
        }));
        pSubMenu2.addChild(new MenuSeparator({}));
        pSubMenu2.addChild(new MenuItem({
            id: "menuReset",
            label: "RESET",
            onClick: function () {
                self.clearReset();
                self.getOwfInfo();
            }
        }));
        var mnuHelp = new PopupMenuBarItem({
            label: "HELP",
            popup: pSubMenu2
        });
        domStyle.set(mnuHelp.domNode, 'float', 'right');
        pMenuBar.addChild(mnuHelp);

        pMenuBar.placeAt("menuWrapper");
        pMenuBar.startup();
    }

    Widget.prototype.notifyError = function (msg) {
        $.notify(msg, {
            className: "error",
            autoHide: false
        });
    };

    Widget.prototype.notifyInfo = function (msg) {
        $.notify(msg, {
            className: "info",
            autoHide: true,
            autoHideDelay: 5000
        });
    };
    // -----  end  ----- common widget functions -----  end  ----

    // ----- start ----- widget UI functions     ----- start ----
    Widget.prototype.clearReset = function () {
        var self = this;

        // clear current info
        self._OWF = {};

        // clear all children correctly; this removes the attached events also
        self._dataDiv.children().remove();

        // clear any text nodes
        self._dataDiv.html("");

        // update button status
        self.disableButtons();
    }

    Widget.prototype.enableButtons = function () {
        var self = this;

        registry.byId("menuUserUUID").set("disabled", false);
        registry.byId("menuUserSummary").set("disabled", false);
        registry.byId("menuUserGroups").set("disabled", false);
        registry.byId("menuUserWidgets").set("disabled", false);
        registry.byId("menuUserDashboard").set("disabled", false);
    }

    Widget.prototype.disableButtons = function () {
        var self = this;

        registry.byId("menuUserUUID").set("disabled", true);
        registry.byId("menuUserSummary").set("disabled", true);
        registry.byId("menuUserGroups").set("disabled", true);
        registry.byId("menuUserWidgets").set("disabled", true);
        registry.byId("menuUserDashboard").set("disabled", true);
    }

    Widget.prototype.scrollDataDivToTop = function () {
        var self = this;

        self._dataDiv.scrollTop(0);
    }

    Widget.prototype.scrollDataDivToBottom = function () {
        var self = this;

        self._dataDiv.scrollTop(self._dataDiv[0].scrollHeight);
    }

    Widget.prototype.scrollInfoDivToTop = function () {
        var self = this;

        self._infoDiv.scrollTop(0);
    }

    Widget.prototype.scrollInfoDivToBottom = function () {
        var self = this;

        self._infoDiv.scrollTop(self._infoDiv[0].scrollHeight);
    }

    Widget.prototype.onClickOwfInfo = function (target) {
        var self = this;

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickUserInfo = function (target) {
        var self = this;

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickUUIDInfo = function (target) {
        var self = this;

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickSummaryInfo = function (target) {
        var self = this;

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickGroupInfo = function (target) {
        var self = this;

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickWidgetInfo = function (target) {
        var self = this;

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickDashboardInfo = function (target) {
        var self = this;

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }
    // -----  end  ----- widget UI functions     -----  end  ----

    // ----- start ----- widget functions        ----- start ----
    // get OWF info
    Widget.prototype.getOwfInfo = function () {
        var self = this;
        self.displayNotification("retrieving OWF info", "info");

        // display the config
        self._dataDiv.append("<b>CONFIG: </b>");
        self._dataDiv.append(JSON.stringify(self._config));
        self._dataDiv.append("<br/><hr/>");

        // populate the owf info into object var
        self._OWF.containerName = OWF.getContainerName();
        self._OWF.containerUrl = OWF.getContainerUrl();
        self._OWF.containerVersion = OWF.getContainerVersion();
        self._OWF.currentTheme = OWF.getCurrentTheme();
        self._OWF.dashboardLayout = OWF.getDashboardLayout();
        self._OWF.IframeId = OWF.getIframeId();
        self._OWF.instanceId = OWF.getInstanceId();
        self._OWF.url = OWF.getUrl();
        self._OWF.version = OWF.getVersion();
        self._OWF.widgetGuid = OWF.getWidgetGuid();
        self._OWF.isDashboardLocked = OWF.isDashboardLocked();

        // remove old info from the div
        $("#cardInfoOWFWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardInfoOWFWrapper"><b>OWF Info: </b><br/><div id="cardInfoOWF" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        this._card.initialize({
            "1001": {
                "key": "Container Name",
                "value": self._OWF.containerName
            },
            "1002": {
                "key": "Container Url",
                "value": self._OWF.containerUrl
            },
            "1003": {
                "key": "Container Version",
                "value": self._OWF.containerVersion
            },
            "1004": {
                "key": "Current Theme",
                "value": self._OWF.currentTheme
            },
            "1005": {
                "key": "Dashboard Layout",
                "value": self._OWF.dashboardLayout
            },
            "1006": {
                "key": "Iframe Id",
                "value": self._OWF.IframeId
            },
            "1007": {
                "key": "Instance Id",
                "value": self._OWF.instanceId
            },
            "1008": {
                "key": "URL",
                "value": self._OWF.url
            },
            "1009": {
                "key": "Version",
                "value": self._OWF.version
            },
            "1010": {
                "key": "Widget Guid",
                "value": self._OWF.widgetGuid
            },
            "1011": {
                "key": "Is Dashboard Locked",
                "value": self._OWF.isDashboardLocked
            }
        }, {
            "prefix": "cardOWF",
            "class": "owfInfoClass",
            "element": "cardInfoOWF",
            "append": true,
            "callback": self.onClickOwfInfo.bind(self)
        });

        // update buttons - show userInfo and disable others
        self.displayNotification("retrieving OWF info complete", "info");
    }

    // get user info from OWF
    Widget.prototype.getUserInfo = function () {
        var self = this;

        self.displayNotification("retrieving current user info", "info");
        Ozone.pref.PrefServer.getCurrentUser({
            onSuccess: owfdojo.hitch(self, "onGetUserInfoSuccess"),
            onFailure: owfdojo.hitch(self, "onGetUserInfoFailure")
        });
    }

    Widget.prototype.onGetUserInfoSuccess = function (userInfo) {
        var self = this;

        self._OWF.user = {};
        self._OWF.user.currentUserName = userInfo.currentUserName;
        self._OWF.user.currentUser = userInfo.currentUser;
        self._OWF.user.currentUserPrevLogin = userInfo.currentUserPrevLogin;
        self._OWF.user.currentId = userInfo.currentId;
        self._OWF.user.email = userInfo.email;

        // remove old info from the div
        $("#cardInfoUSERWrapper").remove();
        //var user = _.omit(self._OWF.user, ["summary", "groups", "widgets", "dashboards"]);

        var count = 0;
        var tmpDiv = $('<div id="cardInfoUSERWrapper"><b>OWF User: </b><br/><div id="cardInfoUSER" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = this._card.initialize({
            "1001": {
                "key": "User Name",
                "value": self._OWF.user.currentUserName
            },
            "1002": {
                "key": "User",
                "value": self._OWF.user.currentUser
            },
            "1003": {
                "key": "Prev Login",
                "value": self._OWF.user.currentUserPrevLogin
            },
            "1004": {
                "key": "Id",
                "value": self._OWF.user.currentId
            },
            "1005": {
                "key": "Email",
                "value": self._OWF.user.email
            }
        }, {
            "prefix": "cardUser",
            "class": "userInfoClass",
            "element": "cardInfoUSER",
            "append": true,
            "callback": self.onClickUserInfo.bind(self)
        });

        self.enableButtons();
        self.displayNotification("retrieving current user info complete", "info");
    }

    Widget.prototype.onGetUserInfoFailure = function (error, status) {
        var self = this;

        if (status != 404) {
            self.displayNotification("No user info!", "error",
                "Status Code: " + status + ", Error message: " + error);
        }
    }

    // get user UUID from OWF
    Widget.prototype.getUserUUID = function () {
        var self = this;

        // assign temp uuid if there is none
        self._OWF.user.uuid = OWF.Util.guid();

        // try to retrieve last UUID assigned to user from preferences
        // - if none exists (new user), then store the UUID for use
        self.displayNotification("retrieving user/uuid info", "info");
        OWF.Preferences.getUserPreference({
            namespace: 'widget.base.user',
            name: 'uuid',
            onSuccess: owfdojo.hitch(self, "onGetUserUUIDSuccess"),
            onFailure: owfdojo.hitch(self, "onGetUserUUIDFailure")
        });
    }

    Widget.prototype.displayUserUUID = function () {
        var self = this;

        // remove old info from the div
        $("#cardInfoUUIDWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardInfoUUIDWrapper"><b>OWF User UUID: </b><br/><div id="cardInfoUUID" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = this._card.initialize({
            "1001": {
                "key": "UUID",
                "value": self._OWF.user.uuid
            }
        }, {
            "prefix": "cardUUID",
            "class": "uuidInfoClass",
            "element": "cardInfoUUID",
            "append": true,
            "callback": self.onClickUUIDInfo.bind(self)
        });
    }

    Widget.prototype.onGetUserUUIDSuccess = function (pref) {
        var self = this;

        self._OWF.user.uuid = JSON.parse(pref.value);

        self.displayUserUUID();
        self.displayNotification("retrieving user/uuid info complete", "info");
    }

    Widget.prototype.onGetUserUUIDFailure = function (error, status) {
        var self = this;

        if (status != 404) {
            self.displayNotification("No user preferences!", "error",
                "Status Code: " + status + ", Error message: " + error);
        }

        // try to store the UUID in preferences since retrieve failed
        OWF.Preferences.setUserPreference({
            namespace: 'widget.base.user',
            name: 'uuid',
            value: JSON.stringify(self._OWF.user.uuid),
            onSuccess: owfdojo.hitch(self, "onSaveUserUUIDSuccess"),
            onFailure: owfdojo.hitch(self, "onSaveUserUUIDFailure")
        });
    }

    Widget.prototype.onSaveUserUUIDSuccess = function (value) {
        var self = this;

        // display the user info
        self.displayUserUUID();
        self.displayNotification("saving user/uuid complete", "info");
    }

    Widget.prototype.onSaveUserUUIDFailure = function (error, status) {
        var self = this;

        if (status != 404) {
            self.displayNotification("Error savings user/uuid to preferences", "error",
                "Status Code: " + status + ", Error message: " + error);
        }
    }

    // get user Counts from OWF
    Widget.prototype.getUserCounts = function () {
        var self = this;

        self.displayNotification("retrieving user summary info", "info");
        self.ajaxCall("https://localhost:8443/owf/user/" + self._OWF.user.currentId,
            null,
            owfdojo.hitch(self, "onGetUserSummarySuccess"),
            null,
            null,
            "application/json");
    }

    Widget.prototype.onGetUserSummarySuccess = function (userInfo) {
        var self = this;

        // convert the value to json object
        var value = JSON.parse(userInfo);

        // store what we need
        self._OWF.user.summary = {};
        self._OWF.user.summary.totalStacks = value.data[0].totalStacks;
        self._OWF.user.summary.totalGroups = value.data[0].totalGroups;
        self._OWF.user.summary.realName = value.data[0].userRealName;
        self._OWF.user.summary.totalWidgets = value.data[0].totalWidgets;
        self._OWF.user.summary.totalDashboards = value.data[0].totalDashboards;

        // remove old info from the div
        $("#cardInfoSummaryWrapper").remove();
        //var user = _.omit(self._OWF.user, ["summary", "groups", "widgets", "dashboards"]);

        var count = 0;
        var tmpDiv = $('<div id="cardInfoSummaryWrapper"><b>OWF User Summary: </b><br/><div id="cardInfoSummary" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = this._card.initialize({
            "1001": {
                "key": "Total Stacks",
                "value": self._OWF.user.summary.totalStacks
            },
            "1002": {
                "key": "Total Groups",
                "value": self._OWF.user.summary.totalGroups
            },
            "1003": {
                "key": "Real Name",
                "value": self._OWF.user.summary.realName
            },
            "1004": {
                "key": "Total Widgets",
                "value": self._OWF.user.summary.totalWidgets
            },
            "1005": {
                "key": "Total Dashboards",
                "value": self._OWF.user.summary.totalDashboards
            }
        }, {
            "prefix": "cardSummary",
            "class": "userSummaryClass",
            "element": "cardInfoSummary",
            "append": true,
            "callback": self.onClickSummaryInfo.bind(self)
        });

        self.displayNotification("retrieving user summary complete", "info");
    }

    // get user Groups from OWF
    Widget.prototype.getUserGroups = function () {
        var self = this;

        self.displayNotification("retrieving user group info", "info");
        self.ajaxCall("https://localhost:8443/owf/group?user_id=" + self._OWF.user.currentId,
            null,
            owfdojo.hitch(self, "onGetGroupSuccess"),
            null,
            null,
            "application/json");
    }

    Widget.prototype.onGetGroupSuccess = function (groupInfo) {
        var self = this;

        // convert the value to json object
        var value = JSON.parse(groupInfo);
        self._OWF.user.groups = {};
        $.each(value.data, function (index, item) {
            self._OWF.user.groups[item.name] = {};
            self._OWF.user.groups[item.name].status = item.status;
            self._OWF.user.groups[item.name].users = item.users;
            self._OWF.user.groups[item.name].description = item.description;
            self._OWF.user.groups[item.name].widgets = item.widgets;
            self._OWF.user.groups[item.name].email = item.email;
            self._OWF.user.groups[item.name].id = item.id;
        });

        // remove old info from the div
        $("#cardInfoGroupWrapper").remove();
        //var user = _.omit(self._OWF.user, ["summary", "groups", "widgets", "dashboards"]);

        var count = 0;
        var tmpDiv = $('<div id="cardInfoGroupWrapper"><b>OWF User Group(s): </b><br/><div id="cardInfoGroup" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = this._cardProperty.initialize(self._OWF.user.groups, {
            "prefix": "cardGroup",
            "class": "userGroupClass",
            "element": "cardInfoGroup",
            "append": true,
            "callback": self.onClickGroupInfo.bind(self)
        });

        self.displayNotification("retrieving user group info complete", "info");
    }

    // get user Widgets from OWF
    Widget.prototype.getUserWidgets = function () {
        var self = this;

        // get list of all widgets for user
        self.displayNotification("retrieving widget info", "info");
        var searchConfig = {
            userOnly: true,
            onSuccess: owfdojo.hitch(self, "onGetWidgetsInfoSuccess"),
            onFailure: owfdojo.hitch(self, "onGetWidgetsInfoFailure")
        };
        OWF.Preferences.findWidgets(searchConfig);
    }

    Widget.prototype.onGetWidgetsInfoSuccess = function (widgetInfo) {
        var self = this;

        // convert the value to json object
        self._OWF.user.widgets = {};
        $.each(widgetInfo, function (index, item) {
            self._OWF.user.widgets[item.value.originalName] = {};
            self._OWF.user.widgets[item.value.originalName].name = item.value.originalName;
            self._OWF.user.widgets[item.value.originalName].description = item.value.description;
            self._OWF.user.widgets[item.value.originalName].disabled = item.value.disabled;
            self._OWF.user.widgets[item.value.originalName].visible = item.value.visible;
            self._OWF.user.widgets[item.value.originalName].url = item.value.url;
            self._OWF.user.widgets[item.value.originalName].image = item.value.image;
            self._OWF.user.widgets[item.value.originalName].widgetVersion = item.value.widgetVersion;
            self._OWF.user.widgets[item.value.originalName].singleton = item.value.singleton;
            self._OWF.user.widgets[item.value.originalName].background = item.value.background;
            self._OWF.user.widgets[item.value.originalName].path = item.value.path;
        });

        // remove old info from the div
        $("#cardInfoWidgetWrapper").remove();
        //var user = _.omit(self._OWF.user, ["summary", "groups", "widgets", "dashboards"]);

        var count = 0;
        var tmpDiv = $('<div id="cardInfoWidgetWrapper"><b>OWF User Widget(s): </b><br/><div id="cardInfoWidget" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = this._cardWidget.initialize(self._OWF.user.widgets, {
            "prefix": "cardWidget",
            "class": "userWidgetClass",
            "element": "cardInfoWidget",
            "append": true,
            "callback": self.onClickWidgetInfo.bind(self)
        });

        self.displayNotification("retrieving widget info complete", "info");
    }

    Widget.prototype.onGetWidgetsInfoFailure = function (error, status) {
        var self = this;

        if (status != 404) {
            self.displayNotification("No widget info!", "error",
                "Status Code: " + status + ", Error message: " + error);
        }
    }

    // get user Dashboards from OWF
    Widget.prototype.getUserDashboards = function () {
        var self = this;

        // get list of all dashboards for user
        self.displayNotification("retrieving dashboard info", "info");
        var searchConfig = {
            user_id: 1,
            onSuccess: owfdojo.hitch(self, "onGetDashboardInfoSuccess"),
            onFailure: owfdojo.hitch(self, "onGetDashboardInfoFailure")
        };
        OWF.Preferences.findDashboards(searchConfig);
    }

    Widget.prototype.onGetDashboardInfoSuccess = function (dashboardInfo) {
        var self = this;

        // convert the value to json object
        self._OWF.user.dashboards = {};
        $.each(dashboardInfo.data, function (index, item) {
            self._OWF.user.dashboards[item.name] = {};
            self._OWF.user.dashboards[item.name].description = item.description;
            self._OWF.user.dashboards[item.name].isGroupDashboard = item.isGroupDashboard;
            self._OWF.user.dashboards[item.name].isDefault = item.isDefault;
            self._OWF.user.dashboards[item.name].locked = item.locked;
            self._OWF.user.dashboards[item.name].createdDate = item.createdDate;
        });

        // remove old info from the div
        $("#cardInfoDashboardWrapper").remove();
        //var user = _.omit(self._OWF.user, ["summary", "groups", "widgets", "dashboards"]);

        var count = 0;
        var tmpDiv = $('<div id="cardInfoDashboardWrapper"><b>OWF User Dashboard(s): </b><br/><div id="cardInfoDashboard" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = this._cardDashboard.initialize(self._OWF.user.dashboards, {
            "prefix": "cardDashboard",
            "class": "userDashboardClass",
            "element": "cardInfoDashboard",
            "append": true,
            "callback": self.onClickDashboardInfo.bind(self)
        });

        self.displayNotification("retrieving dashboard info complete", "info");
    }

    Widget.prototype.onGetDashboardInfoFailure = function (error, status) {
        var self = this;

        if (status != 404) {
            self.displayNotification("No dashboard info!", "error",
                "Status Code: " + status + ", Error message: " + error);
        }
    }

    Widget.prototype.getAbout = function () {
        var self = this;

        var html = $(
            "<div style='text-align:center;'><h2>OWF Base Widget</h2></div>" +
            "<hr/>" +
            "<div style='text-align:center;'><p>Version 1.01</p></div>" +
            "<div style='text-align:center;'><h3>Dependencies</h3></div>" +
            "<ul>" +
            "<li>Dojo, Handlebars</li>" +
            "<li>JQuery, Lodash</li>" +
            "<li>Luxon, Notify</li>" +
            "<li>OWF</li></ul>");
        $.notify({
            title: html
        }, {
            autohide: true
        });
    }
    // -----  end  ----- widget functions        -----  end  ----

    return Widget;
});