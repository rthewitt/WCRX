define(function(){

    var GROUND = 1,
        HM_TORSO = 2,
        HM_HAND = 4,
        WC_WHEEL = 8,
        WC_BARRIER = 16,
        WC_FRAME = 32;

    var seatMask = HM_TORSO | GROUND;
    var personMask = WC_BARRIER | GROUND;
    
    return {
        showImages: true,
        skeleton: true,
        debug: false,

        groundCat: GROUND,
        groundMask: 0xFFFF,

        PTM: 190.0, // pixels to "meters"
        ITM: 39.3701,


        person: {
            lowerArm: {
                name: "lower-arm",
                type: "box",
                size: { x: 3, y: 11},
                pos: { z: 0 },
                cat: HM_TORSO,
                mask: personMask
            },
            upperArm: {
                name: "upper-arm",
                type: "box",
                size: { x: 3 * 1.25, y: 11}, // extra width
                pos: { z: 0 },
                cat: HM_TORSO,
                mask: personMask
            },
            torso: {
                name: "torso",
                type: "box",
                size: { x: 9, y: 26*1.25 }, // includes head (change)
                pos: { z: 0 },
                cat: HM_TORSO,
                mask: personMask
            },
            upperLeg: {
                name: "upper-leg",
                type: "box",
                size: { x: 20, y: 5 },
                pos: { z: 0 },
                cat: HM_TORSO,
                mask: personMask
            },
            lowerLeg: {
                name: "lower-leg",
                type: "box",
                size: { x: 17, y: 4*2 }, // includes foot
                pos: { z: 0 },
                cat: HM_TORSO,
                mask: personMask
            }
        },
        chair: {
            // we'll infer this from seatback height + X"
            seatBack: {
                name: "seat-back",
                type: "box",
                size: { x: 2, y: 15 },
                pos: { z: 0 },
                cat: WC_BARRIER,
                mask: seatMask
            },
            foam: {
                name: "seat-bottom",
                type: "box",
                size: { x: 2, y: 18 },
                pos: { z: 0 },
                cat: WC_BARRIER,
                mask: seatMask
            },
            // seat back
            handlebars: {
                name: "handlebars",
                type: "box",
                size: { x: 2 * 4, y: 16 }, // width
                pos: { z: 0 },
                cat: WC_FRAME,
                mask: GROUND
            },
            wheel: {
                name: "wheel",
                type: "circle",
                size: { r: 12 },
                pos: { z: 0 },
                cat: WC_WHEEL,
                mask: GROUND
            },
            supportWheel: {
                name: "support-wheel",
                type: "circle",
                size: { r: 2.5 },
                pos: { z: 0 },
                cat: WC_WHEEL,
                mask: GROUND
            },
            LBar: {
                name: "L-beam",
                type: "box",
                size: { x: 23, y: 15 }, // for now, seatDepth + 5"
                pos: { z: 0 },
                cat: WC_FRAME,
                mask: GROUND
            },
            footRest: {
                name: "foot-rest",
                type: "box",
                size: { x: 4, y: 7 },
                pos: { z: 0 },
                cat: WC_BARRIER,
                mask: seatMask
            }
        }
    }
});
