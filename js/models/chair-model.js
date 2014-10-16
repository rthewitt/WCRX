define(["jquery", "underscore", "backbone"], function($, _, Backbone) {

    var ChairModel = Backbone.Model.extend({
        defaults: {
            wheelDiameter: 24,
            seatBackWidth: 0.4,
            seatWidth: 15,
            seatBackHeight: 13,
            axleDistance: 3.5,
            seatDepth: 13,
            foamHeight: 2,
            groundClr: 0.0
        },
        broadcast: function() {
            //this.dispatcher.trigger('mycustom');
        },
        initialize: function(model, options) {

            this.dispatcher = options.dispatcher;

            this.on('change:wheelDiameter', this.broadcast);
            this.on('change:axleDistance', this.broadcast);
            //this.on('change:seatWidth', this.broadcast); // no trigger yet, snapshot is separate functionality
            this.on('change:seatBackWidth', this.broadcast);
            this.on('change:seatBackHeight', this.broadcast);
            this.on('change:seatDepth', this.broadcast);
            this.on('change:foamHeight', this.broadcast);
            this.on('change:wheelChair', function() { console.log('model changed chair');});
        }
    });

    return ChairModel;
});
