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

        function drawPart(entity, imgData, isFixture) {
            context.save();
            var pos = !isFixture ? entity.GetPosition() : new Box2D.Common.Math.b2Vec2.b2Vec2(0, 0);


            context.translate(pos.x * PTM, pos.y * PTM);
            context.rotate(imgData.rotAngle); 

            if(!isFixture) context.rotate(entity.GetAngle());

            // testing rotational offset!!
            var offset = rotationalOffset[imgData.name];
            if(!offset) offset = [0, 0];
            context.translate(-imgData.dims.x/2 + offset[0], -imgData.dims.y/2 + offset[1]);

            if(!!imgData.opacity) context.globalAlpha = imgData.opacity;
            context.drawImage(imgData.img, 0, 0, imgData.dims.x, imgData.dims.y);
            context.restore();

            context.save();

            // translated center
            if(!!config.debug) {
                var cpx = pos.x*PTM, cpy = pos.y*PTM;
                context.beginPath();
                context.arc(cpx, cpy, 7, 0, 2*Math.PI, false);
                context.fillStyle = 'black';
                context.fill();
                context.stroke();
                //context.restore();
                context.beginPath();
                context.arc(cpx, cpy, 5, 0, 2*Math.PI, false);
                context.fillStyle = 'green';
                context.fill();
                context.stroke();
                context.restore();
            }

        }

        var zList = [];
        for(b = world.GetBodyList(); b; b = b.GetNext()) {
            if(config.showImages) zList.push(b);
        }

        zList.sort(function(a, b){ 
            var aud = a.GetUserData();
            var bud = b.GetUserData();
            var az = !!aud ? aud.pos.z : 0;
            var bz = !!bud ? bud.pos.z : 0;
            return az - bz;
        });

        zList.forEach(function(b) {
            // change this, determine if fixture will work and add userData
            if(b.GetType() == b2Body.b2_dynamicBody) {
                var userData = b.GetUserData();
                //if(userData instanceof ImageData) {
                if(!!userData) {
                    drawPart(b, userData);
                } 
                /*
                for(f = b.GetFixtureList(); f; f = f.GetNext()) {
                    userData = f.GetUserData();
                    if(userData instanceof ImageData) drawPart(f, userData, true);
                }
                */
            } 
        });
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
                world.SetDebugDraw(debugDraw);
        },
        draw: drawWorld
    };
});
