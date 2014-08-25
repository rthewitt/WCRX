var config = {
    showImages: true,
    skeleton: false,
    debug: false
};

// offset for rotational andhor
// change this to pixels so we can establish from asset?
var rotationalOffset = {
    fake_torso: [0, 0],
    fake_upper_leg: [0, 0],
    //fake_lower_leg: [0, -13]
    fake_lower_leg: [0, -7]
};

function drawWorld(world, context) {

    if(!config.skeleton) context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Why does this translate need a static pad?  These work for torso, upper-leg.  Shape dependent???
    var wtfX=20, wtfY=10;

    function drawPart(entity, imgData) {
        context.save();
        var pos = entity.GetPosition();


        context.translate(pos.x * PTM + wtfX, pos.y * PTM + wtfY);
        context.rotate(imgData.rotAngle); 
        context.rotate(entity.GetAngle());

        // testing rotational offset!!
        var offset = rotationalOffset[imgData.name];
        if(!offset) console.log(imgData.name);
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
            if(userData instanceof ImageData) {
                drawPart(b, userData);
            } 
            for(f = b.GetFixtureList(); f; f = f.GetNext()) {
                userData = f.GetUserData();
         //       if(userData instanceof ImageData) drawPart(f, userData);
            }

        } 
    }
}

// use prototype?
// change partName -> lookup of JSON file?
function ImageData(partName, dims, rot) {
    var img = new Image();
    img.src = "images/"+partName+".png"; // svg coming soon

    this.name = partName.replace(/-/g,'_');
    this.img = img;
    this.rotAngle= rot;
    this.dims = {
        x: dims[0],
        y: dims[1]
    }
}
