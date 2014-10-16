require.config({
    paths: {
        "jquery": ["http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min", 
                    "libs/jquery/dist/jquery.min"],
        "jquery.customSelect": "libs/jquery.customSelect/jquery.customSelect.min",
        "underscore": "libs/underscore/underscore",
        "backbone": "libs/backbone/backbone",
        "box2dweb": "libs/box2dweb/Box2dWeb-2.1.a.3.min",
        "humanTemplate": "../templates/human-template.html",
        "chairTemplate": "../templates/chair-template.html"
    },
    shim: {
        "box2dweb": {
            exports: "Box2D"
        },
        "backbone": {
            deps: ["jquery", "underscore"],
            exports: "Backbone"
        },
        "jquery.customSelect": {
            deps: ["jquery"]
        }
    },
});

define([ 
            "jquery",
            "backbone",
            "box2dweb",
            "models/image-data",
            "models/chair-model",
            "models/person-model",
            "views/side-view",
            "views/front-view",
            "views/chair-measure-view",
            "views/person-measure-view",
            "./config",
            // discard jquery decorators
            "jquery.customSelect"
        ], function($, Backbone, Box2D, ImageData, ChairModel, PersonModel, SideView, FrontView, ChairControls, PersonControls, config) {




    var dispatcher = _.clone(Backbone.Events);

    function getImgData(defs, relPath) {
        var imgPath = config.imgPathRoot;
        if(relPath) imgPath += relPath+'/';

        var ret = {};
        for(var pd in defs) {
            var part = defs[pd];
            part.img = new Image();
            part.img.src = imgPath + part.name + '.svg';
            ret[pd] = new ImageData(part);
        }
        return ret;
    }


    var cs = getImgData(config.chairData);
//    var cf = getImgData(config.chairFront, 'front');
    var wcModel = new ChairModel({ wheelChair: cs }, { dispatcher: dispatcher });

    var ps = getImgData(config.personData);
    var pf = getImgData(config.personFront, 'front');
    var pModel = new PersonModel({ person: ps, front: pf }, { dispatcher: dispatcher });



    var RegionManager = (function(Backbone, $) {
        var currentView;
        var region = {};

        var closeView = function(view) {
            if(view && view.close) {
                console.log('closing');
                view.close();
            }
        };

        var openView = function(view) {
            view.render();
            if(view.onShow) {
                view.onShow();
            }
        };

        region.show = function(view) {
            closeView(currentView);
            currentView = view;
            openView(currentView);
        };

        return region;
    })(Backbone, $);


    var shared = { 
        dispatcher: dispatcher,
        personModel: pModel,
        chairModel: wcModel,
        conf: config
    };

    var personControls = new PersonControls(shared);

    var chairControls = new ChairControls(shared);

    RegionManager.show(chairControls);

    shared.height = 500;
    //shared.width = 450;
    shared.width = 850;

    var sideView = new SideView(shared);
    sideView.render();
    var frontView = new FrontView(shared);

    dispatcher.on('modified:chair', function() {
        console.log('recieved chair event...')
        personControls.resize();
        sideView.reset();
    });

    dispatcher.on('modified:person', function() {
        console.log('recieved person event...')
        chairControls.resize();
        sideView.reset();
    });

    $(document).ready(function($) {

        /*
        sim.canvasPos = getElementPosition(sim.canvas);

        isMouseDown = false;

        $(":input").focus(function() {
            $("label[for='" + this.id + "']").addClass("labelfocus");
        }).blur(function() {
            $("label").removeClass("labelfocus");
        });
 


        $('#canvas').mousedown(function() {
           isMouseDown = true;
        });
        


        $('#btn-reset').click(sim.resetSim);
        */
        $('#btn-pmx').click(function() {
            RegionManager.show(personControls);
        });
        $('#btn-cmx').click(function() {
            RegionManager.show(chairControls);
        });
        /*
        $('#btn-snapshot').click(function() {
            if($('#armies').length) return;

            window.clearInterval(sim.physics.token);
            delete sim.physics.token;
            var variables = sim.physics.snapshot();

            var W = variables[0],
                H = variables[1],
                F = variables[2],
                U = variables[3],
                L = variables[4],
                sPos = variables[5], // temp
                sRad = variables[6], // temp
                wPos = variables[7]; // temp

            var Sy = Math.round(sPos.y * config.PTM + sim.canvasPos.y);
            var Sx = Math.round(sPos.x * config.PTM + sim.canvasPos.x - sRad);

            var K = Math.sqrt(Math.pow(F, 2) + Math.pow(H, 2));
            var D = Math.sqrt(Math.pow(K, 2) + Math.pow(W, 2));

            console.log('W = ' + W);
            console.log('H = ' + H);
            console.log('F = ' + F);
            console.log('U = ' + U);
            console.log('L = ' + L);
            console.log('point to point distance: '+D);

            var angle_fRot = Math.atan(H/F);
            var angle_bRot = Math.atan(F/H);
            var z = Math.atan(K/W);
            
            // law of cosines
            var a = angle_u_d = Math.acos((-Math.pow(L, 2) + 
                    Math.pow(U, 2) + Math.pow(D, 2)) / (2 * U * D))

            var c = angle_elbow = Math.acos((-Math.pow(D, 2) + 
                        Math.pow(U, 2) + Math.pow(L, 2)) / (2 * U * L))

            var gamma = z - a;
            var alpha = upperIntoAngle = Math.PI/2 - gamma;
            var beta = lowerIntoAngle = Math.PI - alpha - c;
            var Q = U * Math.cos(gamma);
            var P = perspective = Q - W; // how far elbow juts out of wheel plane
            var E = Q * Math.atan(gamma);
            
            var uHeight = U * config.PTM / config.ITM,
                uWidth = sim.physics.humanMeasures.get('upperArmWidth') * config.PTM / config.ITM;

            var lHeight = L * config.PTM / config.ITM,
                lWidth = sim.physics.humanMeasures.get('lowerArmWidth') * config.PTM / config.ITM;

            var uPersp = W * config.PTM / config.ITM;
            $('body').append('<div id="armies" style="position:absolute; top: '+Sy+'; left: '+Sx+';">'+
                    '<img id="skew-upper" style="perspective: '+uPersp+'px;" height="'+uHeight+'" width="'+uWidth+'" src="images/v2/upper-arm.svg" class="skewed" />'+
                    '<img id="skew-lower" style="perspective: 0px" class="skewed" height="'+lHeight+'" width="'+lWidth+'" src="images/v2/lower-arm.svg" />'+
                    '</div>');

            $('#skew-upper').css({ 'transform-origin': '50% 0%' });
            $('#skew-upper').css('transform', 'rotateY(-'+Math.atan(W/F)+'rad) rotateZ('+(alpha)+'rad)');

            var elbowY = Math.floor(E * config.PTM / config.ITM);
            $('#skew-lower').css({ 'transform-origin': '50% 0%', top: elbowY });
            $('#skew-lower').css('transform', 'rotateZ('+ -beta +'rad)');
        });

        $('#btn-chair').click(function() {
            var physics = sim.physics;
            if(!physics.chairParts.initted) {
                physics.chairMeasures.resetChair();
                physics.initChair();
            } else physics.destroyChair();
        });
        $('#btn-person').click(function() {
            var physics = sim.physics;
            if(!physics.humanParts.initted) {
                physics.humanMeasures.resetPerson();
                physics.initPerson();
            } else physics.destroyPerson();
        });
        $('#btn-skeleton').click(function() {
            config.skeleton = !config.skeleton;
        });
        $('#btn-images').click(function() {
            config.showImages = !config.showImages;
        });


        */
    });
});
