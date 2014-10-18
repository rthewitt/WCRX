define(['./scaled-polygons', 'backbone'], function(pollyColl, Backbone){

    var GROUND = 1,
        HM_SOLID = 2,
        HM_JOINT = 4,
        WC_WHEEL = 8,
        WC_BARRIER = 16,
        WC_FRAME = 32;

    var PTM = 310.0, // pixels to 'meters'
        ITM = 39.3701;

    var seatMask = WC_FRAME | HM_SOLID | HM_JOINT | GROUND;
    var personMask = HM_SOLID | WC_BARRIER | GROUND;
    var armyMask = WC_WHEEL | GROUND;


    var personData = {
        head: {
            name: 'head',
            type: 'poly',
            polygons: pollyColl.head,
            massless: true,
            pos: { z: 2 },
            cat: HM_SOLID,
            mask: armyMask
        },
        neck: {
            name: 'neck',
            type: 'box',
            //opacity: 0.8,
            massless: true,
            pos: { z: 0 },
            cat: HM_JOINT,
            mask: personMask
        },
        shoulderJ: {
            name: 'shoulder',
            type: 'circle',
            pos: { z: 2 },
            cat: HM_JOINT,
            mask: personMask
        },
        lowerArm: {
            name: 'lower-arm',
            type: 'poly',
            polygons: pollyColl.lowerArm,
            //opacity: 0.8,
            massless: true,
            pos: { z: 7 },
            cat: HM_SOLID,
            mask: armyMask
        },
        upperArm: {
            name: 'upper-arm',
            type: 'box',
            //opacity: 0.7,
            massless: true,
            pos: { z: 7 },
            cat: HM_SOLID,
            mask: armyMask
        },
        waist: {
            name: 'waist',
            type: 'poly',
            //hidden: true,
            polygons: pollyColl.waist,
            pos: { z: 1 },
            cat: HM_SOLID,
            mask: personMask
        },
        midsection: {
            name: 'midsection',
            type: 'circle',
            pos: { z: 0 },
            cat: HM_JOINT,
            mask: personMask
        },
        chest: {
            name: 'chest',
            type: 'poly',
            polygons: pollyColl.chest,
            pos: { z: 1 },
            cat: HM_SOLID,
            mask: personMask
        },
        kneeJ: {
            name: 'knee',
            type: 'circle',
            pos: { z: 0 },
            cat: HM_JOINT,
            mask: personMask
        },
        upperLeg: {
            name: 'upper-leg',
            type: 'poly',
            polygons: pollyColl.upperLeg,
            pos: { z: 3 },
            cat: HM_SOLID,
            mask: personMask
        },
        lowerLeg: {
            name: 'lower-leg',
            type: 'poly',
            polygons: pollyColl.lowerLeg,
            pos: { z: 2 },
            cat: HM_SOLID,
            mask: personMask
        },
        foot: {
            name: 'foot',
            type: 'poly',
            polygons: pollyColl.foot,
            pos: { z: 2 },
            cat: HM_SOLID,
            mask: personMask
        }
    };

    // TODO merge data
    var personFront = {
        head: {
            name: 'head',
            pos: { z: 0 }
        },
        neck: {
            name: 'neck',
            pos: { z: 0 }
        },
        chest: {
            name: 'chest',
            pos: { z: 0 }
        },
        midsection: {
            name: 'midsection',
            pos: { z: 0 }
        },
        waist: {
            name: 'waist',
            pos: { z: 0 }
        },
        leg: {
            name: 'leg',
            pos: { z: 0 }
        }
    };

    var chairData = {
        seatBack: {
            name: 'seat-back',
            type: 'box',
            pos: { z: 3 },
            cat: WC_BARRIER,
            mask: seatMask
        },
        foam: {
            name: 'seat-bottom',
            type: 'box',
            pos: { z: 3 },
            cat: WC_BARRIER,
            mask: seatMask
        },
        handlebars: {
            name: 'handlebars',
            type: 'poly',
            polygons: pollyColl.handlebars,
            pos: { z: 3 },
            cat: WC_FRAME,
            mask: GROUND
        },
        wheel: {
            name: 'wheel',
            type: 'circle',
            pos: { z: 6 }, 
            cat: WC_WHEEL,
            mask: GROUND
        },
        supportWheel: {
            name: 'support-wheel',
            type: 'circle',
            pos: { z: 4 },
            cat: WC_WHEEL,
            mask: GROUND
        },
        frameConnector: {
            name: 'frame-connector',
            type: 'box',
            pos: { z: 5 },
            cat: WC_FRAME,
            mask: GROUND
        },
        frontConnector: {
            name: 'support-wheel-connector',
            type: 'box',
            pos: { z: 5 },
            cat: WC_FRAME,
            mask: GROUND
        },
        raiseBar: {
            name: 'raise-bar',
            type: 'box',
            pos: { z: 5 },
            cat: WC_FRAME,
            mask: GROUND
        },
        LBar: {
            name: 'L-beam',
            type: 'poly',
            polygons: pollyColl.LBar,
            pos: { z: 4 },
            cat: WC_FRAME,
            mask: GROUND
        },
        footRest: {
            name: 'foot-rest',
            type: 'box',
            pos: { z: 3 },
            cat: WC_FRAME,
            mask: GROUND 
            //cat: WC_BARRIER,
            //mask: seatMask
        }
    }


    var conf = {
        showImages: true,
        skeleton: false,
        debug: false,

        PTM: PTM,
        ITM: ITM,

        imgPathRoot: 'images/v2/',

        chairData: chairData,
        personData: personData,
        personFront: personFront,

        bits: {
            GROUND : 1,
            HM_SOLID : 2,
            HM_JOINT : 4,
            WC_WHEEL : 8,
            WC_BARRIER : 16,
            WC_FRAME : 32
        },

        masks: {
            seat: seatMask,
            person: personMask,
            ground: 0xFFFF
        },

    };

    /* FIXME
    conf.polyCraft = new ImageData({
                name: 'head',
                type: 'poly',
                size: { x: 12, y: 10 },
                pos: { z: 10 },
                cat: HM_SOLID,
                mask: personMask
            });
            */

    return conf;
});
