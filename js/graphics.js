define(["box2dweb"], function(Box2d) {

    var b2Body = Box2D.Dynamics.b2Body,
        b2DebugDraw = Box2D.Dynamics.b2DebugDraw;


    // offset for rotational andhor
    // change this to pixels so we can establish from asset?
    var rotationalOffset = {
        torso: [0, 0],
        upper_arm: [0, 0],
        lower_arm: [0, 0],
        hand: [0, 0],
        upper_leg: [0, 0],
        lower_leg: [0, 0],
        wheel: [0, 0]
    };

    var config, context;
    var PTM, ITM;

    function drawWorld(world) {

        if(!config.skeleton) context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        // Why does this translate need a static pad?  These work for torso, upper-leg.  Shape dependent???
        //var wtfX=20, wtfY=18;
        // works for wheel
        //var wtfX=13, wtfY=18;
        var wtfX=0, wtfY=0;

        function drawPart(entity, imgData, isFixture) {
            context.save();
            var pos = !isFixture ? entity.GetPosition() : new Box2D.Common.Math.b2Vec2.b2Vec2(0, 0);


            context.translate(pos.x * PTM + wtfX, pos.y * PTM + wtfY);
            context.rotate(imgData.rotAngle); 

            if(!isFixture) context.rotate(entity.GetAngle());

            // testing rotational offset!!
            var offset = rotationalOffset[imgData.name];
            if(!offset) offset = [0, 0];
            context.translate(-imgData.dims.x/2 + offset[0], -imgData.dims.y/2 + offset[1]);

            context.drawImage(imgData.img, 0, 0, imgData.dims.x, imgData.dims.y);
            context.restore();

            context.save();

            // translated center
            if(!!config.debug) {
                context.beginPath();
                context.arc(pos.x*PTM+wtfX, pos.y*PTM+wtfY, 5, 0, 2*Math.PI, false);
                context.fillStyle = 'green';
                context.fill();
                context.stroke();
                context.restore();

                // center of body
                context.save();
                context.beginPath();
                context.translate(pos.x*PTM, pos.y*PTM);
                context.arc(0, 0, 5, 0, 2*Math.PI, false);
                context.fillStyle = 'red';
                context.fill();
                context.stroke();
                context.restore();
            }

        }

        for(b = world.GetBodyList(); b; b = b.GetNext()) {
            if(!config.showImages) return;
            // change this, determine if fixture will work and add userData
            if(b.GetType() == b2Body.b2_dynamicBody) {
                var userData = b.GetUserData();
                //if(userData instanceof ImageData) {
                if(!!userData) {
                    drawPart(b, userData);
                } 
                for(f = b.GetFixtureList(); f; f = f.GetNext()) {
                    userData = f.GetUserData();
                    if(userData instanceof ImageData) drawPart(f, userData, true);
                }

            } 
        }
    }

    return {
        init: function(conf, ctx){
            config = conf;
            context = ctx;
            // TODO fix
            PTM = config.PTM;
            ITM = config.ITM;
        },
        setDebug: function(world) {
            //setup debug draw
            var debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(context);
            // TODO verify this
            //debugDraw.SetDrawScale(30.0);
            debugDraw.SetDrawScale(config.PTM);
            debugDraw.SetFillAlpha(0.3);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            if((!!config && !!config.skeleton) || !config)
                world.SetDebugDraw(debugDraw);
        },
        draw: drawWorld
    };
});
