define(['jquery', 'underscore', 'backbone', '../graphics', '../phys', '../dom-util'], function($, _, Backbone, graphics, Physics, domUtil) {

    var isMouseDown;

    var PSV = Backbone.View.extend({
        el: '#canvas-center',
        initialize: function(options) {
            _.bindAll(this, "reset");
            _.bindAll(this, "onMouseMove");
            _.bindAll(this, "onMouseUp");
            
            var physics = new Physics();
            graphics.init(options.conf);
            physics.init(options.conf, options.chairModel, options.personModel);

            this.options = options;
            this.physics = physics;
            console.log('side initialized');
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
        reset: function() {
            console.log('should be resetting...');

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
        render: function() {
            var sideCvs = document.createElement('canvas');
            sideCvs.id = 'canvas-side';
            // canvas coordinates are specified by attributes
            // style heith/width are not used
            sideCvs.width = this.options.width;
            sideCvs.height = this.options.height;
            this.$el.append(sideCvs);
            var self = this;

            $(sideCvs).on('mousemove', this.onMouseMove);
            $(sideCvs).on('mouseup', this.onMouseUp);
            $(sideCvs).on('mousedown', function() {
                isMouseDown = true;
            });

            this.canvasPos = domUtil.getElementPos(sideCvs);
            this.reset();
        },
        haltPhysics: function() {
            var physics = this.physics;
            if(!!physics.token) {
                window.clearInterval(physics.token);
                delete physics.token;
            }
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
