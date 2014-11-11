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
            $(sideCvs).on('touchend', function(e) {
                alert('touch end received');
            });
            $(sideCvs).on('touchstart', function(e) {
                e.preventDefault();
            });
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
            alert('release - md was: '+isMouseDown);
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
