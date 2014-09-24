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
          b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef,
          b2WeldJointDef = Box2D.Dynamics.Joints.b2WeldJointDef;


    function createGround() {
         var fixDef = new b2FixtureDef;
         fixDef.density = 1.0;
         fixDef.friction = 0.5;
         fixDef.restitution = 0.2;
         
         var bodyDef = new b2BodyDef;

         var gmd = new b2FilterData();
         gmd.categoryBits = this.config.groundCat;
         gmd.maskBits = this.config.groundMask;
         
         //create ground
         bodyDef.type = b2Body.b2_staticBody;
         fixDef.shape = new b2PolygonShape;
         fixDef.shape.SetAsBox(20, 2);
         bodyDef.position.Set(10, this.pixels(300) + 1.9);
         var gfx = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
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
                console.log(dims);
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

            var fixture = body.CreateFixture(fixDef);

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
        humanFixDef.friction = 0.6;
        humanFixDef.restitution = 0.5;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX, chairY-1);


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
        var knee = getRevJoint.call(this, bodies.upperLeg, bodies.lowerLeg, 
                { x: X('upperLeg')/2 * 0.85, y: -Y('upperLeg') * 0.1 },
                { x: -X('lowerLeg')/2, y: Y('lowerLeg')/2 * 0.5 });

        var elbow = getRevJoint.call(this, bodies.upperArm, bodies.lowerArm, 
                { x: -X('upperArm')/2, y: Y('upperArm')/2 },
                { x: -X('lowerArm')/2, y: -Y('lowerArm')/2 });

        var t1 = getRevJoint.call(this, bodies.chest, bodies.midsection,
                { x: 0, y: Y('chest')/2 },
                { x: 0, y: 0 });

        var t2 = getRevJoint.call(this, bodies.waist, bodies.midsection,
                { x: 0, y: Y('waist')/2 },
                { x: 0, y: 0 });

        /*
        var hip = getRevJoint.call(this, bodies.upperLeg, bodies.torso, 
                { x: -X('upperLeg')/2, y: Y('upperLeg')/2 },
                { x: -X('torso')/2 * 0.5, y: Y('torso')/2 });

        var shoulder = getRevJoint.call(this, bodies.upperArm, bodies.torso, 
                { x: -X('upperArm')/2, y: -Y('upperArm')/2 },
                { x: -X('torso')/2, y: -(Y('torso')/2)*0.4 });
                */

        // dynamic joints for person control
        //joints.hip = hip;
        joints.knee = knee;
        joints.elbow = elbow;
        //joints.shoulder = shoulder;
        parts.initted = true;

        if(!this.chairParts.initted) return;

        /***** ADD THIS BACK IN SORTOF
        var seat = this.chairParts.foam;
        var seatTarget = this.chairPartBodies.foam.GetPosition();
        var sx = this.inches(X('torso')/2) + this.inches(7);
        var sy = -this.inches(seat.get('size').y/2) - this.inches(Y('torso')) - this.inches(20);
        seatTarget.Add(new b2Vec2(sx, sy));
        console.log('target: '+seatTarget.x+', '+seatTarget.y);
        bodies.torso.SetPosition(seatTarget);
        ********/
          
        var wrist = bindWrist.call(this);
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
        bodyDef.position.Set(chairX, chairY-this.inches(10));

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
        axle.SetLimits(-0.3 * Math.PI, 0);
        axle.EnableLimit(true);

        // TODO have "config" or setup convert from inches
        var backToAxle = this.inches(this.chairMeasures.get('axleDistance'));
        var vertPipeWidth = X('handlebars') * 0.25;

        var slider = getWeldJoint.call(this, bodies.raiseBar, bodies.LBar,
                { x: 0, y: -Y('raiseBar')/2 },
                { x: -X('LBar')/2 + backToAxle, y: -Y('LBar')/2 }); 

        var frameWeld = getWeldJoint.call(this, bodies.handlebars, bodies.frameConnector,
                { x: X('handlebars')/2, y: Y('handlebars')/2 * 0.5 },
                { x: 0, y: -Y('frameConnector')/2 });

        var seatWeld = getWeldJoint.call(this, bodies.LBar, bodies.foam, 
                { x: -X('LBar')/2 + vertPipeWidth, y: -Y('LBar')/2 },  
                { x: -X('foam')/2, y: Y('foam')/2 });

        var backWeld = getWeldJoint.call(this, bodies.handlebars, bodies.seatBack, 
                { x: X('handlebars')/2, y: Y('handlebars')/2 - Y('foam') },
                { x: -X('seatBack')/2, y: Y('seatBack')/2 });


        var handleBarPos = getWeldJoint.call(this, bodies.LBar, bodies.handlebars,
                { x: -X('LBar')/2, y: 0 },
                { x: X('handlebars')/2 - vertPipeWidth, y: Y('handlebars') });

        var frontAxle = getRevJoint.call(this, bodies.supportWheel, bodies.frontConnector, 
                { x: 0, y: 0 },
                { x: -X('frontConnector')/2 * 0.7, y: Y('frontConnector')/2 * 0.8 });

        var frontWeld = getWeldJoint.call(this, bodies.LBar, bodies.frontConnector, 
                { x: X('LBar')/2 * 0.7, y: Y('LBar')/2 },
                { x: 0, y: -Y('frontConnector')/2 * 0.8 });

        var footRest = getWeldJoint.call(this, bodies.LBar, bodies.footRest,
                { x: X('LBar')/2, y: Y('LBar')/2 }, // TODO minus bar width
                { x: X('footRest')/2, y: -Y('footRest')/2  * 0.5 }); // TODO distance determined by gap / angle

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

    // move this to human-chair constraints
    function enforceChairConstraints() {
            var axle = this.chairParts.joints.axle;
            //console.log('axle angle: '+axle.GetJointAngle()/Math.PI);
        //this.chairPartBodies.frontConnector.ApplyForce(new b2Vec2(0, -1), new b2Vec2(0, 0));
    }
    
    // TODO some of these can use joint SetLimits during creation
    function enforcePersonConstraints() {
        var gain = 20.0;

        /****** ADD THIS BACK IN SORT OF
        var hip = this.humanParts.joints.hip;
        var angleError = hip.GetJointAngle() - (0.0 * Math.PI); // change
        //if(this.chairParts.initted || angleError > 0.4 * Math.PI || angleError < -0.8 * Math.PI) {
        if((this.chairParts.initted && 
                    ( angleError < -0.2 * Math.PI || angleError > 0.3 * Math.PI)) 
                || angleError > 0.4 * Math.PI || angleError < -0.8 * Math.PI) {
                    gain = 5.0;
            hip.SetMotorSpeed(-gain * angleError);
            hip.SetMaxMotorTorque(20);
                    gain = 20.0;
        } else hip.SetMaxMotorTorque(0);
        ******/

        // keep knee from bending backwards
        var knee = this.humanParts.joints.knee;
        var angleError = knee.GetJointAngle();
        if(angleError < 0 || angleError > 0.9 * Math.PI) {
        knee.SetMotorSpeed(-gain * angleError);
        knee.SetMaxMotorTorque(20);
        } else knee.SetMaxMotorTorque(0);

        // keep arm from bending backwards
        var elbow = this.humanParts.joints.elbow;
        var angleError = elbow.GetJointAngle();
        if(angleError > 0) {
        elbow.SetMotorSpeed(-gain * angleError);
        elbow.SetMaxMotorTorque(20);
        } else elbow.SetMaxMotorTorque(0);

        // give the illusion of conscious balance
        if(this.chairParts.initted) {

            /* Broken and jittery
            var axle = this.chairParts.joints.axle;
            var angleError = axle.GetJointAngle() - (0.0 * Math.PI); // change
            var gain = 20.0;
            axle.SetMotorSpeed(-gain * angleError);
            axle.SetMaxMotorTorque(20);
            */
            /* gentle rocking, test later
            var lowerArm = this.humanPartBodies.lowerArm;
            lowerArm.ApplyForce(new b2Vec2(0.1, 0), new b2Vec2(0, 0));
            */

            var ulx = this.humanParts.upperLeg.get('size').x;
            this.humanPartBodies.upperLeg.ApplyForce(new b2Vec2(-0.5, -0.1), new b2Vec2(-ulx/2, 0));

            // try to keep foot stable without collision
            /*
            var footRest = this.chairParts.footRest, lowerLeg = this.humanParts.lowerLeg;
            var stableFoot = new b2DistanceJointDef();
            stableFoot.bodyA = this.humanPartBodies.lowerLeg;
            stableFoot.bodyB = this.chairPartBodies.footRest;
            stableFoot.collideConnected = false;
            stableFoot.anchorA = new b2Vec2(lowerLeg.size.x/2, 0);
            stableFoot.anchorB = new b2Vec2(0, 0);
            stableFoot.length = this.inches(10);
            stableFoot.dampingRation = 0.1;
            stableFoot.frequencyHz = 15;
            this.world.CreateJoint(stableFoot);
            */

            //var XXXseat = this.chairParts.seatBack;
            /*
            var XXXseat = this.chairParts.foam;
            var intoSeat = new b2DistanceJointDef();
            intoSeat.bodyA = this.humanPartBodies.upperLeg;
            intoSeat.bodyB = this.chairPartBodies.seatBack;
            intoSeat.collideConnected = true;
            intoSeat.anchorA = new b2Vec2(-this.humanParts.upperLeg.size.x/2, this.humanParts.upperLeg.size.y/2);
            intoSeat.anchorB = new b2Vec2(0, XXXseat.size.y/2);
            intoSeat.length = this.inches(10);
            intoSeat.dampingRation = 0.1;
            intoSeat.frequencyHz = 15;
            this.world.CreateJoint(intoSeat);
            */
        }
    }


    WCRX.prototype.update = function(CB) {
        if(this.haltUpdate) return;

        if(this.chairParts.initted)
            enforceChairConstraints.call(this);
        if(this.humanParts.initted)   
            enforcePersonConstraints.call(this);

        this.world.Step(1.0 / 60, 10, 10);

        if(!!this.SIG_destroyChair) {
            console.log('was true');
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
        CB(this.world);
    }

    WCRX.prototype.reset = function() {
        if(!!this.world) this.destroy();

        this.world = new b2World(
            new b2Vec2(0, 10), // gravity 
            true //allow sleep
        );
        createGround.call(this); 


        ////////// REMOVE ME /////////
        
        var fixDef = new b2FixtureDef();
        fixDef.density = 1.0;
        fixDef.friction = 0.6;
        fixDef.restitution = 0.2;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX+this.inches(15), chairY-this.inches(30));

        this.initChair();
        this.initPerson();

        this.SIG_destroyChair = false;
        this.SIG_destroyPerson = false;
        this.haltUpdate = false;

        return;
        var polygons = [[
        {x:0.025641025975346565,y:1.076923131942749},
        {x:0.9399998188018799,y:0.02750009298324585},
        {x:0.22499990463256836,y:0.017500102519989014},
        {x:0.13499987125396729,y:0.1400001049041748},
        {x:0,y:0.6666666865348816}
        ],[
        {x:0.9399998188018799,y:0.02750009298324585},
            {x:0.025641025975346565,y:1.076923131942749},
            {x:0.1794871836900711,y:1.4871795177459717},
            {x:0.5949998497962952,y:1.4150002002716064},
            {x:0.8974359035491943,y:0.9230769276618958},
            {x:0.9849997758865356,y:0.6400001645088196}
        ]];


        var img = new Image();
        img.src = 'images/v2/chest.svg';
    bodyDef.userData = ud = this.config.polyCraft;
    ud.set('img', img);

    var _size = ud.get('size');
    var shape, size, dims;
    shape = [];
    console.log('_size: '+_size.x + ', '+_size.y);
    size = {
        x: this.inches(_size.x),
        y: this.inches(_size.y)
    };
    dims = { x: 48, y: 120  };
    //dims = { x: size.x * this.config.PTM, y: size.y * this.config.PTM };
    //dims = { x: size.x * this.config.PTM, y: size.y * this.config.PTM };
    console.log("size: "+size.x +", "+size.y);
    console.log("dims: "+dims.x +", "+dims.y);
    ud.set('dims', dims);
    ud.set('shape', shape);
    //ud.set('size', size);

    var bb = this.world.CreateBody(bodyDef);
    //bb.SetAngle(1.9*Math.PI);
    var npolygons = [];
    for(var px=0; px<polygons.length; px++) {
        var newVertexArray = [];
       var polygon = polygons[px];
       var vertices = [];
        var poly;
       for(var p=0; p<polygon.length; p++) {

          var scaledVec = new b2Vec2(size.x * polygon[p].x, -size.y * polygon[p].y); 
          var cent = new b2Vec2(-0.12, 0.33); // center change is specific to configured shape
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

    console.log(JSON.stringify(npolygons));

        //////////////////////////////
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
        if(!!this.humanParts.initted) {
            var wrist = bindWrist.call(this);
        }
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
