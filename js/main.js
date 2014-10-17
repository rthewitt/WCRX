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

                var dispatcher = _.clone(Backbone.Events);
                var cs = getImgData(config.chairData);
                //var cf = getImgData(config.chairFront, 'front');
                var wcModel = new ChairModel({ wheelChair: cs }, { dispatcher: dispatcher });

                var ps = getImgData(config.personData);
                var pf = getImgData(config.personFront, 'front');
                var pModel = new PersonModel({ person: ps, front: pf }, { dispatcher: dispatcher });

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

                RegionManager.show(chairControls);
                sideView.render();


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

                    $('#btn-reset').click(function() {
                        personControls.resize();
                        chairControls.resize();
                        dispatcher.trigger('reset');
                    });
                    $('#btn-snapshot').click(function() {
                        if(!$('#armies').length) {
                            dispatcher.trigger('snapshot');
                        }
                    });
                    $('#btn-pmx').click(function() {
                        RegionManager.show(personControls);
                    });
                    $('#btn-cmx').click(function() {
                        RegionManager.show(chairControls);
                    });
                    $('#btn-chair').click(function() {
                        if(sideView.hasChair()) {
                            chairControls.resize();
                        }
                        sideView.toggleChair();
                    });
                    $('#btn-person').click(function() {
                        if(sideView.hasPerson()) {
                            personControls.resize();
                        }
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
