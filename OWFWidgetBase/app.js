require(["widget"],
    function (Widget) {
        if (OWF.Util.isRunningInOWF()) {
            OWF.ready(function () {
                var widget = new Widget();
                widget.initialize();
            });
        }
    });