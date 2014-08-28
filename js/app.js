define(["box2dweb", "./wcrx"], function(Box2D, WheelChairRx) {

    // ///////////////////////////////// REMOVE ////////////////////////////////
      
// Masking bits for advanced collisions


    var CHEAT;
    // Chair Measurements
    var wheelRadius = inches(12);
    var chairX = pixels(150);
    // TODO move out, broken reference
    var chairY = pixels(300) - inches(20);
    var chairBackHeight = inches(18);
    var chairBackSeatHeight = inches(15);
    var chairFrontSeatHeight = inches(18);
    var chairSeatDepth = inches(18);
    var chairLegBarLength = inches(16);

    var frameSkeletonWidth = inches(2);

    // /////////////////////////////////////////////////////////////////////////

    var shoulderX = chairX;
    //var shoulderY = chairY-(wheelRadius+upperArmLength+lowerArmLength);

    // cleaner code
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

    var App = function() {};


    // TODO use handlers for force, manage animation with an idle state?


    // currently EXPECTS wheelbody, person placement.  TODO add flow control
    function initPerson(wheelBody) {

        var ground = this.world.m_groundBody;

        // Define human body
        var fixDef = new b2FixtureDef(); 
        fixDef.density = 1.0;
        fixDef.friction = 0.6;
        fixDef.restitution = 0.5;

        // place hand on wheel... only so we can establish userData for sprite?
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsOrientedBox(0.1, 0.1, new b2Vec2(0, -wheelRadius), 0);
        fixDef.userData = new ImageData('hand', [35, 35], 0);
        var hand = wheelBody.CreateFixture(fixDef);
        var hmd = new b2FilterData();
        hmd.categoryBits = HM_HAND;
        hmd.maskBits = GROUND;
        hand.SetFilterData(hmd);
        delete fixDef.userData;


        var bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;

        var bodyFilterData = new b2FilterData();
        bodyFilterData.categoryBits = HM_TORSO;
        bodyFilterData.maskBits = WC_FRAME | GROUND;

        var bfx; // body fixture holder

        // upper leg
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsOrientedBox(thighDepth/2, legSkeletonWidth/2, new b2Vec2(0, 0), 0);
        bodyDef.position.Set(chairX+inches(10), chairY-inches(7));
        bodyDef.userData = new ImageData('upper-leg', [77, 28], 0);
        var upperLeg = this.world.CreateBody(bodyDef);
        bfx = upperLeg.CreateFixture(fixDef);
        bfx.SetFilterData(bodyFilterData);
        delete bodyDef.userData;

        // lower leg
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsOrientedBox(lowerLegLength/2, legSkeletonWidth/2, new b2Vec2(0, 0), 0);
        bodyDef.position.Set(chairX+inches(17)+thighDepth, chairY-inches(7));
        bodyDef.userData = new ImageData('lower-leg', [65, 47], 0);
        var lowerLeg = this.world.CreateBody(bodyDef);
        bfx = lowerLeg.CreateFixture(fixDef);
        bfx.SetFilterData(bodyFilterData);
        delete bodyDef.userData;

        // foot (fixture)
        fixDef.shape = new b2PolygonShape();
        var footVec = new b2Vec2(lowerLegLength/2 - inches(1), -inches(3.2));
        fixDef.shape.SetAsOrientedBox(inches(1), inches(6), footVec, 0);

        var shoe = lowerLeg.CreateFixture(fixDef);
        

        // knee joint
        var kneeDef = new b2RevoluteJointDef();
        kneeDef.collideConnected = false;
        kneeDef.bodyA = upperLeg;
        kneeDef.bodyB = lowerLeg;
        kneeDef.localAnchorA.Set(thighDepth/2, -legSkeletonWidth/2);
        kneeDef.localAnchorB.Set(-lowerLegLength/2, -legSkeletonWidth/2);
        this.world.CreateJoint(kneeDef);


        // torso
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsBox(trunkDepth/2, torsoLength/2);
        //fixDef.shape.SetAsOrientedBox(trunkDepth/2, torsoLength/2, new b2Vec2(0, 0), 0);
        bodyDef.position.Set(chairX+inches(10), chairY-inches(19));
        bodyDef.userData = new ImageData('torso', [42, 130], 0);
        var torso = this.world.CreateBody(bodyDef);
        bfx = torso.CreateFixture(fixDef);
        bfx.SetFilterData(bodyFilterData);
        delete bodyDef.userData;

        // attach leg to torso
        var hipDef = new b2RevoluteJointDef();
        hipDef.collideConnected = false;
        hipDef.bodyA = upperLeg;
        hipDef.bodyB = torso;
        hipDef.localAnchorA.Set(-thighDepth/2, legSkeletonWidth/2);
        hipDef.localAnchorB.Set(-(trunkDepth/2)+legSkeletonWidth/2, torsoLength/2);
        this.world.CreateJoint(hipDef);

        // DYNAMIC ANGLE: 1
        //var UPPER_ARM_ANGLE = -0.5 * Math.PI; //(Math.PI * 7.0) / 6.0;
        var UPPER_ARM_ANGLE = 0;
        var LOWER_ARM_ANGLE = 0;

        // DYNAMIC ANGLE: 2
        //var upperOffset = new b2Vec2(upperArmLength/2, upperArmLength/2);
        var upperOffset = new b2Vec2(0, 0);

        
        // upper arm
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsOrientedBox(armSkeletonWidth/2, upperArmLength/2, upperOffset, UPPER_ARM_ANGLE);
        bodyDef.position.Set(shoulderX, shoulderY+upperArmLength/2);
        bodyDef.userData = new ImageData('upper-arm', [23, 43], 0);
        var upperArm = this.world.CreateBody(bodyDef);
        bfx = upperArm.CreateFixture(fixDef);
        bfx.SetFilterData(bodyFilterData);
        delete bodyDef.userData;

        // lower arm
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsOrientedBox(armSkeletonWidth/2, lowerArmLength/2, new b2Vec2(0, 0), LOWER_ARM_ANGLE);
        bodyDef.position.Set(shoulderX, shoulderY + upperArmLength+lowerArmLength/2);
        bodyDef.userData = new ImageData('lower-arm', [16, 36], 0);
        var lowerArm = this.world.CreateBody(bodyDef);
        lowerArm.CreateFixture(fixDef);
        delete bodyDef.userData;

        var shoulderDef = new b2RevoluteJointDef();
        shoulderDef.collideConnected = false;
        shoulderDef.bodyA = upperArm;
        shoulderDef.bodyB = torso;
        shoulderDef.localAnchorB.Set(-trunkDepth/2, -torsoLength/2);
        //shoulderDef.localAnchorA.Set(upperArmLength, upperArmLength/2);
        // DYNAMIC ANGLE: 3
        shoulderDef.localAnchorA.Set(-armSkeletonWidth/2, -upperArmLength/2);
        this.world.CreateJoint(shoulderDef);

        // elbow joint
        var elbow = {
            x: shoulderX,
            y: shoulderY + upperArmLength
        };

        var elbowDef = new b2RevoluteJointDef();
        elbowDef.collideConnected = false;
        elbowDef.bodyA = upperArm;
        elbowDef.bodyB = lowerArm;
        elbowDef.localAnchorA.Set(-armSkeletonWidth/2, upperArmLength/2);
        elbowDef.localAnchorB.Set(-armSkeletonWidth/2, -lowerArmLength/2);
        this.world.CreateJoint(elbowDef);

        var wristDef = new b2RevoluteJointDef();
        wristDef.collideConnected = false; // TODO modify bitfield for wheel/arms
        wristDef.Initialize(lowerArm, wheelBody, new b2Vec2(chairX, chairY-wheelRadius));
        this.world.CreateJoint(wristDef);

        CHEAT = lowerArm;
    }

});

