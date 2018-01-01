//The location is assumed to be at /<context>/js/eventing/rpc_relay.uncompressed.html if it is not set
OWF.relayFile = "../../vendor/js/eventing/rpc_relay.uncompressed.html";
owfdojo.config.dojoBlankHtmlUrl = '../../vendor/js/dojo-1.5.0-windowname-only/dojo/resources/blank.html';

// widget object wrapper
var WidgetObject = (function () {
    // static variables

    // static objects

    var Widget = function () {
        // global class variables
        this._Logger = OWF.Log.getDefaultLogger();
        this._LoggerAppender = this._Logger.getEffectiveAppenders()[0];

        // interval/workers trackking
        this._WidgetStateController = null;

        // user object
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
        this._btnUserInfo = $("#userInfo");
        this._btnUserUUID = $("#userUUID");
        this._btnUserCounts = $("#userCounts");
        this._btnUserGroups = $("#userGroups");
        this._btnUserWidgets = $("#userWidgets");
        this._btnUserDashboards = $("#userDashboards");
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
            self.scrollInfoDivToBottom();
        });

        // click handler for userInfo button
        self._btnUserInfo.click(function () {
            self.getUserInfo();
        });

        // click handler for reset button
        self._btnReset.click(function () {
            self.clearReset();
            self.getOwfInfo();
        });

        // click handler for UUID button
        self._btnUserUUID.click(function () {
            self.getUserUUID();
        });

        // click handler for Counts button
        self._btnUserCounts.click(function () {
            self.getUserCounts();
        });

        // click handler for Group button
        self._btnUserGroups.click(function () {
            self.getUserGroups();
        });

        // click handler for Widgets button
        self._btnUserWidgets.click(function () {
            self.getUserWidgets();
        });

        // click handler for Dashboards button
        self._btnUserDashboards.click(function () {
            self.getUserDashboards();
        });
    }

    // configure the popup for alerts
    Widget.prototype.displayNotification = function (message, type, statusMessage) {
        var d = new Date();
        var dtg = d.format(dateFormat.masks.isoTime);

        $("#infoDiv").append(dtg + ", " + type + ", " + message +
            ((statusMessage === undefined) ? "" : ", " + statusMessage));
        $("#infoDiv").append("<br/>");

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
    Widget.prototype.initialize = function (CardObject, CardPropertyObject,
        CardWidgetObject, CardDashboardObject) {
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
        self._card = new CardObject();
        self._card.initialize();

        self._cardProperty = new CardPropertyObject();
        self._cardProperty.initialize();

        self._cardWidget = new CardWidgetObject();
        self._cardWidget.initialize();

        self._cardDashboard = new CardDashboardObject();
        self._cardDashboard.initialize();

        // wait for card library to be loaded
        // use below code to make sure document is fully loaded due to template
        // loading javascript before the entire page is loaded
        self.owner = this;
        self._Interval.t1 = setInterval(function () {
            if (!self._card.isReady())
                return;
            if (!self._cardProperty.isReady())
                return;
            if (!self._cardWidget.isReady())
                return;
            if (!self._cardDashboard.isReady())
                return;

            clearInterval(self._Interval.t1);
            self.waitingStatus();

            // register all document/component event bindings
            self.documentBindings();
            self.componentBindings();

            // notify widget is ready
            OWF.notifyWidgetReady();
            self.displayNotification("widget initialization complete", "info");
            self.waitingStatus();

            // display the base OWF info
            self.getOwfInfo();

        }, 1000);
    }
    // -----  end  ----- common widget functions -----  end  ----

    // ----- start ----- widget UI functions     ----- start ----
    Widget.prototype.clearReset = function() {
        var self = this;

        // clear current info
        self._OWF = {};
        self._dataDiv.text("");
        
        // clear all event handlers
        $("body").off("click", ".owfInfoClass");
        $("body").off("click", ".userInfoClass");
        $("body").off("click", ".uuidInfoClass");
        $("body").off("click", ".userSummaryClass");

        // update button status
        self.disableButtons();        
    }

    Widget.prototype.enableButtons = function () {
        var self = this;

        self._btnUserUUID.removeClass("disabled");
        self._btnUserCounts.removeClass("disabled");
        self._btnUserGroups.removeClass("disabled");
        self._btnUserWidgets.removeClass("disabled");
        self._btnUserDashboards.removeClass("disabled");
    }

    Widget.prototype.disableButtons = function () {
        var self = this;

        self._btnUserUUID.addClass("disabled");
        self._btnUserCounts.addClass("disabled");
        self._btnUserGroups.addClass("disabled");
        self._btnUserWidgets.addClass("disabled");
        self._btnUserDashboards.addClass("disabled");
    }

    Widget.prototype.scrollDataDivToBottom = function () {
        var self = this;

        self._dataDiv.scrollTop(self._dataDiv[0].scrollHeight);
    }

    Widget.prototype.scrollInfoDivToBottom = function () {
        var self = this;

        self._infoDiv.scrollTop(self._infoDiv[0].scrollHeight);
    }

    Widget.prototype.onClickOwfInfo = function(target) {
        var self = this;

        self._infoDiv.append(".. clicked: " + target.id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickUserInfo = function(target) {
        var self = this;

        self._infoDiv.append(".. clicked: " + target.id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickUUIDInfo = function(target) {
        var self = this;

        self._infoDiv.append(".. clicked: " + target.id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickSummaryInfo = function(target) {
        var self = this;

        self._infoDiv.append(".. clicked: " + target.id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickGroupInfo = function(target) {
        var self = this;

        self._infoDiv.append(".. clicked: " + target.id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickWidgetInfo = function(target) {
        var self = this;

        self._infoDiv.append(".. clicked: " + target.id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickDashboardInfo = function(target) {
        var self = this;

        self._infoDiv.append(".. clicked: " + target.id + ", " + $(target).data("id") + "<br/>");
    }
    // -----  end  ----- widget UI functions     -----  end  ----

    // ----- start ----- widget functions        ----- start ----
    // get OWF info
    Widget.prototype.getOwfInfo = function () {
        var self = this;
        self.displayNotification("retrieving OWF info", "info");

        // display the config
        self._dataDiv.append("<b>CONFIG: </b>");
        self._dataDiv.append(JSON.stringify(gConfigObject));
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

        // display the OWF info w/o user info
        self._dataDiv.append("<b>OWF Info: </b><br/>");

        var count = 0;
        var tmpDiv = $('<div class="cardInfo"></div>');
        var html = this._card.createCard({
            "cards": [{
                "prefix": "cardOWF",
                "id": 1001,
                "class": " owfInfoClass",
                "key": "Container Name",
                "value": self._OWF.containerName
            }, {
                "prefix": "cardOWF",
                "id": 1002,
                "class": " owfInfoClass",
                "key": "Container Url",
                "value": self._OWF.containerUrl
            }, {
                "prefix": "cardOWF",
                "id": 1003,
                "class": " owfInfoClass",
                "key": "Container Version",
                "value": self._OWF.containerVersion
            }, {
                "prefix": "cardOWF",
                "id": 1004,
                "class": " owfInfoClass",
                "key": "Current Theme",
                "value": self._OWF.currentTheme
            }, {
                "prefix": "cardOWF",
                "id": 1005,
                "class": " owfInfoClass",
                "key": "Dashboard Layout",
                "value": self._OWF.dashboardLayout
            }, {
                "prefix": "cardOWF",
                "id": 1006,
                "class": " owfInfoClass",
                "key": "Iframe Id",
                "value": self._OWF.IframeId
            }, {
                "prefix": "cardOWF",
                "id": 1007,
                "class": " owfInfoClass",
                "key": "Instance Id",
                "value": self._OWF.instanceId
            }, {
                "prefix": "cardOWF",
                "id": 1008,
                "class": " owfInfoClass",
                "key": "URL",
                "value": self._OWF.url
            }, {
                "prefix": "cardOWF",
                "id": 1009,
                "class": " owfInfoClass",
                "key": "Version",
                "value": self._OWF.version
            }, {
                "prefix": "cardOWF",
                "id": 1010,
                "class": " owfInfoClass",
                "key": "Widget Guid",
                "value": self._OWF.widgetGuid
            }, {
                "prefix": "cardOWF",
                "id": 1011,
                "class": " owfInfoClass",
                "key": "Is Dashboard Locked",
                "value": self._OWF.isDashboardLocked
            }]
        }, ".owfInfoClass", self.onClickOwfInfo);

        $(html).appendTo(tmpDiv);
        tmpDiv.appendTo(self._dataDiv);
        self._dataDiv.append("<br/><hr/>");

        // global event for all card classes
        $("body").off("click", ".owfInfoClass");
        $("body").on("click", ".owfInfoClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickOwfInfo(this);
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

        // display the user info
        self._dataDiv.append("<b>User Info: </b><br/>");
        //var user = _.omit(self._OWF.user, ["summary", "groups", "widgets", "dashboards"]);

        var count = 0;
        var tmpDiv = $('<div class="cardInfo"></div>');
        var html = this._card.createCard({
            "cards": [{
                "prefix": "cardUser",
                "id": 1001,
                "class": " userInfoClass",
                "key": "User Name",
                "value": self._OWF.user.currentUserName
            }, {
                "prefix": "cardUser",
                "id": 1002,
                "class": " userInfoClass",
                "key": "User",
                "value": self._OWF.user.currentUser
            }, {
                "prefix": "cardUser",
                "id": 1003,
                "class": " userInfoClass",
                "key": "Prev Login",
                "value": self._OWF.user.currentUserPrevLogin
            }, {
                "prefix": "cardUser",
                "id": 1004,
                "class": " userInfoClass",
                "key": "Id",
                "value": self._OWF.user.currentId
            }, {
                "prefix": "cardUser",
                "id": 1005,
                "class": " userInfoClass",
                "key": "Email",
                "value": self._OWF.user.email
            }]
        });

        $(html).appendTo(tmpDiv);
        tmpDiv.appendTo(self._dataDiv);
        self._dataDiv.append("<br/><hr/>");

        // global event for all card classes
        $("body").off("click", ".userInfoClass");
        $("body").on("click", ".userInfoClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickUserInfo(this);
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
    
    Widget.prototype.displayUserUUID = function() {
        var self = this;

        // display the user info
        self._dataDiv.append("<b>OWF User UUID: </b><br/>");
        
        var count = 0;
        var tmpDiv = $('<div class="cardInfo"></div>');
        var html = this._card.createCard({
            "cards": [{
                "prefix": "cardUUID",
                "id": 1001,
                "class": " uuidInfoClass",
                "key": "UUID",
                "value": self._OWF.user.uuid
            }]
        });
        
        $(html).appendTo(tmpDiv);
        tmpDiv.appendTo(self._dataDiv);
        self._dataDiv.append("<br/><hr/>");

        // global event for all card classes
        $("body").off("click", ".uuidInfoClass");
        $("body").on("click", ".uuidInfoClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickUUIDInfo(this);
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

        // display the user info
        self._dataDiv.append("<b>OWF User Info (summary): </b><br/>");
        //self._dataDiv.append(JSON.stringify(self._OWF.user.summary));

        var count = 0;
        var tmpDiv = $('<div class="cardInfo"></div>');
        var html = this._card.createCard({
            "cards": [{
                "prefix": "cardSummary",
                "id": 1001,
                "class": " userSummaryClass",
                "key": "Total Stacks",
                "value": self._OWF.user.summary.totalStacks
            }, {
                "prefix": "cardSummary",
                "id": 1002,
                "class": " userSummaryClass",
                "key": "Total Groups",
                "value": self._OWF.user.summary.totalGroups
            }, {
                "prefix": "cardSummary",
                "id": 1003,
                "class": " userSummaryClass",
                "key": "Real Name",
                "value": self._OWF.user.summary.realName
            }, {
                "prefix": "cardSummary",
                "id": 1004,
                "class": " userInfoClass",
                "key": "Total Widgets",
                "value": self._OWF.user.summary.totalWidgets
            }, {
                "prefix": "cardSummary",
                "id": 1005,
                "class": " userSummaryClass",
                "key": "Total Dashboards",
                "value": self._OWF.user.summary.totalDashboards
            }]
        });

        $(html).appendTo(tmpDiv);
        tmpDiv.appendTo(self._dataDiv);
        self._dataDiv.append("<br/><hr/>");

        // global event for all card classes
        $("body").off("click", ".userSummaryClass");
        $("body").on("click", ".userSummaryClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickSummaryInfo(this);
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

        // display the user info
        self._dataDiv.append("<b>OWF User Info (groups): </b><br/>");
        //self._dataDiv.append(JSON.stringify(self._OWF.user.groups));
        
        var count = 0;
        var tmpDiv = $('<div class="cardInfo"></div>');

        var rawData = JSON.parse(JSON.stringify(self._OWF.user.groups));
        var data = {"cards": {}};
        $.each(rawData, function(key, value) {
            // store card in array for handlebars
            data.cards[key] = [];

            // update value to include card properties
            data.cards[key].prefix = "cardGroup";
            data.cards[key].class = " userGroupClass",

            data.cards[key].push(value);
        });
        var html = this._cardProperty.createCard(data);
        
        $(html).appendTo(tmpDiv);
        tmpDiv.appendTo(self._dataDiv);
        self._dataDiv.append("<br/><hr/>");

        // global event for all card classes
        $("body").off("click", ".userGroupClass");
        $("body").on("click", ".userGroupClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickGroupInfo(this);
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

        // display the user info
        self._dataDiv.append("<b>OWF User Info (widgets): </b><br/>");
        //self._dataDiv.append(JSON.stringify(self._OWF.user.widgets));
        
        var count = 0;
        var tmpDiv = $('<div class="cardInfo"></div>');

        var rawData = JSON.parse(JSON.stringify(self._OWF.user.widgets));
        var data = {"cards": {}};
        $.each(rawData, function(key, value) {
            // store card in array for handlebars
            data.cards[key] = [];

            // update value to include card properties
            data.cards[key].prefix = "cardWidget";
            data.cards[key].class = " userWidgetClass",

            data.cards[key].push(value);
        });
        var html = this._cardWidget.createCard(data);
        
        $(html).appendTo(tmpDiv);
        tmpDiv.appendTo(self._dataDiv);
        self._dataDiv.append("<br/><hr/>");

        // global event for all card classes
        $("body").off("click", ".userWidgetClass");
        $("body").on("click", ".userWidgetClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickWidgetInfo(this);
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

        // display the user info
        self._dataDiv.append("<b>OWF User Info (dashboards): </b><br/>");
        //self._dataDiv.append(JSON.stringify(self._OWF.user.dashboards));
        
        var count = 0;
        var tmpDiv = $('<div class="cardInfo"></div>');

        var rawData = JSON.parse(JSON.stringify(self._OWF.user.dashboards));
        var data = {"cards": {}};
        $.each(rawData, function(key, value) {
            // store card in array for handlebars
            data.cards[key] = [];

            // update value to include card properties
            data.cards[key].prefix = "cardDashboard";
            data.cards[key].class = " userDashboardClass",

            data.cards[key].push(value);
        });
        var html = this._cardDashboard.createCard(data);
        
        $(html).appendTo(tmpDiv);
        tmpDiv.appendTo(self._dataDiv);
        self._dataDiv.append("<br/><hr/>");

        // global event for all card classes
        $("body").off("click", ".userDashboardClass");
        $("body").on("click", ".userDashboardClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickDashboardInfo(this);
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

    // -----  end  ----- widget functions        -----  end  ----

    return Widget;
})();