define(["jquery", "underscore", "backbone", "text!chairTemplate"], function($, _, Backbone, templateC) {

    var CMV = Backbone.View.extend({
        el: '#chair-measures',
        events: {
            "change input":"changed",
            "change select":"changed"
        },
        initialize: function(options) {
            this.dispatcher = options.dispatcher;
            this.model = options.chairModel;
            _.bindAll(this, "changed");
            this.resize(); 
        },
        decorate: function() {
            this.$('select').each(function(i, elem) { 
                $(elem).customSelect(); 
            });
        },
        close: function() {
            this.$el.empty();
            this.unbind();
        },
        render: function() {
            console.log('rendering chair controls');
            var ct = _.template(templateC);
            this.$el.html(ct(this.model.attributes));
            this.decorate();
        },
        changed: function(evt) {
            var changed = evt.currentTarget;
            var value = $(evt.currentTarget).val();
            var mx = this.model.set(changed.name, parseFloat(value));
            this.resize();
            this.dispatcher.trigger('modified:chair');
        },

        /*******************
         * Controller Logic
         ********************/
        resize: function() {
            var wc = this.model.get('wheelChair'),
                seatBackWidth = this.model.get('seatBackWidth'),
                seatBackHeight = this.model.get('seatBackHeight'),
                foamHeight = this.model.get('foamHeight'),
                seatDepth = this.model.get('seatDepth'),
                wheelDiameter = this.model.get('wheelDiameter');

            wc.seatBack.set('size', { x: seatBackWidth, y: seatBackHeight - foamHeight });
            wc.foam.set('size', { x: seatDepth, y: foamHeight }); 
            wc.handlebars.set('size', { x: 6 , y: (4/3) * seatBackHeight });
            wc.wheel.set('size', { r: wheelDiameter / 2 }); 
            wc.supportWheel.set('size', { r: 2.5 });
            wc.frameConnector.set('size', { x: 3, y: 6 }); 
            wc.frontConnector.set('size', { x: 4, y: 7 });  // FIXME height diff
            wc.raiseBar.set('size', { x: 2.25, y: 5 }); 
            wc.LBar.set('size', { x: 18.5, y: 11 }); // estimated
            wc.footRest.set('size', { x: 4, y: 6 }); // estimated
        }
    });

    return CMV;
});
