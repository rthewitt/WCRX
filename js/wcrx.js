define(["box2dweb", "underscore"], function(Box2D, _) {

    var WCRX = function() { 
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

    var wheelRadius,
        chairX,
        chairY,
        chairBackHeight,
        chairBackSeatHeight,
        chairFrontSeatHeight,
        chairSeatDepth,
        chairLegBarLength;


    var frameSkeletonWidth;

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


    // was: canvas y: 300, ground: 340 - (w=50) = 290
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

    function BodyPart(def, conf) {
        var img = new Image();
        img.src = 'images/'+def.name+'.svg';

        this.name = def.name.replace(/-/g,'_');
        this.type = def.type;
        this.img = img;
        this.pos = def.pos;
        this.rotAngle = 0;
        var shape, size, dims;
        switch(def.type) {
            case 'circle':
                shape = new b2CircleShape(def.size.r / conf.ITM); 
                size = { r: def.size.r / conf.ITM };
                dims = { x: 2 * size.r * conf.PTM, y: 2 * size.r * conf.PTM };
                break;
            case 'poly':
                shape = [];
                size = {
                    x: def.size.x / conf.ITM,
                    y: def.size.y / conf.ITM
                };
                dims = { x: size.x * conf.PTM, y: size.y * conf.PTM };
                setScaledPolygons(shape, def.polygons, size);
                break;
            case 'box':
                shape = new b2PolygonShape;
                size = {
                    x: def.size.x / conf.ITM,
                    y: def.size.y / conf.ITM
                };
                dims = { x: size.x * conf.PTM, y: size.y * conf.PTM };
                shape.SetAsOrientedBox(size.x / 2, size.y / 2, new b2Vec2(0, 0), 0);
                break;
        }
        this.dims = dims;
        this.shape = shape;
        this.size = size;
    }

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


    function getBodyPart(def, fixDef, bodyDef, isFixture) {

        var fdd = new b2FilterData();
        fdd.categoryBits = def.cat;
        fdd.maskBits = def.mask;

        var bodyPart = new BodyPart(def, this.config);
        bodyDef.userData = bodyPart;
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

        if(bodyPart.shape instanceof Array) {
            _.each(bodyPart.shape, reify);
        } else reify(bodyPart.shape); 

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

        for(var bp in this.config.person) {
            var b2b = getBodyPart.call(this, this.config.person[bp], humanFixDef, bodyDef); 
            bodies[bp] = b2b;
            parts[bp] = b2b.GetUserData();
        }

        var joints = this.humanParts.joints;
        var knee = getRevJoint.call(this, bodies.upperLeg, bodies.lowerLeg, 
                { x: parts.upperLeg.size.x/2 * 0.8, y: 0 },
                { x: -parts.lowerLeg.size.x/2, y: parts.lowerLeg.size.y/2 * 0.5 });

        var elbow = getRevJoint.call(this, bodies.upperArm, bodies.lowerArm, 
                { x: -parts.upperArm.size.x/2, y: parts.upperArm.size.y/2 },
                { x: -parts.lowerArm.size.x/2, y: -parts.lowerArm.size.y/2 });

        var hip = getRevJoint.call(this, bodies.upperLeg, bodies.torso, 
                { x: -parts.upperLeg.size.x/2, y: parts.upperLeg.size.y/2 },
                { x: -parts.torso.size.x/2 * 0.5, y: parts.torso.size.y/2 });

        var shoulder = getRevJoint.call(this, bodies.upperArm, bodies.torso, 
                { x: -parts.upperArm.size.x/2, y: -parts.upperArm.size.y/2 },
                { x: -parts.torso.size.x/2, y: -(parts.torso.size.y/2)*0.4 });

        // dynamic joints for person control
        joints.hip = hip;
        joints.knee = knee;
        joints.elbow = elbow;
        joints.shoulder = shoulder;
        parts.initted = true;

        if(!this.chairParts.initted) return;

        var seat = this.chairParts.foam;
        var seatTarget = this.chairPartBodies.foam.GetPosition();
        var sx = this.inches(parts.torso.size.x/2) + this.inches(7);
        var sy = -this.inches(seat.size.y/2) - this.inches(parts.torso.size.y) - this.inches(20);
        seatTarget.Add(new b2Vec2(sx, sy));
        console.log('target: '+seatTarget.x+', '+seatTarget.y);
        bodies.torso.SetPosition(seatTarget);
        //bodies.torso.SetPositionAndAngle(seatTarget, 0);
        //bodies.upperLeg.SetPosition(new b2Vec2(chairX, chairY));
        //bodies.upperLeg.SetPosition(new b2Vec2(chairX, chairY));
        //bodies.upperLeg.SetPosition(new b2Vec2(chairX, chairY));
          
        var wheel = this.chairParts.wheel;
        var wrist = getRevJoint.call(this, bodies.lowerArm, this.chairPartBodies.wheel, 
                { x: 0, y: parts.lowerArm.size.y/2 },
                { x: 0, y: -wheel.size.r }, true);

        /*
        var XXXseat = this.chairParts.seatBack;
        var intoSeat = new b2DistanceJointDef();
        intoSeat.bodyA = bodies.upperLeg;
        intoSeat.bodyB = this.chairPartBodies.seatBack;
        intoSeat.collideConnected = true;
        intoSeat.anchorA = new b2Vec2(-parts.upperLeg.size.x/2, parts.upperLeg.size.y/2);
        intoSeat.anchorB = new b2Vec2(XXXseat.size.x/2, 0);
        intoSeat.length = this.inches(1);
        intoSeat.dampingRation = 0.5;
        intoSeat.frequencyHz = 15;
        this.world.CreateJoint(intoSeat);
        */
    }

    // fill just fill these arrays, same code
    function initC() {
        
        var chairFixDef = new b2FixtureDef(); 
        chairFixDef.density = 1.0;
        chairFixDef.friction = 0.6;
        chairFixDef.restitution = 0.5;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX, chairY-this.inches(10));

        var parts = this.chairParts, bodies = this.chairPartBodies;

        for(var cp in this.config.chair) {
            var b2b = getBodyPart.call(this, this.config.chair[cp], chairFixDef, bodyDef);
            bodies[cp] = b2b;
            parts[cp] = b2b.GetUserData();
        }

        var joints = this.chairParts.joints;
        var axle = getRevJoint.call(this, bodies.wheel, bodies.raiseBar, 
                { x: 0, y: 0 },
                { x: -parts.raiseBar.size.x/2 * 0.55, y: parts.raiseBar.size.y/2 * 0.88  });
        /*
        axle.SetLimits(-0.3 * Math.PI, 0);
        axle.EnableLimit(true);
        */

        // could make this a prismatic joint?
        var slider = getWeldJoint.call(this, bodies.raiseBar, bodies.LBar,
                { x: 0, y: -parts.raiseBar.size.y/2 },
                { x: -parts.LBar.size.x/2 * 0.6, y: -parts.LBar.size.y/2 }); // TODO from back-to-axle distance

        var backWeld = getWeldJoint.call(this, bodies.handlebars, bodies.seatBack, 
                { x: parts.handlebars.size.x/2, y: parts.handlebars.size.y/2 },
                { x: -parts.seatBack.size.x/2, y: parts.seatBack.size.y/2 });

        var backToAxle = this.inches(3.5); // TODO make this real
        var seatWeld = getWeldJoint.call(this, bodies.LBar, bodies.foam, // TODO fixture or spacer
                { x: -parts.LBar.size.x/2 + backToAxle, y: -parts.LBar.size.y/2 },  // TODO handlebar width inference
                { x: -parts.foam.size.x/2, y: parts.foam.size.y/2 });

        var handleBarPos = getWeldJoint.call(this, bodies.LBar, bodies.handlebars,
                { x: -parts.LBar.size.x/2, y: 0 },
                { x: parts.handlebars.size.x/2 * 0.6, y: parts.handlebars.size.y });

        var frontAxle = getRevJoint.call(this, bodies.supportWheel, bodies.frontConnector, 
                { x: 0, y: 0 },
                { x: -parts.frontConnector.size.x/2 * 0.7, y: parts.frontConnector.size.y/2 * 0.8 });

        var frontWeld = getWeldJoint.call(this, bodies.LBar, bodies.frontConnector, // TODO
                { x: parts.LBar.size.x/2 * 0.7, y: parts.LBar.size.y/2 },
                { x: 0, y: -parts.frontConnector.size.y/2 * 0.8 });

        var footRest = getWeldJoint.call(this, bodies.LBar, bodies.footRest,
                { x: parts.LBar.size.x/2, y: parts.LBar.size.y/2 }, // TODO minus bar width
                { x: parts.footRest.size.x/2, y: -parts.footRest.size.y/2  * 0.5 }); // TODO distance determined by gap / angle

        // dynamic joints for control
        joints.axle = axle;
        joints.slider = slider;
        joints.frontAxle = frontAxle;
        // remove?
        joints.backWeld = backWeld;
        joints.seatWeld = seatWeld;
        joints.handleBarPos = handleBarPos;
        joints.frontWeld = frontWeld;
        joints.footRest = footRest;

        parts.initted = true;
    }

    function _destroyChair() {
        for(var j in this.chairParts.joints) {
            var jj = this.chairParts.joints[j];
            this.world.DestroyJoint(jj);
        }
        for(var body in this.chairPartBodies) {
            this.world.DestroyBody(this.chairPartBodies[body])
        }
        this.chairParts = {
            joints: {},
            initted: false
        }; 
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

    // move this to human-chair constraints
    function enforceChairConstraints() {
            var axle = this.chairParts.joints.axle;
            console.log('axle angle: '+axle.GetJointAngle()/Math.PI);
        //this.chairPartBodies.frontConnector.ApplyForce(new b2Vec2(0, -1), new b2Vec2(0, 0));
    }
    
    // TODO some of these can use joint SetLimits during creation
    function enforcePersonConstraints() {
        var gain = 20.0;

        var hip = this.humanParts.joints.hip;
        var angleError = hip.GetJointAngle() - (0.0 * Math.PI); // change
        if(this.chairParts.initted || angleError > 0.4 * Math.PI || angleError < -0.8 * Math.PI) {
            hip.SetMotorSpeed(-gain * angleError);
            hip.SetMaxMotorTorque(20);
        } else hip.SetMaxMotorTorque(0);


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

        if(this.chairParts.initted) {
            // give the illusion of conscious balance
            /*
            var angleError = axle.GetJointAngle() - (0.0 * Math.PI); // change
            var gain = 20.0;
            axle.SetMotorSpeed(-gain * angleError);
            axle.SetMaxMotorTorque(20);
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

        //this.initChair();
        //this.initPerson();

        this.SIG_destroyChair = false;
        this.SIG_destroyPerson = false;
        this.haltUpdate = false;


        // torso
        /*
        var polygons = [[
        {x:0.1893940269947052,y:0.8636363744735718},
            {x:0.19696968793869019,y:0.24242424964904785},
            {x:0.36363643407821655,y:0.034090906381607056},
            {x:0.7878788113594055,y:0.03030303120613098},
            {x:0.8604651093482971,y:0.7209300994873047}],
            //move
        [
        {x:0.8604651093482971,y:0.7209300994873047},
            {x:0.8863633871078491,y:1.7045456171035767},
            {x:0.5348837375640869,y:2.302325487136841},
            {x:0.1627907007932663,y:2.3255813121795654},
            {x:0.023255813866853714,y:1.9767440557479858},
            {x:0.04651162773370743,y:1.3720929622650146},
            {x:0.1893940269947052,y:0.8636363744735718}],
            [
        {x:0.5348837375640869,y:2.302325487136841},
            {x:0.604651153087616,y:2.4418604373931885},
            {x:0.1860465109348297,y:2.7209300994873047},
            {x:0.1627907007932663,y:2.3255813121795654}],
            [
        {x:0.604651153087616,y:2.4418604373931885},
            {x:0.7906976938247681,y:2.465116262435913},
            {x:0.8604651093482971,y:2.883720874786377},
            {x:0.8000001907348633,y:3.2100000381469727},
            {x:0.5900002121925354,y:3.330000162124634}],
            [
        {x:0.5900002121925354,y:3.330000162124634},
            {x:0.3299999237060547,y:3.3399999141693115},
            {x:0.13953489065170288,y:3.162790536880493},
            {x:0.09302325546741486,y:2.930232524871826},
            {x:0.1860465109348297,y:2.7209300994873047},
            {x:0.604651153087616,y:2.4418604373931885}
        ]];
        */

        var polygons = [[
        {x:0.1893940269947052,y:0.8636363744735718},
            {x:0.8604651093482971,y:0.7209300994873047},
            {x:0.7878788113594055,y:0.03030303120613098},
            {x:0.36363643407821655,y:0.034090906381607056},
            {x:0.19696968793869019,y:0.24242424964904785}
            ],[
        {x:0.8604651093482971,y:0.7209300994873047},
            {x:0.1893940269947052,y:0.8636363744735718},
            {x:0.04651162773370743,y:1.3720929622650146},
            {x:0.023255813866853714,y:1.9767440557479858},
            {x:0.1627907007932663,y:2.3255813121795654},
            {x:0.5348837375640869,y:2.302325487136841},
            {x:0.8863633871078491,y:1.7045456171035767}
            ], [
        {x:0.5348837375640869,y:2.302325487136841},
            {x:0.1627907007932663,y:2.3255813121795654},
            {x:0.1860465109348297,y:2.7209300994873047},
            {x:0.604651153087616,y:2.4418604373931885}
            ], [
        {x:0.604651153087616,y:2.4418604373931885},
            {x:0.5900002121925354,y:3.330000162124634},
            {x:0.8000001907348633,y:3.2100000381469727},
            {x:0.8604651093482971,y:2.883720874786377},
            {x:0.7906976938247681,y:2.465116262435913}
            ], [
        {x:0.5900002121925354,y:3.330000162124634},
            {x:0.604651153087616,y:2.4418604373931885},
            {x:0.1860465109348297,y:2.7209300994873047},
            {x:0.09302325546741486,y:2.930232524871826},
            {x:0.13953489065170288,y:3.162790536880493},
            {x:0.3299999237060547,y:3.3399999141693115}
        ]];


        var img = new Image();
        img.src = 'images/torso.svg';
var ud = {
        name: 'torso',
        img: img,
        rotAngle: 0,
        size: {x: 80 / this.config.PTM, y: 80 / this.config.PTM },
        dims: {x: 77, y: 267},
        pos: { z: 10 }
};
    bodyDef.userData = ud;

    var bb = this.world.CreateBody(bodyDef);
    //bb.SetAngle(1.9*Math.PI);
    var npolygons = [];
    for(var px=0; px<polygons.length; px++) {
        var newVertexArray = [];
       var polygon = polygons[px];
       var vertices = [];
        var poly;
       for(var p=0; p<polygon.length; p++) {
          var someVec = new b2Vec2(ud.size.x * polygon[p].x, -ud.size.y * polygon[p].y); 
          var cent = new b2Vec2(-0.206, 0.7);
          cent.Add(someVec);
          vertices.push(cent);
          newVertexArray.push(cent); 
        }
            npolygons.push(newVertexArray);
           poly = new b2PolygonShape();
            poly.SetAsVector(vertices, vertices.length);
            //poly = b2PolygonShape.AsVector(vertices, vertices.length);
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
    WCRX.prototype.initChair = initC;
    WCRX.prototype.init = function(conf) {
        this.config = conf;

        // TEMPORARY /////////////////
        wheelRadius = this.inches(12);
        chairX = this.pixels(200);
        chairY = this.pixels(300)-0.1-this.inches(3);
        chairBackHeight = this.inches(18);
        chairBackSeatHeight = this.inches(15);
        chairFrontSeatHeight = this.inches(18);
        chairSeatDepth = this.inches(18);
        chairLegBarLength = this.inches(22);
        frameSkeletonWidth = this.inches(2);
        ///////////////////
    };

    return new WCRX;
});
