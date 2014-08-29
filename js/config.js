define(["./scaledPolygons"], function(pollyColl){

    var GROUND = 1,
        HM_TORSO = 2,
        HM_HAND = 4,
        WC_WHEEL = 8,
        WC_BARRIER = 16,
        WC_FRAME = 32;

    var seatMask = WC_FRAME | HM_TORSO | GROUND;
    var personMask = WC_BARRIER | GROUND;

    
    return {
        showImages: true,
        skeleton: false,
        debug: false,

        groundCat: GROUND,
        groundMask: 0xFFFF,

        PTM: 190.0, // pixels to "meters"
        ITM: 39.3701,


        // ratios are here, but will be moved INTO the code and out of the config
        person: {
            lowerArm: {
                name: "lower-arm",
                type: "box",
                size: { x: 4, y: 11},
                pos: { z: 6 },
                cat: HM_TORSO,
                mask: personMask
            },
            upperArm: {
                name: "upper-arm",
                type: "box",
                size: { x: 4.5 * 1.25, y: 11}, // extra width
                pos: { z: 6 },
                cat: HM_TORSO,
                mask: personMask
            },
            torso: {
                name: "torso",
                type: "poly",
                polygons: pollyColl.torso,
                size: { x: 9, y: 22*1.48 }, // ratio: head+neck 
                pos: { z: 0 },
                cat: HM_TORSO,
                mask: personMask
            },
            upperLeg: {
                name: "upper-leg",
                type: "box",
                size: { x: 22, y: 7 },
                pos: { z: 2 },
                cat: HM_TORSO,
                mask: personMask
            },
            lowerLeg: {
                name: "lower-leg",
                type: "poly",
                polygons: pollyColl.lowerLeg,
                size: { x: 20, y: 5.0 * 2 }, // ratio: +foot
                pos: { z: 2 },
                cat: HM_TORSO,
                mask: personMask
            }
        },
        chair: {
            // we'll infer this from seatback height + X"
            seatBack: {
                name: "seat-back",
                type: "box",
                size: { x: 2, y: 8 },
                pos: { z: 2 },
                cat: WC_BARRIER,
                mask: seatMask
            },
            foam: {
                name: "seat-bottom",
                type: "box",
                size: { x: 13, y: 2 },
                pos: { z: 2 },
                cat: WC_BARRIER,
                mask: seatMask
            },
            // seat back
            handlebars: {
                name: "handlebars",
                type: "box",
                size: { x: 1.5 * 4, y: 13 }, // width
                pos: { z: 2 },
                cat: WC_FRAME,
                mask: GROUND
            },
            wheel: {
                name: "wheel",
                type: "circle",
                size: { r: 12 },
                pos: { z: 5 },
                cat: WC_WHEEL,
                mask: GROUND
            },
            supportWheel: {
                name: "support-wheel",
                type: "circle",
                size: { r: 2.5 },
                pos: { z: 1 },
                cat: WC_WHEEL,
                mask: GROUND
            },
            frontConnector: {
                name: "support-wheel-connector",
                type: "box",
                size: { x: 4, y: 7 },
                pos: { z: 4 },
                cat: WC_FRAME,
                mask: GROUND
            },
            raiseBar: {
                name: "raise-bar",
                type: "box",
                size: { x: 3, y: 7 },
                pos: { z: 4 },
                cat: WC_FRAME,
                mask: GROUND
            },
            LBar: {
                name: "L-beam",
                type: "poly",
                polygons: pollyColl.LBar,
                size: { x: 23, y: 15 }, // for now, seatDepth + 5"
                pos: { z: 3 },
                cat: WC_FRAME,
                mask: GROUND
            },
            footRest: {
                name: "foot-rest",
                type: "box",
                size: { x: 4, y: 6 },
                pos: { z: 2 },
                //cat: WC_FRAME,
                //mask: GROUND 
                cat: WC_BARRIER,
                mask: seatMask
            }
        }
    }
});
