define(['jquery', 'underscore', 'backbone', './image-data', '../config'], function($, _, Backbone, ImageData, config) {

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

            var toMake = {
                side: options.chairSide
            };
            this.construct(toMake, options.imgRoot);

            this.on('change:wheelDiameter', this.broadcast);
            this.on('change:axleDistance', this.broadcast);
            //this.on('change:seatWidth', this.broadcast); // no trigger yet, snapshot is separate functionality
            this.on('change:seatBackWidth', this.broadcast);
            this.on('change:seatBackHeight', this.broadcast);
            this.on('change:seatDepth', this.broadcast);
            this.on('change:foamHeight', this.broadcast);
        },

        construct: function(constructs, imgRoot) {
            for(var construct in constructs) {

                var defs = constructs[construct],
                    chair = {};

                for(var partName in defs) {
                    var part = defs[partName];
                    var img = new Image();
                    img.src = imgRoot + construct + '/' + part.name + '.svg';
                    part.img = img;
                    chair[partName] = new ImageData(part);
                }
                this.set(construct, chair);
            }
        },

        // convert to meters
        normalize: function() {
            var chair = this.get('side');
            for(var p in chair) {
                var size = chair[p].size;
                for(var dim in size) {
                    size[dim] = size[dim] / config.ITM;
                }
            }
        },

        resize: function() {
            var wc = this.get('side'),
                seatBackWidth = this.get('seatBackWidth'),
                seatBackHeight = this.get('seatBackHeight'),
                foamHeight = this.get('foamHeight'),
                seatDepth = this.get('seatDepth'),
                wheelDiameter = this.get('wheelDiameter');

            wc.seatBack.size = { x: seatBackWidth, y: seatBackHeight - foamHeight };
            wc.foam.size = { x: seatDepth, y: foamHeight }; 
            wc.handlebars.size = { x: 6 , y: (4/3) * seatBackHeight };
            wc.wheel.size = { r: wheelDiameter / 2 }; 
            wc.supportWheel.size = { r: 2.5 };
            wc.frameConnector.size = { x: 3, y: 6 }; 
            wc.frontConnector.size = { x: 4, y: 7 };  // FIXME height diff
            wc.raiseBar.size = { x: 2.25, y: 5 }; 
            wc.LBar.size = { x: 18.5, y: 11 }; // estimated
            wc.footRest.size = { x: 4, y: 6 }; // estimated

            this.normalize();
        }

    });

    return ChairModel;
});
