define(["./scaledPolygons", "backbone"], function(pollyColl, Backbone){

    var GROUND = 1,
        HM_TORSO = 2,
        HM_HAND = 4,
        WC_WHEEL = 8,
        WC_BARRIER = 16,
        WC_FRAME = 32;

    var seatMask = WC_FRAME | HM_TORSO | GROUND;
    var personMask = WC_BARRIER | GROUND;

    var ImageData = Backbone.Model.extend({
        defaults: {
            name: null,
            type: "box",
            opacity: null,
            size: { x: 0, y: 0 },
            cat: null,
            mask: GROUND
        }
    });

    function getPerson() {
        return {
            lowerArm: new ImageData({
                name: "lower-arm",
                type: "box",
                opacity: 0.8,
                size: null,
                pos: { z: 6 },
                cat: HM_TORSO,
                mask: personMask
            }),
            upperArm: new ImageData({
                name: "upper-arm",
                type: "box",
                opacity: 0.7,
                size: null,
                pos: { z: 6 },
                cat: HM_TORSO,
                mask: personMask
            }),
            torso: new ImageData({
                name: "torso",
                type: "poly",
                polygons: pollyColl.torso,
                size: null,
                pos: { z: 0 },
                cat: HM_TORSO,
                mask: personMask
            }),
            upperLeg: new ImageData({
                name: "upper-leg",
                type: "poly",
                polygons: pollyColl.upperLeg,
                size: null,
                pos: { z: 2 },
                cat: HM_TORSO,
                mask: personMask
            }),
            lowerLeg: new ImageData({
                name: "lower-leg",
                type: "poly",
                polygons: pollyColl.lowerLeg,
                size: null,
                pos: { z: 1 },
                cat: HM_TORSO,
                mask: personMask
            })
        }
    }

    function getChair() {
        return {
            // we'll infer this from seatback height + X"
            seatBack: new ImageData({
                name: "seat-back",
                type: "box",
                size: null,
                pos: { z: 2 },
                cat: WC_BARRIER,
                mask: seatMask
            }),
            foam: new ImageData({
                name: "seat-bottom",
                type: "box",
                size: null,
                pos: { z: 2 },
                cat: WC_BARRIER,
                mask: seatMask
            }),
            // seat back
            handlebars: new ImageData({
                name: "handlebars",
                type: "box",
                size: null,
                pos: { z: 2 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            wheel: new ImageData({
                name: "wheel",
                type: "circle",
                size: null,
                pos: { z: 5 }, 
                cat: WC_WHEEL,
                mask: GROUND
            }),
            supportWheel: new ImageData({
                name: "support-wheel",
                type: "circle",
                size: null,
                pos: { z: 3 },
                cat: WC_WHEEL,
                mask: GROUND
            }),
            frameConnector: new ImageData({
                name: "frame-connector",
                type: "box",
                size: null,
                pos: { z: 4 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            frontConnector: new ImageData({
                name: "support-wheel-connector",
                type: "box",
                size: null,
                pos: { z: 4 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            raiseBar: new ImageData({
                name: "raise-bar",
                type: "box",
                size: null,
                pos: { z: 4 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            LBar: new ImageData({
                name: "L-beam",
                type: "poly",
                polygons: pollyColl.LBar,
                size: null,
                pos: { z: 3 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            footRest: new ImageData({
                name: "foot-rest",
                type: "box",
                size: null,
                pos: { z: 2 },
                cat: WC_FRAME,
                mask: GROUND 
                //cat: WC_BARRIER,
                //mask: seatMask
            })
        }
    }

    var HumanMeasures = Backbone.Model.extend({
        defaults: {
            lowerArmLength: 11,
            lowerArmWidth: 4,
            upperArmLength: 11,
            upperArmWidth: 4.5,
            torsoLength: 22,
            trunkDepth: 9,
            upperLegLength: 22,
            upperLegWidth: 7,
            lowerLegLength: 20,
            lowerLegWidth: 5
        },
        resetPerson: function() {
            this.unset('person');
            this.set('person', getPerson());
            this.resize();
        },
        resize: function() {
            var pd = this.get("person");

            pd.upperArm.set("size",   
                { x: this.get("upperArmWidth") * 1.25, y: this.get("upperArmLength") });

            pd.lowerArm.set("size",   
                { x: this.get("lowerArmWidth"), y: this.get("lowerArmLength") });

            pd.torso.set("size",   
                { x: this.get("trunkDepth"), y: this.get("torsoLength") * 1.48 });

            pd.upperLeg.set("size",   
                { x: this.get("upperLegLength"), y: this.get("upperLegWidth") });

            pd.lowerLeg.set("size",   
                { x: this.get("lowerLegLength"), y: this.get("lowerLegWidth") * 2 });
        },
        initialize: function() {
            this.resetPerson();
            this.on("change:lowerArmLength", this.resetPerson);
            this.on("change:lowerArmWidth", this.resetPerson),
            this.on("change:upperArmLength", this.resetPerson),
            this.on("change:upperArmWidth", this.resetPerson),
            this.on("change:torsoLength", this.resetPerson),
            this.on("change:trunkDepth", this.resetPerson),
            this.on("change:upperLegLength", this.resetPerson),
            this.on("change:upperLegWidth", this.resetPerson),
            this.on("change:lowerLegLength", this.resetPerson),
            this.on("change:lowerLegWidth", this.resetPerson)
        }
    });

    var ChairMeasures = Backbone.Model.extend({
        defaults: {
            wheelDiameter: 24,
            seatBackWidth: 2,
            seatBackHeight: 8,
            seatDepth: 13,
            foamHeight: 2
        },
        resetChair: function() {
            this.unset('wheelChair');
            this.set('wheelChair', getChair());
            this.resize();
        },
        resize: function() {
            var cd = this.get("wheelChair");
            cd.seatBack.set("size",   
                { x: this.get("seatBackWidth"), y: this.get("seatBackHeight") });

            cd.foam.set("size", 
                { x: this.get("seatDepth"), y: this.get("foamHeight") }); // TODO different model width

            cd.handlebars.set("size",   
                { x: 1.5 * 4, y: this.get("seatBackHeight") + 5 });

            cd.wheel.set("size", 
                { r: this.get("wheelDiameter") / 2 }); // TODO determine based on frame/handlebars size?

            cd.supportWheel.set("size",
                { r: 2.5 });


            cd.frameConnector.set("size", 
                    { x: 4, y: 6 }); 

            cd.seatBack.set("size", 
                    { x: 2 , y: 8 });

            cd.frontConnector.set("size", 
                    { x: 4, y: 7 }); // TODO determine from height differences

            cd.raiseBar.set("size", 
                    { x: 3, y: 7 }); // x=seatDepth + 5", y=? TODO determine from height differences 

            cd.LBar.set("size", 
                    { x: 10 + this.get("seatDepth"), y: 13 });

            cd.footRest.set("size", { x: 4, y: 6 });
        },
        initialize: function() {
            this.resetChair();
            this.on("change:wheelDiameter", this.resetChair);
            this.on("change:seatBackWidth", this.resetChair);
            this.on("change:seatBackHeight", this.resetChair);
            this.on("change:seatDepth", this.resetChair);
            this.on("change:foamHeight", this.resetChair);
            this.on("change:wheelChair", function() { console.log('changed chair');});
        }
    });




    /*
    var WheelChair = Backbone.Model.extend({
        defaults: conf.chair,
        initialize: function() {
        },
    });
    */
    
    var conf = {
        showImages: true,
        skeleton: true,
        debug: false,

        groundCat: GROUND,
        groundMask: 0xFFFF,

        PTM: 190.0, // pixels to "meters"
        ITM: 39.3701,

        getChair: getChair,
        ChairMeasures: ChairMeasures,
        HumanMeasures: HumanMeasures
    };

    return conf;
});
