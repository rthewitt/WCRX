require.config({
    paths: {
        "jquery": ["http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min", 
                    "libs/jquery/dist/jquery.min"],
        "jquery.customSelect": "libs/jquery.customSelect/jquery.customSelect.min",
        "underscore": "libs/underscore/underscore",
        "backbone": "libs/backbone/backbone",
        "box2dweb": "libs/box2dweb/Box2dWeb-2.1.a.3.min",
        "humanTemplate": "templates/human-template.html",
        "chairTemplate": "templates/chair-template.html",
        "armTemplate": "templates/arms-2d.html"
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

require([ 'jquery', 'backbone',
        'models/image-data',
        'models/chair-model',
        'models/person-model',
        'views/side-view',
        'views/front-view',
        'views/chair-measure-view',
        'views/person-measure-view',
        'region-manager',
        './config',
        // discard jquery decorators
        'jquery.customSelect'
        ], function($, Backbone, ImageData, ChairModel, PersonModel, SideView,
            FrontView, ChairControls, PersonControls, RegionManager, config) { 


                var dispatcher = _.clone(Backbone.Events);
                //var cf = getImgData(config.chairFront, 'front');
                var wcModel = new ChairModel({}, { 
                    dispatcher: dispatcher,
                    chairSide: config.chairSide,
                    chairFront: config.chairFront,
                    imgRoot: config.imgPathRoot 
                });

                //var pf = getImgData(config.personFront, 'front');
                var pModel = new PersonModel({}, { 
                    dispatcher: dispatcher,
                    personSide: config.personSide,
                    personFront: config.personFront,
                    imgRoot: config.imgPathRoot 
                });

                var shared = { 
                    dispatcher: dispatcher,
                    personModel: pModel,
                    chairModel: wcModel,
                    height: 500, // canvas
                    width: 450, // canvas
                    conf: config
                };

                var personControls = new PersonControls(shared);
                var chairControls = new ChairControls(shared);
                var sideView = new SideView(shared);
                var frontView = new FrontView(shared);

                RegionManager.show(personControls);
                frontView.render();
                sideView.render();

                $(document).ready(function($) {

                    var bgImg = new Image();
                    //bgImg.src = "http://cdn.londonandpartners.com/l-and-p/assets/business/45356-640x360-london_eye_hero.jpg";
                    bgImg.src = "images/bg.jpg";
                    var bgCv = $('#bg-canvas');
                    bgCv.css({ 'right': '20%', 'z-index': 0 })
                    bgCv[0].width = shared.width;
                    bgCv[0].height = shared.height;
                    var bgCtx = bgCv[0].getContext('2d');

                    var bgX = 0, 
                        bgY = 0, 
                        zX, zY; // zoom

                    function drawBg(x, y, dx, dy) {
                        bgCtx.clearRect(0, 0, bgCtx.canvas.width, bgCtx.canvas.height);
                        bgCtx.drawImage(bgImg, bgX, bgY, dx, dy);
                    }

                    $(bgImg).on('load', function(){ 
                        zX = bgImg.width;
                        zY = bgImg.height;
                        drawBg(0, 0, zX, zY);
                    })

                    $(document).keydown(function(e) {
                        switch(e.keyCode) {
                            case 37: // left
                                bgX -= 5;
                                break;
                            case 38: // up
                                bgY -= 5;
                                break;
                            case 39: // right
                                bgX += 5;
                                break;
                            case 40: // down
                                bgY += 5;
                                break;
                            case 90: // zoom (z)
                                zX += 5;
                                zY += 5;
                                break;
                            case 88: // zoom out (x)
                                zX -= 5;
                                zY -= 5;
                                break;
                        }
                        drawBg(bgX, bgY, zX, zY);
                    });

                    dispatcher.on('measured:person', function() {
                        $('#btn-cmx').prop('disabled', false);
                    });

                    $('#btn-pmx').addClass('active');

                    $('#btn-reset').click(function() {
                        dispatcher.trigger('reset');
                    });
                    $('#btn-snapshot').click(function() {
                        if(!$('#armies').length) {
                            dispatcher.trigger('snapshot');
                        }
                    });
                    $('#btn-pmx').click(function(e) {
                        if($(this).hasClass('active')) return;
                        $('#btn-cmx').removeClass('active');
                        $('#btn-pmx').addClass('active');
                        RegionManager.show(personControls);
                    });
                    $('#btn-cmx').click(function() {
                        $('#btn-pmx').removeClass('active');
                        $('#btn-cmx').addClass('active');
                        RegionManager.show(chairControls);
                    });
                    $('#btn-chair').click(function() {
                        sideView.toggleChair();
                    });
                    $('#btn-person').click(function() {
                        sideView.togglePerson();
                    });
                    $('#btn-skeleton').click(function() {
                        config.skeleton = !config.skeleton;
                    });
                    $('#btn-images').click(function() {
                        config.showImages = !config.showImages;
                    });
                });
});
