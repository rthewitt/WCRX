var chair = {
    var wheelRadius = 12 / ITM;
    var chairX = 150 / PTM;
    // TODO move out, broken reference
    var chairY = (300 / PTM) - (20 / ITM);
    var chairBackHeight = 18 / ITM;
    var chairBackSeatHeight = 15 / ITM;
    var chairFrontSeatHeight = 18 / ITM;
    var chairSeatDepth = 18 / ITM;
    var chairLegBarLength = 16 / ITM; // added

    var frameSkeletonWidth = 2 / ITM;
    handlebars: {
        type: "box",
        size: { x: 11, y: 3 },
        pos: { z: 0 }
    },
    wheel: {
        type: "circle",
        size: { x: 11, y: 3 },
        pos: { z: 0 }
    },
    supportWheel: {
        type: "circle",
        size: { x: 26, y: 9 },
        pos: { z: 0 }
    },
    LBar: {
        type: "box",
        size: { x: 20, y: 4 },
        pos: { z: 0 }
    },
    smallLBar: {
        type: "box",
        size: { x: 17, y: 4 },
        pos: { z: 0 }
    }
}
