define(['jquery', 'underscore', 'backbone', './image-data', '../config'], function($, _, Backbone, ImageData, config) {

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
            this.dispatcher = options.dispatcher;

            this.construct(options.personDef, options.imgRoot);

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
        },

        construct: function(defs, imgRoot) {
            var person = {};
            for(var partName in defs) {
                var part = defs[partName];
                var img = new Image();
                img.src = imgRoot + part.name + '.svg';
                part.img = img;
                person[partName] = new ImageData(part);
            }
            this.set('person', person);
        },

        // convert to meters
        normalize: function() {
            var person = this.get('person');
            for(var p in person) {
                var size = person[p].size;
                for(var dim in size) {
                    size[dim] = size[dim] / config.ITM;
                }
            }
        },

        resize: function() {
            var ps = this.get('person'),
                upperArmWidth = this.get('upperArmWidth'),
                upperArmLength = this.get('upperArmLength'),
                lowerArmWidth = this.get('lowerArmWidth'),
                lowerArmLength = this.get('lowerArmLength'),
                upperLegWidth = this.get('upperLegWidth'),
                upperLegLength = this.get('upperLegLength'),
                lowerLegWidth = this.get('lowerLegWidth'), 
                lowerLegLength = this.get('lowerLegLength'), 
                torsoLength = this.get('torsoLength'),
                trunkDepth = this.get('trunkDepth'),
                footLength = this.get('footLength'),
                footWidth = this.get('footWidth');

            var sRad = upperArmWidth/2;

            var aboveWaist = torsoLength - upperLegWidth,
                mh = aboveWaist * (6.8/17), // experimental ratio
                ch = aboveWaist - mh;

            var kRad = lowerLegWidth/2; 
            var hack = 1; // leg offset

            ps.shoulder.size = { r: sRad }; 
            ps.upperArm.size = { x: upperArmWidth, y: upperArmLength };
            ps.lowerArm.size = { x: lowerArmWidth, y: lowerArmLength };
            ps.waist.size = { x: upperLegWidth, y: upperLegWidth };
            ps.midsection.size = { r: mh/2 };
            ps.chest.size = { x: trunkDepth, y: ch };
            ps.head.size = { x: 9, y: 7 * 3/2 };
            ps.neck.size = { x: trunkDepth / 2.5, y: 6 }; // FIXME
            ps.knee.size = { r: kRad };
            ps.foot.size = { x: footWidth, y: footLength }; 
            ps.upperLeg.size = { x: upperLegLength - kRad - hack, y: upperLegWidth };
            ps.lowerLeg.size = { x: lowerLegLength - kRad - footWidth, y: lowerLegWidth };

            this.normalize();
        }

    });

    return PersonModel;
});
