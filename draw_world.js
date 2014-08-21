var config = {
    showImages: false,
    skeleton: true
};

function drawWorld(world, context) {

    if(!config.skeleton) context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    function drawPart(entity, imgData) {
        context.save();
        var pos = entity.GetPosition();
        context.translate((pos.x + imgData.offset.x) * PTM, (pos.y + imgData.offset.y) * PTM);
        context.rotate(imgData.baseAngle); // TODO no base, complete
        context.rotate(entity.GetAngle());
        context.drawImage(imgData.img, 0, 0, imgData.dims.x, imgData.dims.y);
        context.restore();
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
function ImageData(partName, offset, dims, rot) {
    var img = new Image();
    img.src = "images/"+partName+".png"; // svg coming soon

    this.img = img;
    this.offset = offset;
    this.baseAngle = rot;
    this.dims = {
        x: dims[0],
        y: dims[1]
    }
}
