var initId = 0;
var ctx;
var world;
var canvasWidth;
var canvasHeight = 300;
var canvasTop;
var canvasLeft;

var CHEAT, CONTEXT, UPDATE;

// Masking bits for advanced collisions
var HM_TORSO = 0x0002,
    HM_HAND = 0x0008,
    WC_WHEEL = 0x0002,
    WC_FRAME = 0x0004,
    GROUND = 0x0006;

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
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
      b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef,
      b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef,
      b2WeldJointDef = Box2D.Dynamics.Joints.b2WeldJointDef;

/*
chair = [seat_width seat_depth back_height frt_seat_height back_seat_height thick wheel_rad CoG foam taper grnd_clr frt_frame_ang];
user = [height, weight, gender, leg_rad, tibia, femur, shoulder_ht, hip_width, chest_width, chest_depth, upper_arm_l, forearm_l];
*/
var PTM = 28.0; // pixels to meters
//var ITM = 39.3701; // inches to meters
var ITM = 9

// to make things more clear in the code below
function inches(numInches) {
    return numInches / ITM;
}

// Chair Measurements
var wheelRadius = 12 / ITM;
var chairX = 150 / PTM;
var chairY = (canvasHeight / PTM) - inches(20);
var chairBackHeight = 18 / ITM;
var chairBackSeatHeight = 15 / ITM;
var chairFrontSeatHeight = 18 / ITM;
var chairSeatDepth = 18 / ITM;
var chairLegBarLength = 16 / ITM; // added

// Human Measurements
var lowerArmLength = 11 / ITM,
    upperArmLength = 11 / ITM,
    forarmLength, // renamed, fix
    torsoLength = 26 / ITM,
    trunkDepth = 9 / ITM,
    lowerLegLength = 17 / ITM,
    thighDepth = inches(20),
    chestWidth,
    hipWidth;

var armSkeletonWidth = 3 / ITM;
var legSkeletonWidth = 4 / ITM;
var frameSkeletonWidth = 2 / ITM;

var shoulderX = chairX;
var shoulderY = chairY-(wheelRadius+upperArmLength+lowerArmLength);


function createWorld() {
    var world = new b2World(
        new b2Vec2(0, 10), // gravity 
        true //allow sleep
    );
    createGround(world); // what?
    return world;
}

function createBox(world, x, y, width, height, fixed) {
	if (typeof(fixed) == 'undefined') fixed = true;
	var boxSd = new b2BoxDef();
	if (!fixed) boxSd.density = 1.0;
	boxSd.extents.Set(width, height);
	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(x,y);
	return world.CreateBody(boxBd)
}

// canvas y: 300, ground: 340 - (w=50) = 290
function createGround(world) {
     var fixDef = new b2FixtureDef;
     fixDef.density = 1.0;
     fixDef.friction = 0.5;
     fixDef.restitution = 0.2;
     
     var bodyDef = new b2BodyDef;

     var gmd = new b2FilterData();
     gmd.categoryBits = GROUND;
     //gmd.maskBits = HM_TORSO | WC_FRAME;
     gmd.maskBits = 0xFFFF;
     
     //create ground
     bodyDef.type = b2Body.b2_staticBody;
     fixDef.shape = new b2PolygonShape;
     fixDef.shape.SetAsBox(20, 2);
     bodyDef.position.Set(10, 300 / 30 + 1.8);
     var gfx = world.CreateBody(bodyDef).CreateFixture(fixDef);
     gfx.SetFilterData(gmd);
     /*
     bodyDef.position.Set(10, -1.8);
     world.CreateBody(bodyDef).CreateFixture(fixDef);
     fixDef.shape.SetAsBox(2, 14);
     bodyDef.position.Set(-1.8, 13);
     world.CreateBody(bodyDef).CreateFixture(fixDef);
     bodyDef.position.Set(21.8, 13);
     world.CreateBody(bodyDef).CreateFixture(fixDef);
     */
}; 

function initWorld(world) {

    var canvas = document.getElementById('canvas');
    CONTEXT = canvas.getContext('2d');

    // fix this flow
    var wheelBody = initChair(world);

    initPerson(world, wheelBody);

         function getElementPosition(element) {
            var elem=element, tagname="", x=0, y=0;
           
            while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
               y += elem.offsetTop;
               x += elem.offsetLeft;
               tagname = elem.tagName.toUpperCase();

               if(tagname == "BODY")
                  elem=0;

               if(typeof(elem) == "object") {
                  if(typeof(elem.offsetParent) == "object")
                     elem = elem.offsetParent;
               }
            }

            return {x: x, y: y};
         }

         //setup debug draw
         var debugDraw = new b2DebugDraw();
			debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
			debugDraw.SetDrawScale(30.0);
			debugDraw.SetFillAlpha(0.5);
			debugDraw.SetLineThickness(1.0);
			debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            if((!!config && !!config.skeleton) || !config)
			    world.SetDebugDraw(debugDraw);
         
         UPDATE = window.setInterval(update, 1000 / 60);

         var canvasPosition = getElementPosition(document.getElementById("canvas"));

         document.addEventListener("mousedown", function(e) {
            isMouseDown = true;
            handleMouseMove(e);
            document.addEventListener("mousemove", handleMouseMove, true);
         }, true);
         
         document.addEventListener("mouseup", function() {
            document.removeEventListener("mousemove", handleMouseMove, true);
            isMouseDown = false;
            mouseX = undefined;
            mouseY = undefined;
         }, true);
         
         function handleMouseMove(e) {
            mouseX = (e.clientX - canvasPosition.x) / 30;
            mouseY = (e.clientY - canvasPosition.y) / 30;
            console.log('x: '+mouseX + ', y: '+mouseY);
         };
}

// currently EXPECTS wheelbody, person placement.  TODO add flow control
function initPerson(world, wheelBody) {

	var ground = world.m_groundBody;

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
    var upperLeg = world.CreateBody(bodyDef);
    bfx = upperLeg.CreateFixture(fixDef);
    bfx.SetFilterData(bodyFilterData);
    delete bodyDef.userData;

    // lower leg
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsOrientedBox(lowerLegLength/2, legSkeletonWidth/2, new b2Vec2(0, 0), 0);
    bodyDef.position.Set(chairX+inches(17)+thighDepth, chairY-inches(7));
    bodyDef.userData = new ImageData('lower-leg', [65, 47], 0);
    var lowerLeg = world.CreateBody(bodyDef);
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
    world.CreateJoint(kneeDef);


    // torso
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(trunkDepth/2, torsoLength/2);
    //fixDef.shape.SetAsOrientedBox(trunkDepth/2, torsoLength/2, new b2Vec2(0, 0), 0);
    bodyDef.position.Set(chairX+inches(10), chairY-inches(19));
    bodyDef.userData = new ImageData('torso', [42, 130], 0);
    var torso = world.CreateBody(bodyDef);
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
    world.CreateJoint(hipDef);

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
    var upperArm = world.CreateBody(bodyDef);
    bfx = upperArm.CreateFixture(fixDef);
    bfx.SetFilterData(bodyFilterData);
    delete bodyDef.userData;

    // lower arm
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsOrientedBox(armSkeletonWidth/2, lowerArmLength/2, new b2Vec2(0, 0), LOWER_ARM_ANGLE);
    bodyDef.position.Set(shoulderX, shoulderY + upperArmLength+lowerArmLength/2);
    bodyDef.userData = new ImageData('lower-arm', [16, 36], 0);
    var lowerArm = world.CreateBody(bodyDef);
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
    world.CreateJoint(shoulderDef);

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
    world.CreateJoint(elbowDef);

    var wristDef = new b2RevoluteJointDef();
    wristDef.collideConnected = false; // TODO modify bitfield for wheel/arms
    wristDef.Initialize(lowerArm, wheelBody, new b2Vec2(chairX, chairY-wheelRadius));
    world.CreateJoint(wristDef);

    CHEAT = lowerArm;
}

function initChair(world) {

    // Wheel
    var fixDef = new b2FixtureDef();
    fixDef.density = 1.0;
    fixDef.friction = 0.6;
    fixDef.restitution = 0.5;

    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.Set(chairX, chairY);

    fixDef.shape = new b2CircleShape(wheelRadius);

    bodyDef.userData = new ImageData('wheel', [85, 85], 0);
    var wheelBody = world.CreateBody(bodyDef);
    wheelBody.CreateFixture(fixDef);
    delete bodyDef.userData;


    var fmd = new b2FilterData();
    fmd.categoryBits = WC_FRAME;
    fmd.maskBits = HM_TORSO | GROUND;

    var frx; // fixture holder

    // raise bar
    fixDef.shape = new b2PolygonShape();
    fixDef.shape.SetAsBox(0.1, 0.2);
    var chairFrame = world.CreateBody(bodyDef);
    frx = chairFrame.CreateFixture(fixDef);
    frx.SetFilterData(fmd);
    // seat (Actually bar, we'll make a seat later!)
    fixDef.shape = new b2PolygonShape();
    // TODO make the offset an actual measurement
    fixDef.shape.SetAsOrientedBox((chairSeatDepth+(5/ITM))/2, frameSkeletonWidth/2, new b2Vec2(inches(8), inches(-5)), -0.1*Math.PI); 
    frx = chairFrame.CreateFixture(fixDef);
    frx.SetFilterData(fmd);
    // backrest
    fixDef.shape = new b2PolygonShape();
    var backVector = new b2Vec2(-0.4, -0.6);
    fixDef.shape.SetAsOrientedBox(frameSkeletonWidth/2, chairBackHeight/2, backVector); 
    frx = chairFrame.CreateFixture(fixDef);
    frx.SetFilterData(fmd);
    // leg bar
    fixDef.shape = new b2PolygonShape();
    var legBarVec = new b2Vec2(inches(23), 0);
    fixDef.shape.SetAsOrientedBox(frameSkeletonWidth/2, chairLegBarLength/2, legBarVec, -0.15*Math.PI);
    frx = chairFrame.CreateFixture(fixDef);
    frx.SetFilterData(fmd);

    // support bar
    var weirdDiffX = 1.6; // removed, matches leg bar shift above
    // TODO determine from where the 23 inches could be inferred
    var weirdDiffY = 0.8;

    fixDef.shape = new b2PolygonShape();
    bodyDef.position.Set(chairX+inches(23), chairY+weirdDiffY);
    fixDef.shape.SetAsOrientedBox(inches(5)/2, frameSkeletonWidth/2, new b2Vec2(0, 0), -0.4*Math.PI);
    var supportBar = world.CreateBody(bodyDef);
    supportBar.CreateFixture(fixDef);
    var verts = fixDef.shape.GetVertices();
    verts.sort(function(a, b) { return b.y - a.y; });
    /*
    for(var v=0; v<verts.length; v++) {
        console.log(verts[v]);
    }*/

    //var frAxleLoc = { x: chairX+inches(23)+verts[0].x, y: chairY+weirdDiffY+verts[0].y };
    var frAxleLoc = { x: chairX+inches(22), y: chairY+weirdDiffY+verts[0].y };
    var weldLoc = { 
        x: chairX + weirdDiffX,
        y: chairY + weirdDiffY
    }
    // support wheel
    fixDef.shape = new b2CircleShape(inches(2.5));
    bodyDef.position.Set(frAxleLoc.x, frAxleLoc.y);
    var supportWheel = world.CreateBody(bodyDef);
    supportWheel.CreateFixture(fixDef);

    // Add joint for Wheel, frame
	var axleDef = new b2RevoluteJointDef();
    axleDef.collideConnected = false;
    axleDef.Initialize(wheelBody, chairFrame, new b2Vec2(chairX, chairY)); // TODO anchor A, B
    world.CreateJoint(axleDef);

    // Front axle
    var frAxleDef = new b2RevoluteJointDef();
    frAxleDef.collideConnected = false;
    frAxleDef.Initialize(supportWheel, supportBar, new b2Vec2(frAxleLoc.x, frAxleLoc.y)); // are these anchors accurate?  Why the blue line?
    world.CreateJoint(frAxleDef);

    // should create a weld joint at verts[3] (outer, upper vertex of support bar)
    var weldJointDef = new b2WeldJointDef();
    //weldJointDef.Initialize(supportBar, chairFrame, new b2Vec2(weldLoc.x, weldLoc.y));
    weldJointDef.bodyA = supportBar;
    weldJointDef.bodyB = chairFrame;
    weldJointDef.localAnchorA.Set(-inches(5)/2, 0);
    weldJointDef.localAnchorB.Set(2.3, 0.8);
    var weldJoint = world.CreateJoint(weldJointDef);

    // Testing forces
    /*
    setTimeout(function() {
        chairFrame.ApplyImpulse(new b2Vec2(25, 25), new b2Vec2(chairX-(25/ITM), chairY));
    }, 2000);
    */

    return wheelBody; // reference for human placement
}

function update() {
    CHEAT.ApplyForce(new b2Vec2(-12, 0), new b2Vec2(0, -lowerArmLength));
    CHEAT.ApplyForce(new b2Vec2(12, 0), new b2Vec2(0, +lowerArmLength));
    // This is used to debug rotational problems, centroids
    //CHEAT.ApplyForce(new b2Vec2(52, 0), new b2Vec2(0, +lowerArmLength));
    //CHEAT.ApplyImpulse(new b2Vec2(2, 2), new b2Vec2(0, lowerArmLength));
    world.Step(1.0 / 60, 10, 10);
    world.DrawDebugData();
    world.ClearForces();
    drawWorld(world, CONTEXT);
}

function destroyWorld(world) {
    window.clearInterval(UPDATE);
    world.ClearForces();
    for(b = world.GetBodyList(); b; b = b.GetNext()) {
        world.DestroyBody(b);
    }
    update();
}

function resetWorld() {
    if(!!world) {
        destroyWorld(world);
    }
    world = createWorld();
    initWorld(world);
}

$(document).ready(function($) {
//Event.observe(window, 'load', function() {
    resetWorld();
    $(":input").focus(function() {
        $("label[for='" + this.id + "']").addClass("labelfocus");
    }).blur(function() {
        $("label").removeClass("labelfocus");
    });
    $("#btn-reset").click(resetWorld);
});

