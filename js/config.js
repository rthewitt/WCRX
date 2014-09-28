define(["./scaledPolygons", "backbone"], function(pollyColl, Backbone){

    var GROUND = 1,
        HM_SOLID = 2,
        HM_JOINT = 4,
        WC_WHEEL = 8,
        WC_BARRIER = 16,
        WC_FRAME = 32;

    var seatMask = WC_FRAME | HM_SOLID | HM_JOINT | GROUND;
    var personMask = HM_SOLID | WC_BARRIER | GROUND;
    var armyMask = WC_WHEEL | GROUND;

    var ImageData = Backbone.Model.extend({
        defaults: {
            name: null,
            type: "box",
            massless: false,
            opacity: null,
            size: { x: 0, y: 0 },
            cat: null,
            mask: GROUND
        }
    });

    function getPerson() {
        return {
            shoulderJ: new ImageData({
                name: "shoulder",
                type: "circle",
                size: null,
                pos: { z: 2 },
                cat: HM_JOINT,
                mask: personMask
            }),
            lowerArm: new ImageData({
                name: "lower-arm",
                type: "poly",
                polygons: pollyColl.lowerArm,
                //opacity: 0.8,
                massless: true,
                size: null,
                pos: { z: 7 },
                cat: HM_SOLID,
                mask: armyMask
            }),
            upperArm: new ImageData({
                name: "upper-arm",
                type: "box",
                //opacity: 0.7,
                massless: true,
                size: null,
                pos: { z: 7 },
                cat: HM_SOLID,
                mask: armyMask
            }),
            waist: new ImageData({
                name: "waist",
                type: "poly",
                polygons: pollyColl.waist,
                size: null,
                pos: { z: 1 },
                cat: HM_SOLID,
                mask: personMask
            }),
            midsection: new ImageData({
                name: "midsection",
                type: "circle",
                size: null,
                pos: { z: 0 },
                cat: HM_JOINT,
                mask: personMask
            }),
            chest: new ImageData({
                name: "chest",
                type: "poly",
                polygons: pollyColl.chest,
                size: null,
                pos: { z: 1 },
                cat: HM_SOLID,
                mask: personMask
            }),
            kneeJ: new ImageData({
                name: "knee",
                type: "circle",
                size: null,
                pos: { z: 0 },
                cat: HM_JOINT,
                mask: personMask
            }),
            upperLeg: new ImageData({
                name: "upper-leg",
                type: "poly",
                polygons: pollyColl.upperLeg,
                size: null,
                pos: { z: 3 },
                cat: HM_SOLID,
                mask: personMask
            }),
            lowerLeg: new ImageData({
                name: "lower-leg",
                type: "poly",
                polygons: pollyColl.lowerLeg,
                size: null,
                pos: { z: 2 },
                cat: HM_SOLID,
                mask: personMask
            }),
            foot: new ImageData({
                name: "foot",
                type: "poly",
                polygons: pollyColl.foot,
                size: null,
                pos: { z: 2 },
                cat: HM_SOLID,
                mask: personMask
            })
        }
    }

    function getChair() {
        return {
            seatBack: new ImageData({
                name: "seat-back",
                type: "box",
                size: null,
                pos: { z: 3 },
                cat: WC_BARRIER,
                mask: seatMask
            }),
            foam: new ImageData({
                name: "seat-bottom",
                type: "box",
                size: null,
                pos: { z: 3 },
                cat: WC_BARRIER,
                mask: seatMask
            }),
            handlebars: new ImageData({
                name: "handlebars",
                type: "poly",
                polygons: pollyColl.handlebars,
                size: null,
                pos: { z: 3 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            wheel: new ImageData({
                name: "wheel",
                type: "circle",
                size: null,
                pos: { z: 6 }, 
                cat: WC_WHEEL,
                mask: GROUND
            }),
            supportWheel: new ImageData({
                name: "support-wheel",
                type: "circle",
                size: null,
                pos: { z: 4 },
                cat: WC_WHEEL,
                mask: GROUND
            }),
            frameConnector: new ImageData({
                name: "frame-connector",
                type: "box",
                size: null,
                pos: { z: 5 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            frontConnector: new ImageData({
                name: "support-wheel-connector",
                type: "box",
                size: null,
                pos: { z: 5 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            raiseBar: new ImageData({
                name: "raise-bar",
                type: "box",
                size: null,
                pos: { z: 5 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            LBar: new ImageData({
                name: "L-beam",
                type: "poly",
                polygons: pollyColl.LBar,
                size: null,
                pos: { z: 4 },
                cat: WC_FRAME,
                mask: GROUND
            }),
            footRest: new ImageData({
                name: "foot-rest",
                type: "box",
                size: null,
                pos: { z: 3 },
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
            torsoLength: 25, // 26 total
            contactPoint: 2.0, // seat contact forward
            chestWidth: 16,
            trunkDepth: 9,
            upperLegLength: 22,
            upperLegWidth: 6,
            footLength: 9,
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
            
            var sRad = this.get("upperArmWidth")/2;
            pd.shoulderJ.set("size", { r: sRad }); 

            pd.upperArm.set("size",   
                { x: this.get("upperArmWidth"), y: this.get("upperArmLength") });

            pd.lowerArm.set("size",   
                { x: this.get("lowerArmWidth"), y: this.get("lowerArmLength") });

            pd.waist.set("size",   
                { x: this.get("upperLegWidth"), y: this.get("upperLegWidth") });


            var aboveWaist = this.get("torsoLength") - this.get("upperLegWidth");
            var mh = aboveWaist * (6.8/17), // experimental ratio
                ch = aboveWaist - mh;

            pd.midsection.set("size", 
                { r: mh/2 });

            pd.chest.set("size",   
                { x: this.get("trunkDepth"), y: ch });

            var kRad = this.get("lowerLegWidth")/2; 
            pd.kneeJ.set("size", { r: kRad });

            var footWidth = 4; // TODO ratio or input

            pd.upperLeg.set("size",   
                { x: this.get("upperLegLength") - kRad, y: this.get("upperLegWidth") });

            pd.lowerLeg.set("size",   
                { x: this.get("lowerLegLength") - kRad - footWidth, y: this.get("lowerLegWidth") });

            pd.foot.set("size",
                { x: footWidth, y: this.get("footLength") }); 
        },
        initialize: function() {
            this.resetPerson();
            this.on("change:contactPoint", this.resetPerson);
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
            seatBackWidth: 0.4,
            seatWidth: 15,
            seatBackHeight: 13,
            axleDistance: 3.5,
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
                { x: this.get("seatBackWidth") , y: this.get("seatBackHeight") - this.get("foamHeight") });

            cd.foam.set("size", 
                { x: this.get("seatDepth"), y: this.get("foamHeight") }); // TODO different model width

            var sbh = this.get("seatBackHeight");
            cd.handlebars.set("size",   
                { x: 6 , y: (4/3)*sbh  });
                //{ x: (3/4)*sbh , y: (4/3)*sbh  });

            cd.wheel.set("size", 
                { r: this.get("wheelDiameter") / 2 }); // TODO determine based on frame/handlebars size?

            cd.supportWheel.set("size",
                { r: 2.5 });


            cd.frameConnector.set("size", 
                    { x: 3, y: 6 }); 

            cd.frontConnector.set("size", 
                    { x: 4, y: 7 }); // TODO determine from height differences

            cd.raiseBar.set("size", 
                    { x: 2.25, y: 5 }); 

            // size estimated based on google image search
            cd.LBar.set("size", 
                    { x: 18.5, y: 11 });


            cd.footRest.set("size", { x: 4, y: 6 });
        },
        initialize: function() {
            this.resetChair();
            this.on("change:wheelDiameter", this.resetChair);
            this.on("change:axleDistance", this.resetChair);
            //this.on("change:seatWidth", this.resetChair); // no trigger yet, snapshot is separate funcitonality
            this.on("change:seatBackWidth", this.resetChair);
            this.on("change:seatBackHeight", this.resetChair);
            this.on("change:seatDepth", this.resetChair);
            this.on("change:foamHeight", this.resetChair);
            this.on("change:wheelChair", function() { console.log('changed chair');});
        }
    });


    var conf = {
        showImages: true,
        skeleton: true,
        debug: false,

        //PTM: 190.0, // pixels to "meters"
        PTM: 230.0, // pixels to "meters"
        ITM: 39.3701,

        getChair: getChair,
        ChairMeasures: ChairMeasures,
        HumanMeasures: HumanMeasures,

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

    conf.polyCraft = new ImageData({
                name: "lower-arm",
                type: "poly",
                size: { x: 7, y: 8 },
                pos: { z: 10 },
                cat: HM_SOLID,
                mask: personMask
            });

    return conf;
});
