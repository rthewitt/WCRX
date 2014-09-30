define(["box2dweb", "underscore"], function(Box2D, _) {

    var WCRX = function(chairMeasures, humanMeasures) { 
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

    //////// REMOVE ///////
    var chairX,
        chairY;
    //////////////////////////


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


    function createGround() {
         var fixDef = new b2FixtureDef;
         fixDef.density = 1.0;
         fixDef.friction = 0.5;
         fixDef.restitution = 0.2;
         
         var bodyDef = new b2BodyDef;

         var gmd = new b2FilterData();
         gmd.categoryBits = this.config.bits.GROUND;
         gmd.maskBits = this.config.masks.ground;
         
         //create ground
         bodyDef.type = b2Body.b2_staticBody;
         fixDef.shape = new b2PolygonShape;
         fixDef.shape.SetAsBox(this.pixels(850), this.pixels(40));
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
        var img = new Image();
        img.src = 'images/v2/'+idata.get('name')+'.svg';
        idata.set('img', img);

        var _size = idata.get('size');
        var shape, size, dims;
        var PTM = this.config.PTM, ITM = this.config.ITM;
        switch(idata.get('type')) {
            case 'circle':
                shape = new b2CircleShape(this.inches(_size.r)); 
                //size = { r: this.inches(_size.r) };
                size = { r: this.inches(_size.r) };
                dims = { x: 2 * size.r * PTM, y: 2 * size.r * PTM };
                //console.log('_size: '+JSON.stringify(_size));
                //console.log('size: '+JSON.stringify(size));
                //console.log(dims);
                break;
            case 'poly':
                shape = [];
                size = {
                    x: this.inches(_size.x),
                    y: this.inches(_size.y)
                };
                dims = { x: size.x * PTM, y: size.y * PTM };
                setScaledPolygons(shape, idata.get('polygons'), size);
                break;
            case 'box':
                shape = new b2PolygonShape;
                size = {
                    x: this.inches(_size.x),
                    y: this.inches(_size.y)
                };
                dims = { x: size.x * PTM, y: size.y * PTM };
                shape.SetAsOrientedBox(size.x / 2, size.y / 2, new b2Vec2(0, 0), 0);
                break;
        }
        idata.set('dims', dims);
        idata.set('shape', shape);
        idata.set('size', size);

        var fdd = new b2FilterData();
        fdd.categoryBits = idata.get('cat');
        fdd.maskBits = idata.get('mask');

        bodyDef.userData = idata;
        var body = this.world.CreateBody(bodyDef);
        //body.SetAngle(-1.7 * Math.PI);

        function reify(shape) {
            fixDef.shape = shape;

            var fixture;
            if(idata.get('massless') === true) {
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

    function initP() {
        
        var humanFixDef = new b2FixtureDef(); 
        humanFixDef.density = 1.0;
        humanFixDef.friction = 0.9;
        humanFixDef.restitution = 0.1;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX+this.inches(2), chairY-1);


        var parts = this.humanParts, bodies = this.humanPartBodies;

        var person = this.humanMeasures.get('person');
        for(var bp in person) {
            var b2b = getBodyPart.call(this, person[bp], humanFixDef, bodyDef);
            bodies[bp] = b2b;
            parts[bp] = b2b.GetUserData();
        }

        function X(name) {
            return person[name].get('size').x;
        }

        function Y(name) {
            return person[name].get('size').y;
        }

        var joints = this.humanParts.joints;
        // joints have gotten more complicated (additional bodies)

        var shoulder = bodies.shoulderJ;
        var Rs = person['shoulderJ'].get('size').r;

        var s_1 = getWeldJoint.call(this, shoulder, bodies.chest,
                { x: 0, y: 0 },
                { x: -X('chest')/2 * 0.4, y: -Y('chest')/2 * 0.55 });
        
        var knee = bodies.kneeJ;
        var kr = person['kneeJ'].get('size').r;

        var knee_1 = getRevJoint.call(this, knee, bodies.lowerLeg, 
                { x: 0, y: 0 },
                { x: -X('lowerLeg')/2, y: 0 });

        // should be fixture
        var knee_2 = getWeldJoint.call(this, bodies.upperLeg, knee,
                { x: X('upperLeg')/2, y: kr * 0.60 },
                { x: 0, y: 0 });

        
        /*
        var elbow = getRevJoint.call(this, bodies.upperArm, bodies.lowerArm, 
                { x: 0, y: Y('upperArm')/2 },
                { x: 0, y: -Y('lowerArm')/2 }); */


        var mr = person['midsection'].get('size').r;
        var t2 = getRevJoint.call(this, bodies.waist, bodies.midsection,
                { x: 0, y: -Y('waist')/2 },
                { x: -mr * 2/3, y: mr * (1/3) }, true);

        var t1 = getRevJoint.call(this, bodies.chest, bodies.midsection,
                { x: 0, y: Y('chest')/2 },
                { x: 0, y: -person['midsection'].get('size').r * (2/3) }, true);

        // The order of these limits is the reverse of my assumption
        t1.SetLimits(-0.3 * Math.PI, 0.1 * Math.PI);
        t1.EnableLimit(true);
        t2.SetLimits(-1.9 * Math.PI, 0.2 * Math.PI);
        t2.EnableLimit(true);
        

        var hip = getRevJoint.call(this, bodies.upperLeg, bodies.waist, 
                { x: -X('upperLeg')/2, y: Y('upperLeg')/2 },
                { x: -X('waist')/2, y: Y('waist')/2 });

        var foot = getWeldJoint.call(this, bodies.lowerLeg, bodies.foot,
                { x: X('lowerLeg')/2, y: Y('lowerLeg')/2 * 0.65 },
                { x: -X('foot')/2, y: Y('foot')/2 });


        /*
        var shoulder = getRevJoint.call(this, bodies.upperArm, bodies.chest, 
                { x: -X('upperArm')/2, y: -Y('upperArm')/2 },
                { x: -X('chest')/2, y: -(Y('chest')/2) });
                */

        // dynamic joints for person control
        joints.shoulder = s_1;
        //joints.elbow = elbow;
        joints.t1 = t1;
        joints.t2 = t2;
        joints.hip = hip;
        joints.knee_1 = knee_1;
        joints.knee_2 = knee_2;
        joints.foot = foot;
        parts.initted = true;

        if(!this.chairParts.initted) return;

        var waistPos = this.chairPartBodies.wheel.GetPosition();
        waistPos.Add(new b2Vec2(0, -this.inches(20)));
        bodies.waist.SetPosition(waistPos);
        var rr = person['midsection'].get('size').r;
        var midPos = new b2Vec2(-this.inches(0), -rr);
        midPos.Add(waistPos);
        bodies.midsection.SetPosition(midPos);
        var chestPos = new b2Vec2(-this.inches(0), -(rr+Y('chest')));
        chestPos.Add(midPos);
        bodies.chest.SetPosition(chestPos);

        // TODO review this
        var sillyForce = new b2Vec2(-1, 1);
        bodies.midsection.ApplyForce(sillyForce, new b2Vec2(0, 0));

        /*
        var uaPos = new b2Vec2(-this.inches(2), 0);
        uaPos.Add(chestPos);
        bodies.upperArm.SetPosition(uaPos);
        var laPos = new b2Vec2(-this.inches(2), 0);
        laPos.Add(midPos);
        bodies.lowerArm.SetPosition(laPos);
        */


        var ulx = parts.upperLeg.get('size').x;
        var uly = parts.upperLeg.get('size').y/2;
        var llPos = new b2Vec2(ulx, uly);
        llPos.Add(waistPos);
        bodies.lowerLeg.SetPosition(llPos);
        var llx = parts.lowerLeg.get('size').x;
        var lly = parts.lowerLeg.get('size').y/2;
        var footPos = new b2Vec2(lly, llx);
        footPos.Add(llPos);
        bodies.foot.SetPosition(footPos);

        // individual will have a measured distance from seatback
        // where they make contact with seat bottom
        var seat = this.chairParts.foam;
        var extra = this.chairParts.seatBack.get('size').x;
        var delta = this.humanMeasures.get('contactPoint');
        var forward = this.inches(delta) + extra;
        var ss = seat.get('size')
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

        //var wrist = bindWrist.call(this);
    }

    // call with context
    function bindWrist() {
        if(!this.chairParts.initted || !this.humanParts.initted) return;
        var wheel = this.chairParts.wheel, lowerArm = this.humanParts.lowerArm;
        return getRevJoint.call(this, this.humanPartBodies.lowerArm, this.chairPartBodies.wheel, 
                { x: 0, y: lowerArm.get('size').y/2 },
                { x: 0, y: -wheel.get('size').r }, true);
    }

    // fill just fill these arrays, same code
    function initC() {
        
        var chairFixDef = new b2FixtureDef(); 
        chairFixDef.density = 10.0;
        chairFixDef.friction = 0.6;
        chairFixDef.restitution = 0.5;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX, chairY);

        var parts = this.chairParts, bodies = this.chairPartBodies;

        var wheelChair = this.chairMeasures.get('wheelChair');
        for(var cp in wheelChair) {
            var b2b = getBodyPart.call(this, wheelChair[cp], chairFixDef, bodyDef);
            bodies[cp] = b2b;
            parts[cp] = b2b.GetUserData();
        }

        function X(name) {
            return wheelChair[name].get('size').x;
        }

        function Y(name) {
            return wheelChair[name].get('size').y;
        }

        var joints = this.chairParts.joints;
        var axle = getRevJoint.call(this, bodies.wheel, bodies.raiseBar, 
                { x: 0, y: 0 },
                { x: -X('raiseBar')/2 * 0.55, y: Y('raiseBar')/2 * 0.88  });
        axle.SetLimits(0 * Math.PI, 0 * Math.PI);
        //axle.EnableLimit(true);
        
        var wjd = new b2WeldJointDef();
        wjd.bodyA = bodies.wheel;
        wjd.bodyB = this.ground;
        wjd.localAnchorA.Set(0, this.chairParts['wheel'].get('size').r);
        wjd.localAnchorB.Set(this.pixels(400), -this.pixels(40)); // canvas?
        this.world.CreateJoint(wjd);

        var COG = this.inches(this.chairMeasures.get('axleDistance'));
        var vertPipeWidth = this.inches(1); 

        var slider = getWeldJoint.call(this, bodies.raiseBar, bodies.LBar,
                { x: X('raiseBar')-this.inches(2), y: -Y('raiseBar')/2 },
                { x: -X('LBar')/2 + COG, y: -Y('LBar')/2 }); 

        var frameWeld = getWeldJoint.call(this, bodies.handlebars, bodies.frameConnector,
                { x: X('handlebars')/2, y: Y('handlebars')/2 - (Y('frameConnector') * 0.5) },
                { x: 0, y: -Y('frameConnector')/2 });

        var seatWeld = getWeldJoint.call(this, bodies.LBar, bodies.foam, 
                { x: -X('LBar')/2 + vertPipeWidth, y: -Y('LBar')/2 },  
                { x: -X('foam')/2, y: Y('foam')/2 });

        var backWeld = getWeldJoint.call(this, bodies.handlebars, bodies.seatBack, 
                { x: X('handlebars')/2, y: Y('handlebars')/2 - Y('foam') },
                { x: -X('seatBack')/2, y: Y('seatBack')/2 });

        var handleBarPos = getWeldJoint.call(this, bodies.LBar, bodies.handlebars,
                { x: -X('LBar')/2, y: -Y('LBar')/2 },
                { x: X('handlebars')/2 - vertPipeWidth, y: Y('handlebars')/2 });

        var frontAxle = getRevJoint.call(this, bodies.supportWheel, bodies.frontConnector, 
                { x: 0, y: 0 },
                { x: -X('frontConnector')/2 * 0.7, y: Y('frontConnector')/2 * 0.8 });

        var frontWeld = getWeldJoint.call(this, bodies.LBar, bodies.frontConnector, 
                { x: X('LBar')/2 * 0.7, y: Y('LBar')/2 },
                { x: 0, y: -Y('frontConnector')/2 * 0.8 });

        var footRest = getWeldJoint.call(this, bodies.LBar, bodies.footRest,
                { x: X('LBar')/2, y: Y('LBar')/2 },
                { x: X('footRest')/2, y: -Y('footRest')/2  * 0.5 }); // TODO distance determined by gap / angle

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
        ffd.categoryBits = this.config.bits.WC_BARRIER;
        ffd.maskBits = this.config.bits.HM_SOLID;
        footStop.SetFilterData(ffd);
        // end footrest barrier

        // dynamic joints for control
        joints.axle = axle;
        joints.slider = slider;
        joints.frontAxle = frontAxle;
        // remove?
        joints.backWeld = backWeld;
        joints.frameWeld = frameWeld;
        joints.seatWeld = seatWeld;
        joints.handleBarPos = handleBarPos;
        joints.frontWeld = frontWeld;
        joints.footRest = footRest;

        for(var bod in bodies) {
            var ud = bodies[bod].GetUserData();
            //if(!!ud) console.log(ud.get('dims'));
        }

        parts.initted = true;
    }

    function _destroyChair() {
        console.log('destroying chair');

        // detach human
        /*
        var hJoints = this.humanParts.joints;
        if(hJoints.seatRev) {
            hJoints.seatRev = undefined;
            this.world.DestroyJoint(hJoints.seatRev);
        }
        if(hJoints.seatSlide) {
            hJoints.seatSlide = undefined;
            this.world.DestroyJoint(hJoints.seatSlide);
        }
        */

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
        this.chairMeasures.unset('wheelChair');
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

    // constraints moved while testing
    function enforceChairConstraints() {
    }
    
    // constraints moved while testing
    function enforcePersonConstraints() {
    }


    WCRX.prototype.update = function(CB) {
        if(this.haltUpdate) return;

        if(this.chairParts.initted)
            enforceChairConstraints.call(this);
        if(this.humanParts.initted)   
            enforcePersonConstraints.call(this);

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
    WCRX.prototype.initPolygonModeling = function() {

        var polygons = [[
            {x:2.9802322387695312E-8,y:1.3650000095367432},
            {x:0.07000002264976501,y:1.7350000143051147},
            {x:0.9249999523162842,y:1.7350000143051147},
            {x:0.9949999451637268,y:1.3499999046325684},
            {x:0.854999840259552,y:0.02000012993812561},
            {x:0.1599999964237213,y:0.02000001072883606}
        ]];

        var img = new Image();
        img.src = 'images/v2/lower-arm.svg';
        bodyDef.userData = ud = this.config.polyCraft;
        ud.set('img', img);

        var _size = ud.get('size');
        var shape, size, dims;
        shape = [];
        size = {
            x: this.inches(_size.x),
            y: this.inches(_size.y)
        };
        dims = { x: 39, y: 83  };
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
              var cent = new b2Vec2(-0.09, 0.18); // center change is specific to configured shape
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

    WCRX.prototype.reset = function() {
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

        this.initChair();
        for(var x=0; x<25; x++) { this.update(); } // stabilize chair
        this.initPerson();

        this.SIG_destroyChair = false;
        this.SIG_destroyPerson = false;
        this.haltUpdate = false;

        //initPolygonModeling();
    };

    WCRX.prototype.snapshot = function() {
        // W = [ ( seatWidth + axle delta ) - chestWidth ] / 2
        var Ws = this.chairMeasures.get('seatWidth'),
            AxDelta = 4, // TODO measure this
            Cw = this.humanMeasures.get('chestWidth'),
            W = (parseInt(Ws) + AxDelta - parseInt(Cw) ) / 2;

        console.log('width: '+Ws);

        // H = shoulder y - wheelpoint y
        var wheel = this.chairParts.wheel,
            wheelB = this.chairPartBodies.wheel;

        var shoulder = this.humanParts.shoulderJ,
            shoulderB = this.humanPartBodies.shoulderJ,
            sPos = shoulderB.GetPosition(),
            sRad = shoulder.get('size').r * this.config.PTM,
            wheelPos = wheelB.GetPosition(),
            Hw = wheelPos.y - wheel.get('size').r,
            H = Hw - sPos.y; // inverted Y coordinates

        H = H * this.config.ITM;

        // F = wheel x - shoulder x
        var F = wheelPos.x - sPos.x;

        var U = this.humanMeasures.get('upperArmLength'),
            L = this.humanMeasures.get('lowerArmLength');

        return [ W, H, F, U, L, sPos, sRad, wheelPos ];
    };

    WCRX.prototype.getBodyAtPos = function(pos) {
         
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


    WCRX.prototype.destroy = function() {
        this.world.ClearForces();
        for(b = this.world.GetBodyList(); b; b = b.GetNext()) {
            this.world.DestroyBody(b);
        }
        this.chairMeasures.resetChair();
        this.humanMeasures.resetPerson();
    };

    WCRX.prototype.destroyChair = function() {
        this.SIG_destroyChair = true;
    };
    WCRX.prototype.destroyPerson = function() {
        this.SIG_destroyPerson = true;
    };
    WCRX.prototype.Person = function(pdef) {
        for(var bp in pdef) {
            this[px] = pdef;
        }
    };
    WCRX.prototype.Chair = function(cdef) {
        for(var cx in cdef) {
            this[cx] = cdef;
        }
    };
    WCRX.prototype.inches = function(numInches) {
        return numInches / this.config.ITM;
    };
    WCRX.prototype.pixels = function(numPixels) {
        return numPixels / this.config.PTM;
    };
    WCRX.prototype.initPerson = initP;
    WCRX.prototype.initChair = function() { 
        initC.call(this);
    };
    WCRX.prototype.init = function(conf) {
        this.config = conf;

        // TEMPORARY /////////////////
        chairX = this.pixels(200);
        chairY = this.pixels(300)-0.1-this.inches(3);
        ///////////////////
    };

    return WCRX;
});
