define(['jquery', 'underscore', 'backbone', '../graphics', 'util/dom-util'], function($, _, Backbone, graphics, domUtil) {


    var FrontView = Backbone.View.extend({
        el: '#canvas-center',
        
        initialize: function(options) {
            _.bindAll(this, "reset");
            //this.listenTo(options.dispatcher, 'snapshot', this.snapshot);
            this.listenTo(options.dispatcher, 'reset', this.reset);
            this.listenTo(options.dispatcher, 'modified:chair', this.reset);
            this.listenTo(options.dispatcher, 'modified:person', this.reset);
            this.options = options;
            this.model = {
                chair: options.chairModel.attributes['front'],
                person: options.personModel.attributes['front']
            }
        },
        render: function() {
            var frontCvs = document.createElement('canvas');
            frontCvs.id = 'canvas-front';
            // style heith/width are not used
            this.basePos = { // TODO get from wheel above ground in physics?
                x: this.options.width/2.0,
                y: 300.0
            };
            frontCvs.width = this.options.width;
            frontCvs.height = this.options.height;
            this.$el.append(frontCvs);
            this.reset();
        },
        // draw can live in init, unlike the side view
        reset: function() {
            console.log('front reset query length='+this.$('#canvas-front').length);
            var gx = graphics,
                context = this.$('#canvas-front')[0].getContext('2d'),
                draw = gx.getDrawSimple(context);

            // get image dimensions from current size
            for(var part in this.model.person) {
                console.log(this.model.person[part].name);
                var size = this.model.person[part].size;
                var dims = {
                    x: domUtil.inchesToPixels(size.x),
                    y: domUtil.inchesToPixels(size.y)
                };
                this.model.person[part].dims = dims;
            }

            this.setPositions();

            var arrayOfParts = [];
            for(var p in this.model.person) { arrayOfParts.push(this.model.person[p]); }
            draw(arrayOfParts);
            /*
            // hack until we find race condition, element load
            // not sufficient
            var self = this;
            if(this.token) {
                window.clearInterval(this.token);
            } else {
                var token = window.setInterval(function() {
                }, 100);
                window.setTimeout(function() {
                    window.clearInterval(token);
                }, 500);
                        
            } 
            */
        },

        setPositions: function() {

            var cf = this.model.chair,
                pf = this.model.person;

            var norm = domUtil.inchesToPixels;

            var person = this.options.personModel,
                upperArmWidth = person.get('upperArmWidth'),
                upperArmLength = person.get('upperArmLength'),
                lowerArmWidth = person.get('lowerArmWidth'),
                lowerArmLength = person.get('lowerArmLength'),
                upperLegWidth = person.get('upperLegWidth'),
                upperLegLength = person.get('upperLegLength'),
                lowerLegWidth = person.get('lowerLegWidth'), 
                lowerLegLength = person.get('lowerLegLength'), 
                torsoLength = person.get('torsoLength'),
                trunkDepth = person.get('trunkDepth'),
                chestWidth = person.get('chestWidth'),
                footLength = person.get('footLength'),
                footWidth = person.get('footWidth');

            var aboveWaist = torsoLength - upperLegWidth,
                mh = aboveWaist * (6.8/17), // experimental ratio
                ch = aboveWaist - mh;

            var seatPos = this.basePos;
            pf.waist.pos.x = seatPos.x - norm(pf.waist.size.x/2);
            pf.waist.pos.y = seatPos.y - norm(pf.waist.size.y);

            pf.chest.pos.x = seatPos.x - norm(pf.chest.size.x/2);
            pf.chest.pos.y = seatPos.y - norm(torsoLength); // - norm(pf.waist.size.y + ch);

            //pf.midsection.pos.x = seatPos.x - norm(pf.midsection.size.x/2);
            pf.midsection.pos.x = norm(pf.midsection.size.x/2);
            pf.midsection.pos.y = seatPos.y - norm(0.8*pf.waist.size.y + pf.midsection.size.y);

            pf.head.pos.x = seatPos.x - norm(pf.head.size.x/2);
            pf.head.pos.y = seatPos.y - norm(torsoLength + pf.head.size.y);

            pf.neck.pos.x = seatPos.x - norm(pf.neck.size.x/2);
            pf.neck.pos.y = seatPos.y - norm(torsoLength + pf.neck.size.y);

            pf.leg.pos.x = seatPos.x - norm(pf.waist.size.x/2);
            pf.leg.pos.y = seatPos.y - norm(0.33 * pf.leg.size.y);
        }
    });

    return FrontView;
});
