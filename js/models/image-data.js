define(["jquery", "underscore", "backbone", "config"], function($, _, Backbone, config) {

    var GROUND = config.GROUND;

    return Backbone.Model.extend({
        defaults: {
            name: null,
            type: 'box',
            massless: false,
            opacity: null,
            size: { x: 0, y: 0 },
            cat: null,
            mask: GROUND
        }
    });

});
