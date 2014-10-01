define(["box2dweb"], function(Box2d) {

    var b2Body = Box2D.Dynamics.b2Body,
        b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

    var config;
    var PTM, ITM;

    function drawWorld(context, world) {
        if(!config.skeleton) context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        function drawPart(entity, imgData, isFixture) {
            if(imgData.get('hidden')) return;
            context.save();
            var pos = !isFixture ? entity.GetPosition() : new Box2D.Common.Math.b2Vec2.b2Vec2(0, 0);

            context.translate(pos.x * PTM, pos.y * PTM);
            context.rotate(imgData.get('rotAngle')); 

            if(!isFixture) context.rotate(entity.GetAngle());

            context.translate(-imgData.get('dims').x/2, -imgData.get('dims').y/2);

            var opc = imgData.get('opacity');
            if(!!opc) context.globalAlpha = opc;
            context.drawImage(imgData.get('img'), 0, 0, imgData.get('dims').x, imgData.get('dims').y);
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
            var az = !!aud ? aud.get('pos').z : 0;
            var bz = !!bud ? bud.get('pos').z : 0;
            return az - bz;
        });

        zList.forEach(function(b) {
            // change this, determine if fixture will work and add userData
            if(b.GetType() == b2Body.b2_dynamicBody) {
                var userData = b.GetUserData();
                //if(userData instanceof ImageData) {
                if(!!userData) {
                    //console.log(userData.get('dims'));
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
        getDraw: function(ctx){
            return function(world) {
                drawWorld(ctx, world);
            };
        },
        init: function(conf, ctx){
            config = conf;
            PTM = config.PTM;
            ITM = config.ITM;
        },
        setDebug: function(world, context) {
            //setup debug draw
            var debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(context);
            debugDraw.SetDrawScale(config.PTM);
            debugDraw.SetFillAlpha(0.3);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            world.SetDebugDraw(debugDraw);
        },
    };
});
