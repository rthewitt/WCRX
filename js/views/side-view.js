define(['jquery', 'underscore', 'backbone', '../graphics', '../phys', '../util/dom-util'], 

        function($, _, Backbone, graphics, Physics, domUtil) {

    // this will break, "static" // FIXME
    var isMouseDown;

    var PSV = Backbone.View.extend({

        el: '#canvas-center',

        initialize: function(options) {
            _.bindAll(this, "reset");
            _.bindAll(this, "onMouseMove");
            _.bindAll(this, "onMouseUp");
            _.bindAll(this, "drawBg");

            this.listenTo(options.dispatcher, 'snapshot', this.snapshot);
            this.listenTo(options.dispatcher, 'reset', this.reset);
            this.listenTo(options.dispatcher, 'modified:chair', this.reset);
            this.listenTo(options.dispatcher, 'modified:person', this.reset);
            
            var physics = new Physics(options.chairModel, options.personModel);

            this.options = options;
            this.physics = physics;
            this.dispatcher = options.dispatcher;
        },

        // cleanup
        remove: function() { 
            this.haltPhysics();
            delete this.physics;
            delete this.canvasPos;
            this.unbind();
            this.$('canvas-side').off('mouseup mousedown mousemove');
            Backbone.View.prototype.remove.apply(this, arguments);
        },

        render: function() {
            var sideCvs = document.createElement('canvas');
            $(sideCvs).css({ 'right': '20%', 'z-index': 2 });
            sideCvs.id = 'canvas-side';
            // canvas coordinates are specified by attributes
            // style heith/width are not used
            sideCvs.width = this.options.width;
            sideCvs.height = this.options.height;
            this.$el.append(sideCvs);

            $(sideCvs).on('mousemove', this.onMouseMove);
            $(sideCvs).on('mouseup', this.onMouseUp);
            $(sideCvs).on('mousedown', function(e) {
                isMouseDown = true;
            });
            var self = this;
            $(sideCvs).on('touchstart', function(e) { e.preventDefault(); });
            $(sideCvs).on('touchmove', function(e) {
                var ev = e.originalEvent;
                self.bg.x = ev.changedTouches[0].pageX - self.canvasPos.x - self.options.width/2;
                self.bg.y = ev.changedTouches[0].pageY - self.canvasPos.y - self.options.height/2;
                self.drawBg();
            });

            this.canvasPos = domUtil.getElementPos(sideCvs);
            this.reset();
        },

        reset: function() {
            this.haltPhysics();
            var physics = this.physics;

            physics.reset();

            var gx = graphics,
                context = this.$('#canvas-side')[0].getContext('2d'),
                draw = gx.getDraw(context);

            gx.setDebug(physics.world, context);
            physics.token = window.setInterval(function() {
                physics.update(draw);
            }, 1000 / 60);
        },

        haltPhysics: function() {
            var physics = this.physics;
            if(!!physics.token) {
                window.clearInterval(physics.token);
                delete physics.token;
            }
        },

        // Repurposed for image injection
        snapshot: function() {
            var interim = document.createElement('canvas');
            interim.width = 640;
            interim.height = 480;
            interim.getContext('2d').drawImage($('#video')[0], 
                0, 0, 640, 480);

            var bgImg = new Image();
            bgImg.src = interim.toDataURL();

            this.loadBGImage(bgImg);
        },

        hasPerson: function() {
            return this.physics.humanParts.initted;
        },

        hasChair: function() {
            return this.physics.chairParts.initted;
        },

        togglePerson: function() {
            var physics = this.physics;
            if(!this.hasPerson()) {
                physics.initPerson(true);
            } else physics.destroyPerson();
        },

        toggleChair: function() {
            var physics = this.physics;
            if(!this.hasChair()) {
                physics.initChair(true);
            } else physics.destroyChair();
        },

        loadBGImage: function(bgImg) {
            var bgCv = $('#bg-canvas');
            bgCv.css({ 'right': '20%', 'z-index': 0 })
            bgCv[0].width = this.options.width;
            bgCv[0].height = this.options.height;

            this.bg = {
                img: bgImg,
                ctx: bgCv[0].getContext('2d'),
                x: 0,
                y: 0
            };



            var self = this;
            $(bgImg).on('load', function() {
                self.drawBg();
                self.dispatcher.trigger('side:bgimage', { x: bgImg.width, y: bgImg.height });
            });

            var bg = this.bg;
            $(document).keydown(function(e) {
                switch(e.keyCode) {
                    case 37: // left
                        bg.x -= 5;
                        break;
                    case 38: // up
                        bg.y -= 5;
                        break;
                    case 39: // right
                        bg.x += 5;
                        break;
                    case 40: // down
                        bg.y += 5;
                        break;

                    // TODO make these ratios
                    case 90: // zoom (z)
                        bg.width += 5;
                        bg.height += 5;
                        break;
                    case 88: // zoom out (x)
                        bg.width -= 5;
                        bg.height -= 5;
                        break;
                }
                self.drawBg();
            });
        },

        drawBg: function() {
            var bg = this.bg;

            if(typeof bg.width === 'undefined') bg.width = bg.img.width;
            if(typeof bg.height === 'undefined') bg.height = bg.img.height;

            bg.ctx.clearRect(0, 0, bg.ctx.canvas.width, bg.ctx.canvas.height);
            bg.ctx.drawImage(bg.img, bg.x, bg.y, bg.width, bg.height);
        },

        sizeBGImage: function(dims) {
            this.bg.width = dims.x;
            this.bg.height = dims.y;
            this.drawBg();
        },

        onMouseMove: function(e) {
            var physics = this.physics;
            mouseX = (e.clientX - this.canvasPos.x) / this.options.conf.PTM;
            mouseY = (e.clientY - this.canvasPos.y) / this.options.conf.PTM;
            //console.log('x: '+mouseX + ', y: '+mouseY);
            if(isMouseDown && !physics.mouseJoint) 
                physics.setupMouseJoint(mouseX, mouseY);

            physics.handleMouseDrag(mouseX, mouseY);
        },

        onMouseUp: function() {
            var physics = this.physics;
            if(physics.mouseJoint) 
                physics.destroyMouseJoint();

            if(!physics.isFootRestWelded()) {
                physics.weldFootRest();
                $('#ground-clr').val(physics.calcGroundClearance());
            }
            isMouseDown = false;
        }
    });

    return PSV;
});
