define(['jquery', 'underscore', 'backbone', './image-data', '../config'], function($, _, Backbone, ImageData, config) {

    var ChairModel = Backbone.Model.extend({

        defaults: {
            wheelDiameter: 24,
            wheelWidth: 4, // tire, handle, spokes (front)
            seatBackWidth: 0.4,
            seatWidth: 15,
            frameHeight: 11, // estimated
            frameDepth: 18.5, // estimated
            seatBackHeight: 13,
            axleDistance: 3.5, // representing COG (side)
            axleGap: 2.75, // distance between wheel and seat edge (front)
            raiseBarLength: 5,
            seatDepth: 13,
            foamHeight: 2,
            groundClr: 0.0,
            dump: 0.0
        },

        broadcast: function() {
            //this.dispatcher.trigger('mycustom');
        },
        
        initialize: function(model, options) {

            this.dispatcher = options.dispatcher;

            var toMake = {
                side: options.chairSide,
                front: options.chairFront
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
            this.resizeSide();
            this.resizeFront();
        },

        resizeSide: function() {
            var wc = this.get('side'),
                seatBackWidth = this.get('seatBackWidth'),
                seatBackDepth = this.get('seatBackDepth'),
                seatBackHeight = this.get('seatBackHeight'),
                foamHeight = this.get('foamHeight'),
                raiseBarLength = this.get('raiseBarLength'),
                frameDepth = this.get('frameDepth'),
                frameHeight = this.get('frameHeight'),
                seatDepth = this.get('seatDepth'),
                wheelDiameter = this.get('wheelDiameter');

            // side view "sits on top" of foam - verify height changes
            wc.seatBack.size = { x: seatBackWidth, y: seatBackHeight - foamHeight }; 
            wc.foam.size = { x: seatDepth, y: foamHeight }; 
            wc.handlebars.size = { x: 6 , y: (4/3) * seatBackHeight };
            wc.wheel.size = { r: wheelDiameter / 2 }; 

            wc.supportWheel.size = { r: 2.5 };
            wc.frameConnector.size = { x: 3, y: 6 }; 
            wc.frontConnector.size = { x: 4, y: 7 };  // FIXME height diff
            wc.raiseBar.size = { x: 2.25, y: raiseBarLength }; 
            wc.LBar.size = { x: frameDepth, y: frameHeight }; 
            wc.footRest.size = { x: 4, y: 6 }; // estimated

            this.normalize();
        },

        resizeFront: function() {
            var wcf = this.get('front'),
                seatBackHeight = this.get('seatBackHeight'),
                seatWidth = this.get('seatWidth'),
                wheelWidth = this.get('wheelWidth'),
                foamHeight = this.get('foamHeight'),
                frameHeight = this.get('frameHeight'),
                axleGap = this.get('axleGap'),
                seatDepth = this.get('seatDepth'),
                wheelDiameter = this.get('wheelDiameter');
            
            wcf.leftWheel.size = { x: wheelWidth, y: wheelDiameter };
            wcf.rightWheel.size = { x: wheelWidth, y: wheelDiameter };
            wcf.seatBack.size = { x: seatWidth, y: seatBackHeight }; // actual seat not affected by foam: verify
            wcf.foam.size = { x: seatWidth, y: foamHeight };
            wcf.frame.size = { x: seatWidth + 2*axleGap, y: frameHeight + 6 }; // FIXME footrest inclusion, hardcoded
            wcf.leftHBar.size = { x: 1.25, y: (4/3) * seatBackHeight };
            wcf.rightHBar.size = { x: 1.25, y: (4/3) * seatBackHeight };
            // support/front wheels
            wcf.leftWheelFr.size = { x: 1.5 * axleGap, y: 2.5 + 7 }; // TODO all in defaults
            wcf.rightWheelFr.size = { x: 1.5 * axleGap, y: 2.5 + 7 }; // TODO all in defaults
        }
    });

    return ChairModel;
});
