define(["underscore", "config"], function(_, config) {

    var GROUND = config.GROUND;

    var defaults = {
            name: null,
            type: 'box',
            massless: false,
            opacity: null,
            size: { x: 0, y: 0 },
            cat: null,
            mask: GROUND
        };

    /* this is not a Backbone model
     * as it offered no benefits for
     * this case, merely code scramble
     */
    return function(def) {
        return _.defaults(def, defaults);
    };

});
