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

        this.initChair();
        this.initPerson();

        this.SIG_destroyChair = false;
        this.SIG_destroyPerson = false;
        this.haltUpdate = false;

        return;
        /*
        var polygons = [[
    {x:0.9275000095367432,y:0.1899999976158142},
    {x:0.9975000023841858,y:0.017499953508377075},
    {x:0.9025000333786011,y:0.0024999678134918213},
    {x:0.8475000262260437,y:0.015000015497207642},
    {x:0.8600000143051147,y:0.13750001788139343}
        ] ,
    [
    {x:0.9975000023841858,y:0.017499953508377075},
    {x:0.9275000095367432,y:0.1899999976158142},
    {x:0.9249999523162842,y:0.4350000023841858},
    {x:0.98499995470047,y:0.4325000047683716}
        ],
    
    [
    {x:0.98499995470047,y:0.4325000047683716},
    {x:0.9249999523162842,y:0.4350000023841858},
    {x:0.8774999380111694,y:0.5049999952316284},
    {x:0.8999999165534973,y:0.5675000548362732},
    {x:0.9574999809265137,y:0.5149999856948853}
        ],
    
    [
    {x:0.8999999165534973,y:0.5675000548362732},
    {x:0.8774999380111694,y:0.5049999952316284},
    {x:0.8224999904632568,y:0.5275000333786011},
    {x:0.8224999904632568,y:0.5875000357627869}
        ],
    
    [
    {x:0.8224999904632568,y:0.5875000357627869},
    {x:0.8224999904632568,y:0.5275000333786011},
    {x:0.005000054836273193,y:0.5249999761581421},
    {x:0.0025000572204589844,y:0.5875000357627869}
        ]];
        */


        // PERCENTAGE!!!!
        var polygons = [[{x:0.42750000953674316, y:0.19000000411813905},{x:0.4975000023841858, y:0.48795462575825777},{x:0.4025000333786011, y:0.5138636919585141},{x:0.3475000262260437, y:0.49227270050482314},{x:0.36000001430511475, y:0.280681787295775}],[{x:0.4975000023841858, y:0.48795462575825777},{x:0.42750000953674316, y:0.19000000411813905},{x:0.4249999523162842, y:-0.2331818222999573},{x:0.48499995470046997, y:-0.22886364459991457}],[{x:0.48499995470046997, y:-0.22886364459991457},{x:0.4249999523162842, y:-0.2331818222999573},{x:0.37749993801116943, y:-0.3540909008546309},{x:0.3999999165534973, y:-0.4620455492626537},{x:0.45749998092651367, y:-0.3713636116548018}],[{x:0.3999999165534973, y:-0.4620455492626537},{x:0.37749993801116943, y:-0.3540909008546309},{x:0.32249999046325684, y:-0.3929546031084928},{x:0.32249999046325684, y:-0.4965909708629955}],[{x:0.32249999046325684, y:-0.4965909708629955},{x:0.32249999046325684, y:-0.3929546031084928},{x:-0.4949999451637268, y:-0.3886363224549727},{x:-0.497499942779541, y:-0.4965909708629955}]] ;

        //var polygons = [[{x:0.42750000953674316,y:0.11000000238418578},{x:0.4975000023841858,y:0.2825000464916229},{x:0.4025000333786011,y:0.29750003218650817},{x:0.3475000262260437,y:0.28499998450279235},{x:0.36000001430511475,y:0.16249998211860656}],[{x:0.4975000023841858,y:0.2825000464916229},{x:0.42750000953674316,y:0.11000000238418578},{x:0.4249999523162842,y:-0.1350000023841858},{x:0.48499995470046997,y:-0.1325000047683716}],[{x:0.48499995470046997,y:-0.1325000047683716},{x:0.4249999523162842,y:-0.1350000023841858},{x:0.37749993801116943,y:-0.20499999523162843},{x:0.3999999165534973,y:-0.2675000548362732},{x:0.45749998092651367,y:-0.21499998569488527}],[{x:0.3999999165534973,y:-0.2675000548362732},{x:0.37749993801116943,y:-0.20499999523162843},{x:0.32249999046325684,y:-0.22750003337860109},{x:0.32249999046325684,y:-0.2875000357627869}],[{x:0.32249999046325684,y:-0.2875000357627869},{x:0.32249999046325684,y:-0.22750003337860109},{x:-0.4949999451637268,y:-0.2249999761581421},{x:-0.497499942779541,y:-0.2875000357627869}]];

        var img = new Image();
        img.src = 'images/L-beam.svg';
var ud = {
        name: 'L_beam',
        img: img,
        rotAngle: 0,
        size: {x: 100 / this.config.PTM, y: 220 / this.config.PTM },
        dims: {x: 100, y: 220}
};
    bodyDef.userData = ud;

    var bb = this.world.CreateBody(bodyDef);
    bb.SetAngle(1.9*Math.PI);
    //var npolygons = [];
    for(var px=0; px<polygons.length; px++) {
        //var newVertexArray = [];
       var polygon = polygons[px];
       var vertices = [];
        var poly;
       for(var p=0; p<polygon.length; p++) {
          vertices.push(new b2Vec2(ud.size.x * polygon[p].x, ud.size.y * polygon[p].y)); 
         // vertices.push(new b2Vec2(-(0.5-polygon[p].x), .3-polygon[p].y)); 
          //newVertexArray.push(new b2Vec2(polygon[p].x / this.pixels(190), polygon[p].y / this.pixels(110))); 
     //     newVertexArray.push({x: (-(0.5-polygon[p].x)), y: .3-polygon[p].y}); 
        }
           // npolygons.push(newVertexArray);
           poly = new b2PolygonShape();
            poly.SetAsVector(vertices, vertices.length);
            //poly = b2PolygonShape.AsVector(vertices, vertices.length);
            fixDef.shape = poly;
            bb.CreateFixture(fixDef);
    }

    //console.log(JSON.stringify(npolygons));


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
