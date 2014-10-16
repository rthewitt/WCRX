define(["jquery", "underscore", "backbone"], function($, _, Backbone) {

    var FrontView = Backbone.View.extend({
        el: "#front-view",
        
        initialize: function(options) {
            /*
            var sim = options.sim;
            this.sim = sim;
            this.model = sim.physics.humanMeasures;
            */
            this.listenTo(options.dispatcher, 'mycustom', this.customAlert);
        },
        render: function() {
            this.sim.drawSimple(this.model.attributes['front']);
        },
        // move logic into controller? 
        // move config model logic into view?
        customAlert: function() {
            console.log('custom from front view');
            //this.model.resizeFront();
            //this.render();
        }
    });

    return FrontView;
});
