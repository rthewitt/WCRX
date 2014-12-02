define(['backbone', 'box2dweb', 'underscore', 'config'], function(Backbone, Box2D, _, config) {

    var chairX,
        chairY;

    var   b2Vec2 = Box2D.Common.Math.b2Vec2, 
          b2AABB = Box2D.Collision.b2AABB,
          b2BodyDef = Box2D.Dynamics.b2BodyDef,
          b2Body = Box2D.Dynamics.b2Body,
          b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
          b2Fixture = Box2D.Dynamics.b2Fixture,
          b2FilterData = Box2D.Dynamics.b2FilterData,
          b2World = Box2D.Dynamics.b2World,
          b2MassData = Box2D.Collision.Shapes.b2MassData,
          b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
          b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
          b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef,
          b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef,
          b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef,
          b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef,
          b2WeldJointDef = Box2D.Dynamics.Joints.b2WeldJointDef;

    function Physics(chairMeasures, humanMeasures) {

        // revisit this if we need multiple simulations
        chairX = this.pixels(125);
        chairY = this.pixels(300)-0.1-this.inches(3);
        
        this.chairMeasures = chairMeasures;
        this.humanMeasures = humanMeasures;
        this.chairParts = {
            joints: {},
            initted: false
        }; 
        this.humanParts = {
            joints: {},
            initted: false
        }; 
        this.chairPartBodies = {}; 
        this.humanPartBodies = {};
        // signals for time-step
        this.SIG_destroyChair = false;
        this.SIG_destroyPerson = false;
        this.haltUpdate = false;
    };

    function createGround() {
         var fixDef = new b2FixtureDef;
         fixDef.density = 1.0;
         fixDef.friction = 0.5;
         fixDef.restitution = 0.2;
         
         var bodyDef = new b2BodyDef;

         var gmd = new b2FilterData();
         gmd.categoryBits = config.bits.GROUND;
         gmd.maskBits = config.masks.ground;
         
         //create ground
         bodyDef.type = b2Body.b2_staticBody;
         fixDef.shape = new b2PolygonShape;
         fixDef.shape.SetAsBox(this.pixels(500), this.pixels(40));
         bodyDef.position.Set(0, this.pixels(500));
         this.ground = this.world.CreateBody(bodyDef);
         var gfx = this.ground.CreateFixture(fixDef);
         gfx.SetFilterData(gmd);
    }; 

    function setScaledPolygons(shapeArray, polygons, size) {
        for(var px=0; px<polygons.length; px++) {
            var polygon = polygons[px];
            var vertices = [];
            var poly;
            for(var p=0; p<polygon.length; p++) { 
                vertices.push(new b2Vec2(size.x * polygon[p].x, size.y * polygon[p].y)); 
            } 
            shapeArray.push(b2PolygonShape.AsVector(vertices, vertices.length));
        } 
    }


    function getBodyPart(idata, fixDef, bodyDef, isFixture) {

        var size = idata.size,
            shape,
            dims;

        var PTM = config.PTM; // this should be moved
        switch(idata.type) {
            case 'circle':
                //shape = new b2CircleShape(this.inches(size.r)); 
                shape = new b2CircleShape(size.r); 
                dims = { x: 2 * size.r * PTM, y: 2 * size.r * PTM };
                /*
                console.log('size: '+JSON.stringify(size));
                console.log(dims);
                */
                break;
            case 'poly':
                shape = [];
                dims = { x: size.x * PTM, y: size.y * PTM };
                /*
                console.log('vertices for '+idata.name);
                console.log('size: '+JSON.stringify(size));
                console.log(dims);
                */
                setScaledPolygons(shape, idata.polygons, size);
                break;
            case 'box':
                shape = new b2PolygonShape;
                dims = { x: size.x * PTM, y: size.y * PTM };
                shape.SetAsOrientedBox(size.x / 2, size.y / 2, new b2Vec2(0, 0), 0);
                break;
        }
        idata.dims = dims;
        idata.shape = shape;

        var fdd = new b2FilterData();
        fdd.categoryBits = idata.cat;
        fdd.maskBits = idata.mask;

        bodyDef.userData = idata;
        var body = this.world.CreateBody(bodyDef);
        //body.SetAngle(-1.7 * Math.PI);

        function reify(shape) {
            fixDef.shape = shape;

            var fixture;
            if(idata.massless === true) {
                var orig = fixDef.density;
                fixDef.density = 0.01;
                fixture = body.CreateFixture(fixDef);
                fixDef.density = orig;
            } else fixture = body.CreateFixture(fixDef);

            fixture.SetFilterData(fdd);
            fixDef.shape = undefined;
            bodyDef.userData = undefined;
            fixDef.userData = undefined;
        }

        if(shape instanceof Array) {
            _.each(shape, reify);
        } else reify(shape); 

        return body;
    }

    function getRevJoint(bA, bB, locA, locB, collide) {
        var jdf = new b2RevoluteJointDef();
        jdf.collideConnected = !!collide; 
        jdf.bodyA = bA;
        jdf.bodyB = bB;
        jdf.localAnchorA.Set(locA.x, locA.y);
        jdf.localAnchorB.Set(locB.x, locB.y);
        jdf.enableMotor = true;
        jdf.maxMotorTorque = 0.0;
        return this.world.CreateJoint(jdf);
    }

    function getWeldJoint(bA, bB, locA, locB) {
        var wjd = new b2WeldJointDef();
        wjd.bodyA = bA;
        wjd.bodyB = bB;
        wjd.localAnchorA.Set(locA.x, locA.y);
        wjd.localAnchorB.Set(locB.x, locB.y);
        return this.world.CreateJoint(wjd);
    }

    function expand(dims, pName) {
        return { 
            x: typeof dims.x === 'function' ? dims.x(pName) : dims.x,
            y: typeof dims.y === 'function' ? dims.y(pName) : dims.y
        }
    }

    function addRevJoint(name, pName1, pName2, loc1, loc2, collide) {
        var localA = expand(loc1, pName1),
            localB = expand(loc2, pName2);

        this.joints[name] = getRevJoint.call(this, 
                this.bodies[pName1], this.bodies[pName2],
                localA, localB, collide);
    }

    function addWeldJoint(name, pName1, pName2, loc1, loc2) {
        var localA = expand(loc1, pName1),
            localB = expand(loc2, pName2);

        this.joints[name] = getWeldJoint.call(this,
                this.bodies[pName1], this.bodies[pName2],
                localA, localB);
    }

    // get utility functions to simply code
    function conveniences(obj) {
        var cnv = {};
        cnv.X = function(name) {
            return obj[name].size.x;
        };
        cnv.Y = function(name) {
            return obj[name].size.y;
        };
        cnv.R = function(name) {
            return obj[name].size.r;
        };
        cnv.Near = function(func, ratio) {
            return function(name) {
                return ratio * func(name);
            }
        };
        cnv.Delta = function(func, delta) {
            return function(name) {
                return delta + func(name);
            }
        };
        cnv.Center = function(name) {
            return 0;
        };
        cnv.Bottom = function(name) {
            if(obj[name].type === 'circle')
                return cnv.R(name);
            return obj[name].size.y/2;
        };
        cnv.Top = function(name) {
            if(obj[name].type === 'circle')
                return -cnv.R(name);
            return -cnv.Bottom(name);
        };
        cnv.Right = function(name) {
            if(obj[name].type === 'circle')
                return cnv.R(name);
            return obj[name].size.x/2;
        };
        cnv.Left = function(name) {
            if(obj[name].type === 'circle')
                return -cnv.R(name);
            return -cnv.Right(name);
        };
        return cnv;
    }


    function initP(stabilize) {
        
        var humanFixDef = new b2FixtureDef(); 
        humanFixDef.density = 1.0;
        humanFixDef.friction = 0.9;
        humanFixDef.restitution = 0.1;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX+this.inches(2), chairY-1);


        var parts = this.humanParts,
            bodies = this.humanPartBodies,
            joints = this.humanParts.joints;

        var person = this.humanMeasures.get('side');
        for(var bp in person) {
            var b2b = getBodyPart.call(this, person[bp], humanFixDef, bodyDef);
            bodies[bp] = b2b;
            parts[bp] = b2b.GetUserData();
        }

        // setup convenience functions
        var cnv = conveniences(person),
            X = cnv.X, Y = cnv.Y, R = cnv.R,
            Top = cnv.Top,
            Center = cnv.Center,
            Bottom = cnv.Bottom,
            Left = cnv.Left,
            Right = cnv.Right,
            Delta = cnv.Delta,
            Near = cnv.Near;

        var ctx = {
            parts: parts,
            bodies: bodies,
            joints: joints,
            world: this.world,
            addRevJoint: addRevJoint,
            addWeldJoint: addWeldJoint
        };

        var legX = -X('upperLeg')/2 + X('waist')/2 - this.inches(1),
            legY = Y('upperLeg')/2 - Y('waist')/2;

        ctx.addRevJoint('neck_1', 'neck', 'head',
                { x: Near(Right, 0.4), y: Near(Top, 0.4) },
                { x: Near(Left, 0.15), y: Near(Bottom, 0.5) });
        
        ctx.addRevJoint('neck_2', 'neck', 'chest',
                { x: Near(Right, 0.4), y: Near(Bottom, 0.4) },
                { x: Center, y: Top });

        ctx.addWeldJoint('s_1', 'shoulder', 'chest',
                { x: Center, y: Center },
                { x: Near(Left, 0.4), y: Near(Top, 0.55) });

        ctx.addRevJoint('elbow_1', 'upperArm', 'elbow',
                { x: Center, y: Bottom }, { x: Center, y: Center });

        ctx.addWeldJoint('elbow_2', 'elbow', 'lowerArm',
                { x: Center, y: Center }, { x: Center, y: Top });
        
        
        ctx.addRevJoint('knee_1', 'knee', 'lowerLeg', 
                { x: Center, y: Center }, { x: Left, y: Center });

        ctx.addWeldJoint('knee_2',  'upperLeg', 'knee',
                { x: Right, y: Near(Bottom, 0.60) }, 
                { x: Center, y: Center });

        ctx.addWeldJoint('wrist_1',  'lowerArm', 'wrist',
                { x: Center, y: Bottom }, { x: Center, y: Center });

        ctx.addWeldJoint('wrist_2', 'wrist', 'hand', 
                { x: Center, y: Center },
                { x: Near(Left, 0.6), y: Top });

        ctx.addRevJoint('t2', 'waist', 'midsection',
                { x: Center, y: Top },
                { x: Near(Left, 2/3), y: Near(Bottom, 1/3) }, true);

        ctx.addRevJoint('t1', 'chest', 'midsection',
                { x: Center, y: Bottom },
                { x: Center, y: Near(Left, 2/3) }, true);

        ctx.addWeldJoint('foot', 'lowerLeg', 'foot',
                { x: Right, y: Near(Bottom, 0.65) },
                { x: Left, y: Bottom });

        ctx.addRevJoint('hip', 'upperLeg', 'waist', 
                { x: legX, y: legY }, 
                { x: Center, y: Center });

        ctx.addRevJoint('shoulder', 'upperArm', 'shoulder', 
                { x: Center, y: Top }, 
                { x: Center, y: Center });


        // TODO separate this into function
        // The order of these limits is the reverse of my assumption
        joints.neck_1.SetLimits(0 * Math.PI, 0 * Math.PI);
        joints.neck_1.EnableLimit(true);

        joints.neck_2.SetLimits(0 * Math.PI, 0 * Math.PI);
        joints.neck_2.EnableLimit(true);

        joints.knee_1.SetLimits(0, Math.PI);
        joints.knee_1.EnableLimit(true);

        joints.elbow_1.SetLimits(-0.8*Math.PI, 0);
        joints.elbow_1.EnableMotor(true);
        joints.elbow_1.SetMaxMotorTorque(500);
        joints.elbow_1.EnableLimit(true);

        joints.t1.SetLimits(-0.3 * Math.PI, 0.1 * Math.PI);
        joints.t1.EnableLimit(true);
        joints.t2.SetLimits(-1.9 * Math.PI, 0.2 * Math.PI);
        joints.t2.EnableLimit(true);
        
        parts.initted = true;


        if(!this.chairParts.initted) {
            if(stabilize) this.stabilize(25);
            return;
        }

        var waistPos = this.chairPartBodies.wheel.GetPosition();
        waistPos.Add(new b2Vec2(0, -this.inches(20)));
        bodies.waist.SetPosition(waistPos);
        var rr = person['midsection'].size.r;
        var midPos = new b2Vec2(-this.inches(0), -rr);
        midPos.Add(waistPos);
        bodies.midsection.SetPosition(midPos);
        var chestPos = new b2Vec2(-this.inches(0), -(rr+Y('chest')));
        chestPos.Add(midPos);
        bodies.chest.SetPosition(chestPos);

        var uaPos = new b2Vec2(-this.inches(2), 0);
        uaPos.Add(chestPos);
        bodies.upperArm.SetPositionAndAngle(uaPos, Math.PI/2);
        var laPos = new b2Vec2(-this.inches(2), 0);
        laPos.Add(midPos);
        bodies.elbow.SetPosition(laPos);
        bodies.lowerArm.SetPositionAndAngle(laPos, -Math.PI/2);


        var ulx = parts.upperLeg.size.x;
        var uly = parts.upperLeg.size.y/2;
        var llPos = new b2Vec2(ulx, uly);
        llPos.Add(waistPos);
        bodies.lowerLeg.SetPosition(llPos);
        var llx = parts.lowerLeg.size.x;
        var lly = parts.lowerLeg.size.y/2;
        var footPos = new b2Vec2(lly, llx);
        footPos.Add(llPos);
        bodies.foot.SetPosition(footPos);

        // individual will have a measured distance from seatback
        // where they make contact with seat bottom
        var seat = this.chairParts.foam;
        var extra = this.chairParts.seatBack.size.x;
        var delta = this.humanMeasures.get('contactPoint');
        var forward = this.inches(delta) + extra;
        var ss = seat.size
        var seatRev = getRevJoint.call(this, bodies.waist, this.chairPartBodies.foam,
                { x: -X('waist')/2, y: Y('waist')/2 }, 
                { x: -ss.x/2 + forward, y: -ss.y/2 }, true); 
        
        var ssld = new b2PrismaticJointDef();
        ssld.bodyA = bodies.waist;
        ssld.bodyB = this.chairPartBodies.foam;
        ssld.collideConnected = false;

        ssld.localAxisA.Set(1, 0); 
        ssld.localAxisA.Normalize(); // normalize to unit vector!
        ssld.localAnchorA.Set(-X('waist')/2, Y('waist')/2);
        ssld.localAnchorB.Set(-ss.x/2 + forward, -ss.y/2);
        ssld.lowerTranslation = -ss.x+forward + this.inches(3); // aesthetic inch
        ssld.upperTranslation = ss.x;
        ssld.enableLimit = true;

        var seatSlide = this.world.CreateJoint(ssld);
        seatSlide.EnableMotor(false);
        seatSlide.SetMaxMotorForce(500);
        seatSlide.SetMotorSpeed(0.0);
        joints.seatRev = seatRev;
        joints.seatSlide = seatSlide;

        var wrist = bindWrist.call(this);
        this.humanParts.joints.wrist = wrist;

        if(stabilize) this.stabilize(25);
    }

    // call with context
    function bindWrist() {
        if(!this.chairParts.initted || !this.humanParts.initted) return;
        var wheel = this.chairParts.wheel; 
        //return getRevJoint.call(this, this.humanPartBodies.hand, this.chairPartBodies.wheel, 
        return getRevJoint.call(this, this.humanPartBodies.wrist, this.chairPartBodies.wheel, 
                { x: 0, y: 0 },
                { x: 0, y: -wheel.size.r + this.inches(1.5) });
    }

    Physics.prototype.weldFootRest = function() {
        var wheelChair = this.chairMeasures.get('side');
        function X(name) {
            return wheelChair[name].size.x;
        }

        function Y(name) {
            return wheelChair[name].size.y;
        }
        var bodies = this.chairPartBodies;
        var wjd = new b2WeldJointDef();
        var localFRest = new b2Vec2( X('footRest')/2, -Y('footRest')/2);
        var globalPoint = bodies.footRest.GetWorldPoint(localFRest);
        console.log('frest: '+localFRest.x+', '+localFRest.y);
        console.log('global: '+globalPoint.x+', '+globalPoint.y);
        var localFrame = bodies.LBar.GetLocalPoint(globalPoint);
        console.log('frame: '+localFrame.x+', '+localFrame.y);

        wjd.bodyA = bodies.LBar;
        wjd.bodyB = bodies.footRest;
        wjd.localAnchorA.Set(localFrame.x, localFrame.y);
        wjd.localAnchorB.Set(localFRest.x, localFRest.y);
        var frWeld = this.world.CreateJoint(wjd);
        this.chairParts.joints.footRest = frWeld;
    }

    // fill just fill these arrays, same code
    function initC(stabilize) {
        
        var chairFixDef = new b2FixtureDef(); 
        chairFixDef.density = 10.0;
        chairFixDef.friction = 0.6;
        chairFixDef.restitution = 0.5;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX, chairY);

        var parts = this.chairParts, 
            bodies = this.chairPartBodies,
            joints = this.chairParts.joints;

        var wheelChair = this.chairMeasures.get('side');
        for(var cp in wheelChair) {
            var b2b = getBodyPart.call(this, wheelChair[cp], chairFixDef, bodyDef);
            bodies[cp] = b2b;
            parts[cp] = b2b.GetUserData();
        }

        // setup convenience functions
        var cnv = conveniences(wheelChair),
            X = cnv.X, Y = cnv.Y, R = cnv.R,
            Top = cnv.Top,
            Center = cnv.Center,
            Bottom = cnv.Bottom,
            Left = cnv.Left,
            Right = cnv.Right,
            Delta = cnv.Delta,
            Near = cnv.Near;

        var ctx = {
            parts: parts,
            bodies: bodies,
            joints: joints,
            world: this.world,
            addRevJoint: addRevJoint,
            addWeldJoint: addWeldJoint
        };

        ctx.addRevJoint('axle', 'wheel', 'raiseBar', 
                { x: 0, y: 0 },
                { x: Near(Left, 0.55), y: Near(Bottom, 0.88) });
        
        // didn't we do this somewhere else? FIXME
        var wjd = new b2WeldJointDef();
        wjd.bodyA = bodies.wheel;
        wjd.bodyB = this.ground;
        wjd.localAnchorA.Set(0, this.chairParts['wheel'].size.r);
        wjd.localAnchorB.Set(this.pixels(225), -this.pixels(40)); // canvas?
        this.world.CreateJoint(wjd);

        var COG = this.inches(this.chairMeasures.get('axleDistance'));
        var vertPipeWidth = this.inches(1); 
        var frDelta = Near(Bottom, 0.5)('frameConnector');

        ctx.addWeldJoint('slider', 'raiseBar', 'LBar',
                { x: Delta(Right, -this.inches(2)), y: Top },
                { x: Delta(Left, COG), y: Top }); 

        ctx.addWeldJoint('frameWeld', 'handlebars', 'frameConnector',
                { x: Right, y: Delta(Bottom, -frDelta) },
                { x: Center, y: Top });

        ctx.addWeldJoint('seatWeld', 'LBar', 'foam', 
                { x: Delta(Left, vertPipeWidth), y: Top },  
                { x: Left, y: Bottom });

        ctx.addWeldJoint('backWeld', 'handlebars', 'seatBack', 
                { x: Right, y: Delta(Bottom, -Y('foam')) },
                { x: Left, y: Bottom });

        ctx.addWeldJoint('haldeBarPos', 'LBar', 'handlebars',
                { x: Left, y: Top },
                { x: Delta(Right, -vertPipeWidth), y: Bottom });

        ctx.addRevJoint('frontAxle', 'supportWheel', 'frontConnector', 
                { x: Center, y: Center },
                { x: Near(Left, 0.7), y: Near(Bottom, 0.8) });

        ctx.addWeldJoint('frontWeld', 'LBar', 'frontConnector', 
                { x: Near(Right, 0.7), y: Bottom },
                { x: Center, y: Near(Top, 0.8) });


        var fryj = new b2PrismaticJointDef();
        fryj.bodyA = bodies.footRest;
        fryj.bodyB = bodies.LBar;
        fryj.collideConnected = false;

        fryj.localAxisA.Set(0.05, 1); 
        fryj.localAxisA.Normalize(); // normalize to unit vector!
        fryj.localAnchorA.Set(X('footRest')/2, -Y('footRest')/2);
        fryj.localAnchorB.Set(X('LBar')/2, Y('LBar')/2 - (Y('LBar')*0.03));
        fryj.upperTranslation = Y('footRest')*0.9;
        fryj.lowerTranslation = Y('LBar')*0.03;
        fryj.enableLimit = true;
        joints.footRestSlide = this.world.CreateJoint(fryj);

        var clr = this.chairMeasures.get('groundClr');
        clr = this.inches(clr);
        console.log('clr: '+clr);
        var weldY;

        // add footrest barrier
        var fixDef = new b2FixtureDef;
        var shape = new b2PolygonShape;
        var size = {
            x: X('footRest'), // debug view
            y: this.inches(0.1)
        };
        shape.SetAsOrientedBox(size.x / 2, size.y / 2, new b2Vec2(0, Y('footRest')/2), 0); // angle?
        fixDef.shape = shape;
        var footStop = bodies.footRest.CreateFixture(fixDef);
        
        var ffd = new b2FilterData();
        ffd.categoryBits = config.bits.WC_BARRIER;
        ffd.maskBits = config.bits.HM_SOLID;
        footStop.SetFilterData(ffd);
        // end footrest barrier

        parts.initted = true;

        if(stabilize) this.stabilize(25);
    }

    function _destroyChair() {
        console.log('destroying chair');

        for(var j in this.chairParts.joints) {
            var jj = this.chairParts.joints[j];
            this.world.DestroyJoint(jj);
        }
        for(var body in this.chairPartBodies) {
            this.world.DestroyBody(this.chairPartBodies[body])
        }
        this.chairParts = {
            joints: {},
            initted: false }; 
        this.chairPartBodies = {}; 
        this.SIG_destroyChair = false;
    }

    function _destroyPerson () {
        for(var j in this.humanParts.joints) {
            var jj = this.humanParts.joints[j];
            this.world.DestroyJoint(jj);
        }
        for(var body in this.humanPartBodies) {
            this.world.DestroyBody(this.humanPartBodies[body])
        }
        this.humanParts = {
            joints: {},
            initted: false
        }; 
        this.humanPartBodies = {}; 
        this.SIG_destroyPerson = false;
    }

    Physics.prototype.update = function(CB) {
        if(this.haltUpdate) return;

        this.world.Step(1.0 / 60, 10, 10);

        if(!!this.SIG_destroyChair) {
            this.haltUpdate = true;
            _destroyChair.call(this);
            this.haltUpdate = false;
        }
        if(!!this.SIG_destroyPerson) {
            this.haltUpdate = true;
            _destroyPerson.call(this);
            this.haltUpdate = false;
        }

        this.world.DrawDebugData();
        this.world.ClearForces();
        if(CB) CB(this.world);
    }

    // polygon import tool - still somewhat manual
    Physics.prototype.initPolygonModeling = function(fixDef, bodyDef) {

        var polygons = [[
        {x:0.47058823704719543,y:0.29411768913269043},
        {x:1.0024999380111694,y:0.4074999988079071},
        {x:0.8774999380111694,y:0.02000001072883606},
        {x:0.5950000286102295,y:0.03249996900558472}
        ],[
        {x:1.0024999380111694,y:0.4074999988079071},
            {x:0.2647058963775635,y:1.1176470518112183},
            {x:0.4399999976158142,y:1.149999976158142},
            {x:0.752500057220459,y:1.1099998950958252},
            {x:0.9324999451637268,y:0.949999988079071}
        ],[
        {x:0.2647058963775635,y:1.1176470518112183},
            {x:1.0024999380111694,y:0.4074999988079071},
            {x:0.47058823704719543,y:0.29411768913269043},
            {x:0.11764705926179886,y:0.38235294818878174},
            {x:0.05882352963089943,y:0.9411764740943909}
        ]];

        var img = new Image();
        img.src = 'images/v2/head.svg';
        bodyDef.userData = ud = config.polyCraft;
        ud.set('img', img);

        var _size = ud.size;
        var shape, size, dims;
        shape = [];
        size = {
            x: this.inches(_size.x),
            y: this.inches(_size.y)
        };
        dims = { x: 95, y: 94  };
        console.log("size: "+size.x +", "+size.y);
        console.log("dims: "+dims.x +", "+dims.y);
        ud.set('dims', dims);
        ud.set('shape', shape);

        var bb = this.world.CreateBody(bodyDef);
        var npolygons = [];
        for(var px=0; px<polygons.length; px++) {
            var newVertexArray = [];
            var polygon = polygons[px];
            var vertices = [];
            var poly;
            for(var p=0; p<polygon.length; p++) {

              var scaledVec = new b2Vec2(size.x * polygon[p].x, -size.y * polygon[p].y); 
              var cent = new b2Vec2(-0.16, 0.14); // center change is specific to configured shape
              scaledVec.Add(cent);
              
              vertices.push(scaledVec);
               
              // now output the "normalized" vector for future use
              //var normalized = new b2Vec2(scaledVec.x/size.x, scaledVec.y/size.y);
              var normalized = new b2Vec2(scaledVec.x/this.pixels(dims.x), scaledVec.y/this.pixels(dims.y));
              newVertexArray.push(normalized);
            }
            npolygons.push(newVertexArray);
            poly = new b2PolygonShape();
            poly.SetAsVector(vertices, vertices.length);
            fixDef.shape = poly;
            bb.CreateFixture(fixDef);
        }

        /////// OUTPUT ///////////////
        console.log(JSON.stringify(npolygons));
        //////////////////////////////
    };

    // update without rendering to reduce jolts
    Physics.prototype.stabilize = function(num) {
        for(var x=0; x<num; x++) { 
            this.update(); 
        }
    };

    Physics.prototype.reset = function() {
        if(!!this.world) this.destroy();

        this.world = new b2World(
            new b2Vec2(0, 10), // gravity 
            true //allow sleep
        );
        createGround.call(this); 
        
        var fixDef = new b2FixtureDef();
        fixDef.density = 1.0;
        fixDef.friction = 0.6;
        fixDef.restitution = 0.2;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX+this.inches(15), chairY-this.inches(30));

        this.initChair(true);
        this.initPerson(true);

        this.setDynamic();

        this.SIG_destroyChair = false;
        this.SIG_destroyPerson = false;
        this.haltUpdate = false;

        //this.initPolygonModeling(fixDef, bodyDef);
    };

    // calculated values: ground clearance, dump, etc
    Physics.prototype.setDynamic = function() {
        this.chairMeasures.set('groundClr', parseFloat(this.calcGroundClearance()));
    };

    Physics.prototype.snapshot = function(canvasPos) {
        // W = [ ( seatWidth + axle delta ) - chestWidth ] / 2
        var Ws = this.chairMeasures.get('seatWidth'),
            AxDelta = 4, // TODO measure this
            Cw = this.humanMeasures.get('chestWidth'),
            W = (parseInt(Ws) + AxDelta - parseInt(Cw) ) / 2;

        // H = shoulder y - wheelpoint y
        var wheel = this.chairParts.wheel,
            wheelB = this.chairPartBodies.wheel;

        var shoulder = this.humanParts.shoulder,
            shoulderB = this.humanPartBodies.shoulder,
            sPos = shoulderB.GetPosition(),
            sRad = shoulder.size.r * config.PTM,
            wheelPos = wheelB.GetPosition(),
            Hw = wheelPos.y - wheel.size.r,
            H = Hw - sPos.y; // inverted Y coordinates

        H = H * config.ITM;

        // F = wheel x - shoulder x
        var F = wheelPos.x - sPos.x;

        var U = this.humanMeasures.get('upperArmLength'),
            L = this.humanMeasures.get('lowerArmLength');

        var Sy = Math.round(sPos.y * config.PTM + canvasPos.y);
        var Sx = Math.round(sPos.x * config.PTM + canvasPos.x - sRad);

        var K = Math.sqrt(Math.pow(F, 2) + Math.pow(H, 2));
        var D = Math.sqrt(Math.pow(K, 2) + Math.pow(W, 2));

        console.log('W = ' + W);
        console.log('H = ' + H);
        console.log('F = ' + F);
        console.log('U = ' + U);
        console.log('L = ' + L);
        console.log('point to point distance: '+D);

        var angle_fRot = Math.atan(H/F);
        var angle_bRot = Math.atan(F/H);
        var z = Math.atan(K/W);
        
        // law of cosines
        var a = angle_u_d = Math.acos((-Math.pow(L, 2) + 
                Math.pow(U, 2) + Math.pow(D, 2)) / (2 * U * D))

        var c = angle_elbow = Math.acos((-Math.pow(D, 2) + 
                    Math.pow(U, 2) + Math.pow(L, 2)) / (2 * U * L))

        var gamma = z - a;
        var alpha = upperIntoAngle = Math.PI/2 - gamma;
        var beta = lowerIntoAngle = Math.PI - alpha - c;
        var Q = U * Math.cos(gamma);
        var P = perspective = Q - W; // how far elbow juts out of wheel plane
        var E = Q * Math.atan(gamma);
        
        var uHeight = U * config.PTM / config.ITM,
            uWidth = this.humanMeasures.get('upperArmWidth') * config.PTM / config.ITM;

        var lHeight = L * config.PTM / config.ITM,
            lWidth = this.humanMeasures.get('lowerArmWidth') * config.PTM / config.ITM;

        var uPersp = W * config.PTM / config.ITM;

        return { 
            alpha: alpha,
            beta: beta,
            uPersp: uPersp, 
            uHeight: uHeight,
            uWidth: uWidth,
            lHeight: lHeight,
            lWidth: lWidth,
            E: E,
            F: F,
            W: W
        };
    };

    Physics.prototype.getBodyAtPos = function(Px, Py) {
        var pos = new b2Vec2(Px, Py);
         
        var aabb = new b2AABB();
        aabb.lowerBound.Set(pos.x - 0.001, pos.y - 0.001);
        aabb.upperBound.Set(pos.x + 0.001, pos.y + 0.001);
         
        var body = null;
        var self = this;
         
        // Query the world for overlapping shapes.
        function GetBodyCallback(fixture)
        {
            var shape = fixture.GetShape();
            var dimChair = false;
             
            if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
                var inside = shape.TestPoint(fixture.GetBody().GetTransform(), pos);
                 
                if (inside) {
                    var b = fixture.GetBody();
                    if(dimChair) {
                        for(var cp in self.chairPartBodies) {
                            if(b === self.chairPartBodies[cp]) 
                                return true;
                        }
                    } 
                    body = b;
                    return false;
                }
            }
             
            return true;
        }
         
        this.world.QueryAABB(GetBodyCallback, aabb);
        return body;
    };

    // TODO remove string array notation from person/chair
    Physics.prototype.calcGroundClearance = function() {
        var ly = this.chairParts.wheel.size.r;
        var groundPt = this.chairPartBodies.wheel.GetWorldPoint(
                new b2Vec2(0, ly));

        var frs = this.chairParts.footRest.size;
        var frLocal = new b2Vec2(frs.x/2, frs.y/2);
        var frPt = this.chairPartBodies.footRest.GetWorldPoint(frLocal);
        return ((groundPt.y - frPt.y) * config.ITM).toFixed(2); 
    };
    
    Physics.prototype.destroy = function() {
        this.world.ClearForces();
        for(b = this.world.GetBodyList(); b; b = b.GetNext()) {
            this.world.DestroyBody(b);
        }
    };

    function createMouseJoint(world, body, ground, pos) {
        var def = new Box2D.Dynamics.Joints.b2MouseJointDef();
        
        def.bodyA = ground;
        def.bodyB = body;
        def.target = pos;

        def.collideConnected = true;
        def.maxForce = 100 * body.GetMass();
        def.dampingRatio = 0;

        body.SetAwake(true);
        return world.CreateJoint(def);
    }

    Physics.prototype.setupMouseJoint = function(Px, Py) {
        var body = this.getBodyAtPos(mouseX, mouseY);
        if(!body) return;

        var pos = new b2Vec2(Px, Py);

        var hParts = this.humanParts,
            cParts = this.chairParts;
        this.mouseJoint = createMouseJoint(this.world, body, this.ground, pos);

        if(body === this.humanPartBodies.upperLeg) {
            var seatRev = hParts.joints.seatRev;
            var seatSlide = hParts.joints.seatSlide;
            console.log('breaking bond...');
            if(seatRev) {
                hParts.joints.seatRev = undefined;
                this.world.DestroyJoint(seatRev);
            }
            if(seatSlide && seatSlide.IsMotorEnabled()) {
                console.log('turning off motor');
                seatSlide.EnableMotor(false);
            }
        } else if(body === this.chairPartBodies.footRest) {
            var frWeld = cParts.joints.footRest;
            if(frWeld) {
                cParts.joints.footRest = undefined;
                this.world.DestroyJoint(frWeld);
            } 
        }
    };

    Physics.prototype.isFootRestWelded = function() {
        return !!this.chairParts.joints.footRest;
    };

    Physics.prototype.destroyMouseJoint = function() {
        this.world.DestroyJoint(this.mouseJoint);
        this.mouseJoint = undefined;
        var seatSlide = this.humanParts.joints.seatSlide;
        if(seatSlide && !seatSlide.IsMotorEnabled()) {
            console.log('restoring bond');
            seatSlide.EnableMotor(true);
            seatSlide.SetMaxMotorForce(500);
            seatSlide.SetMotorSpeed(0.0);
        }
    };

    Physics.prototype.handleMouseDrag = function(mouseX, mouseY) {
        if(this.mouseJoint) {
            var pos = new b2Vec2(mouseX, mouseY);
            this.mouseJoint.SetTarget(pos);
        }
    };

    Physics.prototype.destroyChair = function() {
        this.SIG_destroyChair = true;
    };
    
    Physics.prototype.destroyPerson = function() {
        this.SIG_destroyPerson = true;
    };
    
    // name these to be intuitive
    Physics.prototype.inches = function(numInches) {
        return numInches / config.ITM;
    };
    
    Physics.prototype.pixels = function(numPixels) {
        return numPixels / config.PTM;
    };
    
    Physics.prototype.initPerson = initP;
    Physics.prototype.initChair = initC;

    return Physics;
});
