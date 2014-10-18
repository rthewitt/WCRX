define(["jquery", "underscore", "backbone", "text!humanTemplate"], function($, _, Backbone, templateH) {

    var PMV = Backbone.View.extend({

        el: "#person-measures",

        events: {
            "change input":"changed",
            "change select":"changed"
        },

        initialize: function(options) {
            this.dispatcher = options.dispatcher;
            this.model = options.personModel;
            _.bindAll(this, "changed");
            this.model.resize();
        },
        
        close: function() {
            this.$el.empty();
            this.unbind();
        },

        decorate: function() {
            this.$('select').each(function(i, elem) { 
                $(elem).customSelect(); 
            });

            var self = this;
            this.$(":input").focus(function() {
                self.$("label[for='" + this.id + "']").addClass("labelfocus");
            }).blur(function() {
                self.$("label").removeClass("labelfocus");
            });
        },

        render: function() {
            var ct = _.template(templateH);
            this.$el.html(ct(this.model.attributes));
            this.decorate();
        },

        changed: function(evt) {
            var changed = evt.currentTarget;
            var value = $(evt.currentTarget).val();
            var mx = this.model.set(changed.name, parseFloat(value));
            this.model.resize();
            this.dispatcher.trigger('modified:person');
        },

        
        // TODO move this into separate controller
          
        setPositions: function(pBodies) {
            // TODO use chair seat, person moves vertically
            var pd = this.model.get('person');
            var seatPos = pBodies.waist.GetPosition();
            var offset = new b2Vec2(0, pd.waist.get('size').y);
            seatPos.Add(offset);

            /*
            var b2Body = Box2D.Dynamics.b2Body;
            for(b = bodyListHead; b; b = b.GetNext()) {
                if(b.GetType() == b2Body.b2_dynamicBody) {
                    var bPos = b.GetPosition();
                }
            }
            */
        },

        // TODO move into front controller
        resizeFront: function() {
            var pf = this.model.get('front'),
                torsoLength = this.model.get('torsoLength'),
                upperLegWidth = this.model.get('upperLegWidth'),
                chestWidth = this.model.get('chestWidth');


            var aboveWaist = torsoLength - upperLegWidth,
                mh = aboveWaist * (6.8/17), // experimental
                ch = aboveWaist - mh; // experimental

            pf.head.set('size', { x: 9, y: 7 * 3/2 });
            pf.chest.set('size', { x: chestWidth, y: ch });
            pf.waist.set('size', { x: 10, y: 5 }); // FIXME
            pf.leg.set('size', { x: 7, y: 20 }); // FIXME


            /* TODO place back into view controller
            for(var pfp in pf) {
                var part = pf[pfp];
                var size = part.get('size');
                if(size.x > 0 && size.y > 0)
                    part.set('dims', { x: size.x * PTM / ITM, y: size.y * PTM / ITM });
                else part.set('dims', { x: 50, y: 50 }); // REMOVE
            }
            */
        }
    });

    return PMV;
});
