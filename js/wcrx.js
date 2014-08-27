define(function() {


    var WCRX = function() {};

/*
    function BodyPart() {
        var img = new Image();
        img.src = "images/"+partName+".svg"; // svg coming soon

        this.name = partName.replace(/-/g,'_');
        this.img = img;
        this.rotAngle= rot;
        this.dims = {
            x: dims[0],
            y: dims[1]
        }
    }
    */

    function BodyPart() {
    }

    /*
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
    */


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
    // TODO pull from CONF
    WCRX.prototype.inches = function(numInches) {
        return numInches / this.conf.ITM;
    };
    WCRX.prototype.pixels = function(numPixels) {
        return numPixels / this.conf.PTM;
    };

    WCRX.prototype.init = function(config) {
        this.conf = config;
    };

    return new WCRX;
});
