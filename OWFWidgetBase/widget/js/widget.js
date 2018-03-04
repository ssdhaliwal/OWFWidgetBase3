// widget object wrapper
define([], function () {
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
        this._btnUserInfo = $("#mnuUserInfo");
        this._btnUserUUID = $("#mnuUserUUID");
        this._btnUserCounts = $("#mnuUserCounts");
        this._btnUserGroups = $("#mnuUserGroups");
        this._btnUserWidgets = $("#mnuUserWidgets");
        this._btnUserDashboards = $("#mnuUserDashboards");
        this._btnAbout = $("#mnuAbout");
        this._btnReset = $("#mnuReset");
    }

    // ----- start ----- common widget functions ----- start ----
    // Enable logging
    Widget.prototype.setLogThreshold = function () {
        var self = this;

        self._LoggerAppender.setThreshold(log4javascript.Level.INFO);
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
        self._btnAbout.click(function () {
            self.getAbout();
        });

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
        var self = this;

        var d = new Date();
        var dtg = d.format(dateFormat.masks.isoTime);
        var msg = "";

        msg = dtg + ", " + type + ", " + message +
            ((statusMessage === undefined) ? "" : ", " + statusMessage) +
            "<br/>";
        $("#infoDiv").prepend(msg);

        if ((message !== undefined) && (message !== null) && (message.length !== 0)) {
            if ((type !== undefined) && (type !== null) && (type.length !== 0)) {
                $("#notification").css('color', 'white');

                msg = dtg + " " + message;

                $("#notification").html(msg);
                self.notifyInfo(msg, type);
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

            msg = dtg + " " + message + ", " + statusMessage;
            $("#notification").html(msg);

            if (type === "error") {
                self.notifyError(msg);
            } else {
                self.notifyInfo(msg, type);
            }
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
    Widget.prototype.initialize = function (Card, CardProperty,
        CardWidget, CardDashboard) {
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
        self._card.initialize();

        self._cardProperty = new CardProperty();
        self._cardProperty.initialize();

        self._cardWidget = new CardWidget();
        self._cardWidget.initialize();

        self._cardDashboard = new CardDashboard();
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

            // function to prevent session timeouts from idle
            setInterval(function() {
                var ver = "ver=" + (new Date()).getTime();

                $("#waitingImageIcon").prop("src", "widget/images/loading_blue.gif?" + ver)
            }, 100000);

        }, 1000);
    }

    Widget.prototype.notifyError = function (msg) {
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: msg
        }, {
            element: 'body',
            type: "error",
            allow_dismiss: true,
            placement: {
                from: "top",
                align: "right"
            },
            z_index: 1031
        });
    };

    Widget.prototype.notifyInfo = function (msg, type) {
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            message: msg
        }, {
            element: 'body',
            type: type,
            allow_dismiss: true,
            placement: {
                from: "top",
                align: "right"
            },
            z_index: 1031,
            delay: 5000,
            template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
                '<img data-notify="icon" class="img-circle pull-left">' +
                '<span data-notify="title">{1}</span>' +
                '<span data-notify="message">{2}</span>' +
                '</div>'
        });
    };
    // -----  end  ----- common widget functions -----  end  ----

    // ----- start ----- widget UI functions     ----- start ----
    Widget.prototype.clearReset = function () {
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

    Widget.prototype.onClickOwfInfo = function (event) {
        var self = this;

        // retrieve the target for the child
        var target = $(event.target);

        // if child element is clicked; bubble up to the parent as target
        if (!target.hasClass(".card")) {
            target = target.closest(".card");
        }

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickUserInfo = function (event) {
        var self = this;

        // retrieve the target for the child
        var target = $(event.target);

        // if child element is clicked; bubble up to the parent as target
        if (!target.hasClass(".card")) {
            target = target.closest(".card");
        }

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickUUIDInfo = function (event) {
        var self = this;

        // retrieve the target for the child
        var target = $(event.target);

        // if child element is clicked; bubble up to the parent as target
        if (!target.hasClass(".card")) {
            target = target.closest(".card");
        }

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickSummaryInfo = function (event) {
        var self = this;

        // retrieve the target for the child
        var target = $(event.target);

        // if child element is clicked; bubble up to the parent as target
        if (!target.hasClass(".card")) {
            target = target.closest(".card");
        }

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickGroupInfo = function (event) {
        var self = this;

        // retrieve the target for the child
        var target = $(event.target);

        // if child element is clicked; bubble up to the parent as target
        if (!target.hasClass(".card")) {
            target = target.closest(".card");
        }

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickWidgetInfo = function (event) {
        var self = this;

        // retrieve the target for the child
        var target = $(event.target);

        // if child element is clicked; bubble up to the parent as target
        if (!target.hasClass(".card")) {
            target = target.closest(".card");
        }

        self._infoDiv.prepend(".. clicked: " + target[0].id + ", " + $(target).data("id") + "<br/>");
    }

    Widget.prototype.onClickDashboardInfo = function (event) {
        var self = this;

        // retrieve the target for the child
        var target = $(event.target);

        // if child element is clicked; bubble up to the parent as target
        if (!target.hasClass(".card")) {
            target = target.closest(".card");
        }

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
        self._dataDiv.append(JSON.stringify(SharedConfig));
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
        $("#cardOWFInfoWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardOWFInfoWrapper"><b>OWF Info: </b><br/><div id="cardOWFInfo" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = self._card.create({
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
            "element": "cardOWFInfo",
            "append": false,
            "callback": self.onClickOwfInfo.bind(self)
        });
        /*
        $(html).appendTo($("#cardOWFInfo")[0]);

        // global event for all card classes
        $("body").off("click", ".owfInfoClass");
        $("body").on("click", ".owfInfoClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickOwfInfo(this);
        });
        */
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
        //var user = _.omit(self._OWF.user, ["summary", "groups", "widgets", "dashboards"]);
        $("#cardInfoUSERWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardInfoUSERWrapper"><b>OWF User: </b><br/><div id="cardInfoUSER" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = self._card.create({
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
            "append": false,
            "callback": self.onClickUserInfo.bind(self)
        });
        /*
        $(html).appendTo($("#cardInfoUSER")[0]);

        // global event for all card classes
        $("body").off("click", ".userInfoClass");
        $("body").on("click", ".userInfoClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickUserInfo(this);
        });
        */
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

        // display the user info
        $("#cardInfoUUIDWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardInfoUUIDWrapper"><b>OWF User UUID: </b><br/><div id="cardInfoUUID" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = self._card.create({
            "1001": {
                "key": "UUID",
                "value": self._OWF.user.uuid
            }
        }, {
            "prefix": "cardUUID",
            "class": "uuidInfoClass",
            "element": "cardInfoUUID",
            "append": false,
            "callback": self.onClickUUIDInfo.bind(self)
        });
        /*
        $(html).appendTo($("#cardInfoUUID")[0]);

        // global event for all card classes
        $("body").off("click", ".uuidInfoClass");
        $("body").on("click", ".uuidInfoClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickUUIDInfo(this);
        });
        */
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
        $("#cardInfoSummaryWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardInfoSummaryWrapper"><b>OWF User Summary: </b><br/><div id="cardInfoSummary" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);
        var html = self._card.create({
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
            "append": false,
            "callback": self.onClickSummaryInfo.bind(self)
        });
        /*
        $(html).appendTo($("#cardInfoSummary")[0]);

        // global event for all card classes
        $("body").off("click", ".userSummaryClass");
        $("body").on("click", ".userSummaryClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickSummaryInfo(this);
        });
        */
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
        $("#cardInfoGroupWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardInfoGroupWrapper"><b>OWF User Group(s): </b><br/><div id="cardInfoGroup" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);

        var rawData = JSON.parse(JSON.stringify(self._OWF.user.groups));
        var html = self._cardProperty.create(rawData, {
            "prefix": "cardGroup",
            "class": "userGroupClass",
            "element": "cardInfoGroup",
            "append": false,
            "callback": self.onClickGroupInfo.bind(self)
        });
        /*
        $(html).appendTo($("#cardInfoGroup")[0]);

        // global event for all card classes
        $("body").off("click", ".userGroupClass");
        $("body").on("click", ".userGroupClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickGroupInfo(this);
        });
        */
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
        $("#cardInfoWidgetWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardInfoWidgetWrapper"><b>OWF User Widget(s): </b><br/><div id="cardInfoWidget" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);

        var rawData = JSON.parse(JSON.stringify(self._OWF.user.widgets));
        var html = self._cardWidget.create(rawData, {
            "prefix": "cardWidget",
            "class": "userWidgetClass",
            "element": "cardInfoWidget",
            "append": false,
            "callback": self.onClickWidgetInfo.bind(self)
        });
        /*
        $(html).appendTo($("#cardInfoWidget")[0]);

        // global event for all card classes
        $("body").off("click", ".userWidgetClass");
        $("body").on("click", ".userWidgetClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickWidgetInfo(this);
        });
        */
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
        $("#cardInfoDashboardWrapper").remove();

        var count = 0;
        var tmpDiv = $('<div id="cardInfoDashboardWrapper"><b>OWF User Dashboard(s): </b><br/><div id="cardInfoDashboard" class="cardInfo"></div><br/><hr/></div>');
        tmpDiv.appendTo(self._dataDiv);

        var rawData = JSON.parse(JSON.stringify(self._OWF.user.dashboards));
        var html = self._cardDashboard.createCard(rawData, {
            "prefix": "cardDashboard",
            "class": "userDashboardClass",
            "element": "cardInfoDashboard",
            "append": false,
            "callback": self.onClickDashboardInfo.bind(self)
        });
        /*
        $(html).appendTo($("#cardInfoDashboard")[0]);

        // global event for all card classes
        $("body").off("click", ".userDashboardClass");
        $("body").on("click", ".userDashboardClass", function (event) {
            //self._infoDiv.append(".. clicked: " + this.id + ", " + $(this).data("id") + "<br/>");
            self.onClickDashboardInfo(this);
        });
        */
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

        $.notify({
            icon: 'glyphicon glyphicon-info-sign',
            message: ""
        }, {
            element: 'body',
            type: "info",
            allow_dismiss: true,
            showProgressbar: true,
            placement: {
                from: "top",
                align: "right"
            },
            z_index: 1031,
            delay: 5000,
            template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
                '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
                '<div style="text-align:center;"><h2>OWF Base Widget</h2></div>' +
                '<hr/>' +
                '<div style="text-align:center;"><p>Version 1.01</p></div>' +
                '<div style="text-align:center;"><h3>Dependencies</h3></div>' +
                '<ul>' +
                '<li>Dojo, Handlebars</li>' +
                '<li>JQuery, Lodash</li>' +
                '<li>Luxon, Notify</li>' +
                '<li>OWF</li></ul>' +
                '<br/>' +
                '<div class="progress" data-notify="progressbar">' +
                '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
                '</div>' +
                '</div>'
        });
    }
    // -----  end  ----- widget functions        -----  end  ----

    return Widget;
});