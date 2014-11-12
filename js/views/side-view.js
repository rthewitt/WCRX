define(['jquery', 'underscore', 'backbone', '../graphics', '../phys', '../util/dom-util', 'text!armTemplate'], 

        function($, _, Backbone, graphics, Physics, domUtil, armTemplate) {

    // this will break, "static" // FIXME
    var isMouseDown;

    var PSV = Backbone.View.extend({

        el: '#canvas-center',

        initialize: function(options) {
            _.bindAll(this, "reset");
            _.bindAll(this, "onMouseMove");
            _.bindAll(this, "onMouseUp");

            this.listenTo(options.dispatcher, 'snapshot', this.snapshot);
            this.listenTo(options.dispatcher, 'reset', this.reset);
            this.listenTo(options.dispatcher, 'modified:chair', this.reset);
            this.listenTo(options.dispatcher, 'modified:person', this.reset);
            
            var physics = new Physics(options.chairModel, options.personModel);

            this.options = options;
            this.physics = physics;

            this.loadBGImage(); // should sep into another view...
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
            var self = this;

            $(sideCvs).on('mousemove', this.onMouseMove);
            $(sideCvs).on('mouseup', this.onMouseUp);
            $(sideCvs).on('mousedown', function(e) {
                isMouseDown = true;
            });

            this.canvasPos = domUtil.getElementPos(sideCvs);
            this.reset();
        },

        reset: function() {
            var physics = this.physics;
            this.haltPhysics();

            var snapshotDiv = $('#armies');
            if(snapshotDiv.length) snapshotDiv.remove();

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

        snapshot: function() {
            this.haltPhysics();
            var variables = this.physics.snapshot(this.canvasPos);

            var at = _.template(armTemplate);
            $('body').append(at(variables));

            var E = variables.E,
                F = variables.F,
                W = variables.W,
                alpha = variables.alpha,
                beta = variables.beta;

            $('#skew-upper').css({ 'transform-origin': '50% 0%' });
            $('#skew-upper').css('transform', 'rotateY(-'+Math.atan(W/F)+'rad) rotateZ('+(alpha)+'rad)');

            var elbowY = Math.floor(E * this.options.conf.PTM / this.options.conf.ITM);
            $('#skew-lower').css({ 'transform-origin': '50% 0%', top: elbowY });
            $('#skew-lower').css('transform', 'rotateZ('+ -beta +'rad)');
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

        loadBGImage: function() {
            var bgImg = new Image();
            bgImg.src = "images/bg.jpg";
            var bgCv = $('#bg-canvas');
            bgCv.css({ 'right': '20%', 'z-index': 0 })
            bgCv[0].width = this.options.width;
            bgCv[0].height = this.options.height;
            var bgCtx = bgCv[0].getContext('2d');

            var isActive = false;
            var bgX = 0, 
                bgY = 0, 
                zX, zY; // zoom

            function drawBg(x, y, dx, dy) {
                bgCtx.clearRect(0, 0, bgCtx.canvas.width, bgCtx.canvas.height);
                bgCtx.drawImage(bgImg, bgX, bgY, dx, dy);
            }

            $(bgImg).on('load', function(){ 
                zX = bgImg.width;
                zY = bgImg.height;
                drawBg(0, 0, zX, zY);
            })

            $(document).keydown(function(e) {
                switch(e.keyCode) {
                    case 37: // left
                        bgX -= 5;
                        break;
                    case 38: // up
                        bgY -= 5;
                        break;
                    case 39: // right
                        bgX += 5;
                        break;
                    case 40: // down
                        bgY += 5;
                        break;
                    case 90: // zoom (z)
                        zX += 5;
                        zY += 5;
                        break;
                    case 88: // zoom out (x)
                        zX -= 5;
                        zY -= 5;
                        break;
                }
                drawBg(bgX, bgY, zX, zY);
            });

            //$(bgImg).on('touchstart', function() {
            $(bgImg).on('click', function() {
                bgX -= 5;
            });
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
