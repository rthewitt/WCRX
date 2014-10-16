define(['jquery', 'underscore', 'backbone', '../graphics', '../phys', '../dom-util'], function($, _, Backbone, graphics, Physics, domUtil) {

    var PSV = Backbone.View.extend({
        el: '#canvas-center',
        initialize: function(options) {
            _.bindAll(this, "reset");
            
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
            Backbone.View.prototype.remove.apply(this, arguments);
        },
        haltPhysics: function() {
            var physics = this.physics;
            if(!!physics.token) {
                window.clearInterval(physics.token);
                delete physics.token;
            }
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
            $(sideCvs).on('mousemove', function() {
                onMouseMove.apply(self, arguments); 
            });
            this.canvasPos = domUtil.getElementPos(sideCvs);
            this.reset();
        }
    });


    function onMouseMove(e) {
        mouseX = (e.clientX - this.canvasPos.x) / this.options.conf.PTM;
        mouseY = (e.clientY - this.canvasPos.y) / this.options.conf.PTM;
        console.log('x: '+mouseX + ', y: '+mouseY);
        //console.log('box2d x: '+ (e.clientX/config.PTM)+ ', box2d y: '+(e.clientY/config.PTM));

        /*
        var p = new Box2D.Common.Math.b2Vec2(mouseX, mouseY);
        var body = sim.physics.getBodyAtPos(p);
        var hParts = sim.physics.humanParts,
            cParts = sim.physics.chairParts;
        if(isMouseDown && !sim.mouseJoint) {
            if(body) {
                if(body === sim.physics.humanPartBodies.upperLeg) {
                    var seatRev = hParts.joints.seatRev;
                    var seatSlide = hParts.joints.seatSlide;
                    console.log('breaking bond...');
                    if(seatRev) {
                        hParts.joints.seatRev = undefined;
                        sim.physics.world.DestroyJoint(seatRev);
                    }
                    if(seatSlide && seatSlide.IsMotorEnabled()) {
                        console.log('turning off motor');
                        seatSlide.EnableMotor(false);
                    }
                } else if(body === sim.physics.chairPartBodies.footRest) {
                    var frWeld = cParts.joints.footRest;
                    if(frWeld) {
                        cParts.joints.footRest = undefined;
                        sim.physics.world.DestroyJoint(frWeld);
                    } 
                }
                var def = new Box2D.Dynamics.Joints.b2MouseJointDef();
                
                def.bodyA = sim.physics.ground;
                def.bodyB = body;
                def.target = p;

                def.collideConnected = true;
                def.maxForce = 100 * body.GetMass();
                def.dampingRatio = 0;

                sim.mouseJoint = sim.physics.world.CreateJoint(def);
                body.SetAwake(true);
            }
        }
        if(sim.mouseJoint) sim.mouseJoint.SetTarget(p);
        */
    }

    function onMouseUp() {
        if(sim.mouseJoint) {
            sim.physics.world.DestroyJoint(sim.mouseJoint);
            sim.mouseJoint = undefined;
            var seatSlide = sim.physics.humanParts.joints.seatSlide;
            if(seatSlide && !seatSlide.IsMotorEnabled()) {
                console.log('restoring bond');
                seatSlide.EnableMotor(true);
                seatSlide.SetMaxMotorForce(500);
                seatSlide.SetMotorSpeed(0.0);
            }
            var frWeld = sim.physics.chairParts.joints.footRest;
            if(!frWeld) {
                frWeld = sim.physics.weldFootRest();
                sim.physics.chairParts.joints.footRest = frWeld;
                $('#ground-clr').val(sim.physics.calcGroundClearance());
            }
        }
        isMouseDown = false;
    }

    return PSV;
});
