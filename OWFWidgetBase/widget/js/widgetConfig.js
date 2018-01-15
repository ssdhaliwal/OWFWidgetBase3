define(function() {
    var WidgetConfig = function () {
        this.widgetVersion = "v1.0.b5@20171110";
        this.license = "MIT";
        this.preferenceServiceUrl = "https://localhost:7443/PreferenceService/rest/preferences";
    }

    return WidgetConfig;
});

// 20171105 - added peferenceService url