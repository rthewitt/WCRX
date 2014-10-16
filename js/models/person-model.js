define(["jquery", "underscore", "backbone"], function($, _, Backbone) {

    var PersonModel = Backbone.Model.extend({
        defaults: {
            lowerArmLength: 11,
            lowerArmWidth: 4,
            upperArmLength: 11,
            upperArmWidth: 4.5,
            torsoLength: 25, // 26 total
            contactPoint: 2.0, // seat contact forward
            chestWidth: 16,
            hipWidth: 0,
            trunkDepth: 9,
            upperLegLength: 22,
            upperLegWidth: 6,
            footWidth: 4,
            footLength: 9,
            lowerLegLength: 20,
            lowerLegWidth: 5
        },
        broadcast: function() {
        },
        initialize: function(model, options) {
            this.on('change:contactPoint', this.broadcast);
            this.on('change:lowerArmLength', this.broadcast);
            this.on('change:lowerArmWidth', this.broadcast),
            this.on('change:upperArmLength', this.broadcast),
            this.on('change:upperArmWidth', this.broadcast),
            this.on('change:torsoLength', this.broadcast),
            this.on('change:trunkDepth', this.broadcast),
            this.on('change:upperLegLength', this.broadcast),
            this.on('change:upperLegWidth', this.broadcast),
            this.on('change:lowerLegLength', this.broadcast),
            this.on('change:lowerLegWidth', this.broadcast)
        }
    });

    return PersonModel;
});
