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
            this.resize();
        },
        close: function() {
            this.$el.empty();
            this.unbind();
        },
        decorate: function() {
            this.$('select').each(function(i, elem) { 
                $(elem).customSelect(); 
            });
        },
        render: function() {
            var ct = _.template(templateH);
            this.$el.html(ct(this.model.attributes));
            this.decorate();
        },
        changed: function(evt) {
            console.log('changing person measure view');
            var changed = evt.currentTarget;
            var value = $(evt.currentTarget).val();
            var mx = this.model.set(changed.name, parseFloat(value));
            this.resize();
            this.dispatcher.trigger('modified:person');
        },

        /*******************
         * Controller Logic
         ********************/
        resize: function() {
            console.log('resizing, but WHY?');
            var ps = this.model.get('person'),
                upperArmWidth = this.model.get('upperArmWidth'),
                upperArmLength = this.model.get('upperArmLength'),
                lowerArmWidth = this.model.get('lowerArmWidth'),
                lowerArmLength = this.model.get('lowerArmLength'),
                upperLegWidth = this.model.get('upperLegWidth'),
                upperLegLength = this.model.get('upperLegLength'),
                lowerLegWidth = this.model.get('lowerLegWidth'), 
                lowerLegLength = this.model.get('lowerLegLength'), 
                torsoLength = this.model.get('torsoLength'),
                trunkDepth = this.model.get('trunkDepth'),
                footLength = this.model.get('footLength'),
                footWidth = this.model.get('footWidth');

            var sRad = upperArmWidth/2;

            var aboveWaist = torsoLength - upperLegWidth,
                mh = aboveWaist * (6.8/17), // experimental ratio
                ch = aboveWaist - mh;

            var kRad = lowerLegWidth/2; 

            ps.shoulderJ.set('size', { r: sRad }); 
            ps.upperArm.set('size', { x: upperArmWidth, y: upperArmLength });
            ps.lowerArm.set('size', { x: lowerArmWidth, y: lowerArmLength });
            ps.waist.set('size', { x: upperLegWidth, y: upperLegWidth });
            ps.midsection.set('size', { r: mh/2 });
            ps.chest.set('size', { x: trunkDepth, y: ch });
            ps.head.set('size', { x: 9, y: 7 * 3/2 });
            ps.neck.set('size', { x: trunkDepth / 2.5, y: 6 }); // FIXME
            ps.kneeJ.set('size', { r: kRad });
            ps.foot.set('size', { x: footWidth, y: footLength }); 

            var hack = 1;
            ps.upperLeg.set('size',
                    { x: upperLegLength - kRad - hack, y: upperLegWidth });
            ps.lowerLeg.set('size',
                    { x: lowerLegLength - kRad - footWidth, y: lowerLegWidth });
        },
        // move this into separate controller
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
