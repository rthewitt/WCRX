define(["box2dweb", "underscore"], function(Box2D, _) {

    var WCRX = function() {};

    //////// REMOVE ///////

    var CHEAT, 
        wheelRadius,
        chairX,
        chairY,
        chairBackHeight,
        chairBackSeatHeight,
        chairFrontSeatHeight,
        chairSeatDepth,
        chairLegBarLength,
        shoulderX,
        shoulderY;

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
         bodyDef.position.Set(10, this.pixels(300) + 1.8);
         var gfx = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
         gfx.SetFilterData(gmd);
    }; 

    function BodyPart(def, conf) {
        var img = new Image();
        img.src = 'images/'+def.name+'.svg';

        this.name = def.name.replace(/-/g,'_');
        this.type = def.type;
        this.img = img;
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


    //function getBodyPart(fixDef, bodyDef, bodyPart, fdd, isFixture) {
    function getBodyPart(def, fixDef, isFixture) {

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;

        var fdd = new b2FilterData();
        fdd.categoryBits = def.cat;
        fdd.maskBits = def.mask;

        var bodyPart = new BodyPart(def, this.config);
        bodyDef.position.Set(chairX, chairY-this.inches(30));
        bodyDef.userData = bodyPart;
        var body = this.world.CreateBody(bodyDef);
        body.SetAngle(-1.7 * Math.PI);

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
        return this.world.CreateJoint(jdf);
    }

    function initP() {
        
        var humanFixDef = new b2FixtureDef(); 
        humanFixDef.density = 1.0;
        humanFixDef.friction = 0.6;
        humanFixDef.restitution = 0.5;


        var parts = {}, bodies = {};

        for(var bp in this.config.person) {
            var b2b = getBodyPart.call(this, this.config.person[bp], humanFixDef); 
            bodies[bp] = b2b;
            parts[bp] = b2b.userData;
        }

        var knee = getRevJoint.call(this, bodies.upperLeg, bodies.lowerLeg, 
                { x: parts.upperLeg.size.x/2, y: parts.upperLeg.size.y/2 },
                { x: -parts.lowerLeg.size.x/2, y: parts.lowerLeg.size.y/2 });

        var elbow = getRevJoint.call(this, bodies.upperArm, bodies.lowerArm, 
                { x: -parts.upperArm.size.x/2, y: parts.upperArm.size.y/2 },
                { x: -parts.lowerArm.size.x/2, y: -parts.lowerArm.size.y/2 });

        var hip = getRevJoint.call(this, bodies.upperLeg, bodies.torso, 
                { x: -parts.upperLeg.size.x/2, y: parts.upperLeg.size.y/2 },
                { x: -parts.torso.size.x/2 * 0.5, y: parts.torso.size.y/2*0.8 });

        var shoulder = getRevJoint.call(this, bodies.upperArm, bodies.torso, 
                { x: -parts.upperArm.size.x/2, y: -parts.upperArm.size.y/2 },
                { x: -parts.torso.size.x/2, y: -(parts.torso.size.y/2)*0.4 });

        /*
        shoulderDef.bodyA = upperArm;
        shoulderDef.bodyB = torso;
        shoulderDef.localAnchorB.Set(-trunkDepth/2, -torsoLength/2);
        //shoulderDef.localAnchorA.Set(upperArmLength, upperArmLength/2);
        // DYNAMIC ANGLE: 3
        shoulderDef.localAnchorA.Set(-armSkeletonWidth/2, -upperArmLength/2);
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

        var parts = {}, bodies = {};

        for(var cp in this.config.chair) {
            var b2b = getBodyPart.call(this, this.config.chair[cp], chairFixDef);
            bodies[cp] = b2b;
            parts[cp] = b2b.userData;
        }
    }

    function initChair() {

        // Wheel
        var fixDef = new b2FixtureDef();
        fixDef.density = 1.0;
        fixDef.friction = 0.6;
        fixDef.restitution = 0.5;

        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(chairX, chairY);

        fixDef.shape = new b2CircleShape(wheelRadius);

        bodyDef.userData = new ImageData('wheel', [125, 125], 0);
        var wheelBody = this.world.CreateBody(bodyDef);
        wheelBody.CreateFixture(fixDef);
        delete bodyDef.userData;


        var fmd = new b2FilterData();
        fmd.categoryBits = WC_FRAME;
        fmd.maskBits = HM_TORSO | GROUND;

        var frx; // fixture holder

        // raise bar
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsBox(this.inches(1), this.inches(2));
        var chairFrame = this.world.CreateBody(bodyDef);
        frx = chairFrame.CreateFixture(fixDef);
        frx.SetFilterData(fmd);
        // seat (Actually bar, we'll make a seat later!)
        fixDef.shape = new b2PolygonShape();
        // TODO make the offset an actual measurement
        fixDef.shape.SetAsOrientedBox((chairSeatDepth+this.inches(5))/2, frameSkeletonWidth/2, new b2Vec2(this.inches(8), this.inches(-5)), -0.05*Math.PI); 
        frx = chairFrame.CreateFixture(fixDef);
        frx.SetFilterData(fmd);
        // backrest
        fixDef.shape = new b2PolygonShape();
        var backVector = new b2Vec2(-this.inches(4), -this.inches(12));
        fixDef.shape.SetAsOrientedBox(frameSkeletonWidth/2, chairBackHeight/2, backVector); 
        frx = chairFrame.CreateFixture(fixDef);
        frx.SetFilterData(fmd);
        // leg bar
        fixDef.shape = new b2PolygonShape();
        //var legBarVec = new b2Vec2(this.inches(23), 0);
        var legBarVec = new b2Vec2(this.inches(23), this.inches(6));
        fixDef.shape.SetAsOrientedBox(frameSkeletonWidth/2, chairLegBarLength/2, legBarVec, -0.10*Math.PI);
        frx = chairFrame.CreateFixture(fixDef);
        frx.SetFilterData(fmd);

        // support bar
        var weirdDiffX = 1.6; // removed, matches leg bar shift above
        // TODO determine from where the 23 this.inches could be inferred
        var weirdDiffY = 0.8;

        fixDef.shape = new b2PolygonShape();
        bodyDef.position.Set(chairX, chairY+weirdDiffY);
        fixDef.shape.SetAsOrientedBox(this.inches(5)/2, frameSkeletonWidth/2, new b2Vec2(0, 0), -0.4*Math.PI);
        var supportBar = this.world.CreateBody(bodyDef);
        supportBar.CreateFixture(fixDef);
        var verts = fixDef.shape.GetVertices();
        verts.sort(function(a, b) { return b.y - a.y; });
        /*
        for(var v=0; v<verts.length; v++) {
            console.log(verts[v]);
        }*/

        //var frAxleLoc = { x: chairX+this.inches(23)+verts[0].x, y: chairY+weirdDiffY+verts[0].y };
        //var frAxleLoc = { x: chairX-this.inches(1), y: chairY+weirdDiffY+verts[0].y };
        var frAxleLoc = { x: 0, y: chairY+weirdDiffY+verts[0].y };
        var weldLoc = { 
            x: chairX, // + weirdDiffX,
            y: chairY// + weirdDiffY
        }
        // support wheel
        fixDef.shape = new b2CircleShape(this.inches(2.5));
        bodyDef.position.Set(frAxleLoc.x, frAxleLoc.y);
        var supportWheel = this.world.CreateBody(bodyDef);
        supportWheel.CreateFixture(fixDef);

        // Add joint for Wheel, frame
        var axleDef = new b2RevoluteJointDef();
        axleDef.collideConnected = false;
        axleDef.Initialize(wheelBody, chairFrame, new b2Vec2(chairX, chairY)); // TODO anchor A, B
        this.world.CreateJoint(axleDef);

        // Front axle
        var frAxleDef = new b2RevoluteJointDef();
        frAxleDef.collideConnected = false;
        frAxleDef.Initialize(supportWheel, supportBar, new b2Vec2(frAxleLoc.x, frAxleLoc.y)); // are these anchors accurate?  Why the blue line?
        this.world.CreateJoint(frAxleDef);

        // should create a weld joint at verts[3] (outer, upper vertex of support bar)
        var weldJointDef = new b2WeldJointDef();
        //weldJointDef.Initialize(supportBar, chairFrame, new b2Vec2(weldLoc.x, weldLoc.y));
        weldJointDef.bodyA = supportBar;
        weldJointDef.bodyB = chairFrame;
        weldJointDef.localAnchorA.Set(-this.inches(5)/2, 0);
        weldJointDef.localAnchorB.Set(2.3, 0.8);
        var weldJoint = this.world.CreateJoint(weldJointDef);

        // Testing forces
        /*
        setTimeout(function() {
            chairFrame.ApplyImpulse(new b2Vec2(25, 25), new b2Vec2(chairX-this.inches(25)), chairY));
        }, 2000);
        */

        return wheelBody; // reference for human placement
    }

    WCRX.prototype.update = function(CB) {
        // TODO remove global
        //CHEAT.ApplyForce(new b2Vec2(-12, 0), new b2Vec2(0, -lowerArmLength));
        //CHEAT.ApplyForce(new b2Vec2(12, 0), new b2Vec2(0, +lowerArmLength));
        this.world.Step(1.0 / 60, 10, 10);
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
        //this.initPerson();

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
        chairX = this.pixels(150);
        chairY = this.pixels(300) - this.inches(20);
        chairBackHeight = this.inches(18);
        chairBackSeatHeight = this.inches(15);
        chairFrontSeatHeight = this.inches(18);
        chairSeatDepth = this.inches(18);
        chairLegBarLength = this.inches(22);
        frameSkeletonWidth = this.inches(2);

        shoulderX = chairX;
        //shoulderY = chairY-(wheelRadius+upperArmLength+lowerArmLength);
        ///////////////////
    };

    return new WCRX;
});
