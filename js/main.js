require.config({
    paths: {
        "jquery": ["http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min", 
                    "libs/jquery/dist/jquery.min"],
        "jqueryui": "libs/jquery-ui/jquery-ui.min",
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
        "jqueryui": {
            deps: ["jquery"],
            exports: "jQuery"
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
        'jquery.customSelect',
        'jqueryui'
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

                // clear swipe gestures
                document.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                });

                $(document).ready(function($) {

                    $('#img-source').dialog({ 
                        autoOpen: false,
                        modal: true,
                        title: "Patient Image"
                    });
                    $('button').button();

                    $('#btn-upload').click(function() {
                        $('#img-source').dialog('open');
                    });

                    dispatcher.on('side:bgimage', function(dims) {
                        $('#slider').slider({
                            min: 0.2,
                            max: 5,
                            value: 1,
                            step: 0.05,
                            slide: function(ev, ui) {
                                sideView.sizeBGImage({
                                    x: dims.x * ui.value,
                                    y: dims.y * ui.value,
                                });
                            }
                        });
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
                        config.showImages = !config.showImages;
                    });
                });
});
