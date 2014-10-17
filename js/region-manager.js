define(["jquery", "backbone"], function($, Backbone) {

    var RegionManager = (function(Backbone, $) {
        var currentView;
        var region = {};

        var closeView = function(view) {
            if(view && view.close) {
                console.log('closing');
                view.close();
            }
        };

        var openView = function(view) {
            view.render();
            if(view.onShow) {
                view.onShow();
            }
        };

        region.show = function(view) {
            closeView(currentView);
            currentView = view;
            openView(currentView);
        };

        return region;
    })(Backbone, $);

    return RegionManager;
});
