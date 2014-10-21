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
            this.basePos = { 
                x: this.options.width / 2.0,
                y: this.options.height - 40
            };
            frontCvs.width = this.options.width;
            frontCvs.height = this.options.height;
            this.$el.append(frontCvs);
            this.reset();
        },

        setDims: function(coll) {
            for(var part in coll) {
                console.log(coll[part].name);
                var size = coll[part].size;
                var dims = {
                    x: domUtil.inchesToPixels(size.x),
                    y: domUtil.inchesToPixels(size.y)
                };
                coll[part].dims = dims;
            }
        },

        // draw can live in init, unlike the side view
        reset: function() {
            console.log('front reset query length='+this.$('#canvas-front').length);
            var gx = graphics,
                context = this.$('#canvas-front')[0].getContext('2d'),
                draw = gx.getDrawSimple(context);

            this.setDims(this.model.chair);
            this.setDims(this.model.person);

            this.setPositions();

            var arrayOfParts = [];
            var p;
            for(p in this.model.person) { arrayOfParts.push(this.model.person[p]); }
            for(p in this.model.chair) { arrayOfParts.push(this.model.chair[p]); }
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
            this.positionChair();
            this.positionPerson();
        },

        positionChair: function() {
            var cf = this.model.chair;
            var norm = domUtil.inchesToPixels;

            var chair = this.options.chairModel,
                seatWidth = chair.get('seatWidth'),
                raiseBarLength = chair.get('raiseBarLength'),
                wheelDiameter = chair.get('wheelDiameter');

            var basePos = this.basePos;
            var wheelWidth = 3; // handle, tire, spokes...

            cf.leftWheel.pos.x = basePos.x - norm(seatWidth/2 + wheelWidth);
            cf.leftWheel.pos.y = basePos.y - norm(wheelDiameter);

            cf.rightWheel.pos.x = basePos.x + norm(seatWidth/2);
            cf.rightWheel.pos.y = basePos.y - norm(wheelDiameter);
        },

        positionPerson: function() {
            var pf = this.model.person;
            var norm = domUtil.inchesToPixels;

            var person = this.options.personModel,
                chair = this.options.chairModel,
                raiseBarLength = chair.get('raiseBarLength'),
                wheelDiameter = chair.get('wheelDiameter'),
                foamHeight = chair.get('foamHeight'),
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

            /*
            var aboveWaist = torsoLength - upperLegWidth,
                mh = aboveWaist * (6.8/17), // experimental ratio
                ch = aboveWaist - mh;
                */
            var frAboveWaist = torsoLength - upperLegWidth,
                fmh = frAboveWaist * (3/7), // experimental ratio
                fch = frAboveWaist - fmh;

            var seatPos = {
                x: this.basePos.x,
                y: this.basePos.y - norm(wheelDiameter/2 + raiseBarLength + foamHeight) 
            }

            pf.waist.pos.x = seatPos.x - norm(pf.waist.size.x/2);
            pf.waist.pos.y = seatPos.y - norm(pf.waist.size.y);

            pf.chest.pos.x = seatPos.x - norm(pf.chest.size.x/2);
            pf.chest.pos.y = seatPos.y - norm(torsoLength);

            pf.midsection.pos.x = seatPos.x - norm(pf.midsection.size.x/2);
            pf.midsection.pos.y = seatPos.y - norm(0.9*pf.waist.size.y + pf.midsection.size.y);

            pf.head.pos.x = seatPos.x - norm(pf.head.size.x/2);
            pf.head.pos.y = seatPos.y - norm(torsoLength + pf.head.size.y);

            pf.neck.pos.x = seatPos.x - norm(pf.neck.size.x/2);
            pf.neck.pos.y = seatPos.y - norm(torsoLength + 0.8*pf.neck.size.y);

            pf.leftLeg.pos.x = seatPos.x - norm(pf.waist.size.x/2);
            pf.rightLeg.pos.x = seatPos.x // - norm(pf.waist.size.x/2);
            pf.leftLeg.pos.y = seatPos.y - norm(0.33 * pf.leftLeg.size.y);
            pf.rightLeg.pos.y = seatPos.y - norm(0.33 * pf.rightLeg.size.y);
        }
    });

    return FrontView;
});
