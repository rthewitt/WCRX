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

                    dispatcher.on('measured:person', function() {
                        $('#btn-cmx').prop('disabled', false);
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

                    var video = $('#video')[0],
                        videoObj = { 'video': true },
                        errCB = function(err) {
                            console.log('Video capture error: ' + err.code);
                        };


                    function hijackCamera() {
                        if(navigator.getUserMedia) {
                            navigator.getUserMedia(videoObj, function(stream) {
                                video.src = stream;
                                video.play();
                            }, errCB);
                        } else if(navigator.webkitGetUserMedia) {
                            navigator.webkitGetUserMedia(videoObj, function(stream) {
                                video.src = window.webkitURL.createObjectURL(stream);
                                video.play();
                            }, errCB);
                        } else if(navigator.mozGetUserMedia) {
                            navigator.mozGetUserMedia(videoObj, function(stream) {
                                window.URL.createObjectURL(stream);
                                video.play();
                            }, errCB);
                        }
                    }

                    var streaming = false;
                    function releaseCamera(ev) {
                        video.pause();
                        streaming = false;
                        $('#video-wrapper').css({ 'display': 'none' }); 
                        $('#src-opts').css({ 'display': 'block' }); 
                    }

                    $('#image-upload').on('change', function(ev) {
                        alert('File access not permitted by HTML.\n\nThis feature will be supported in the packaged application!');
                    });

                    $('#img-source').dialog({ 
                        modal: true,
                        title: "Patient Image",
                        minWidth: 700,
                        minHeight: 480,
                        autoOpen: false,
                        beforeClose: releaseCamera
                    });
                    $('button').button();

                    $('#btn-upload').click(function() {
                        $('#img-source').dialog('open');
                    });

                    $('#vidcap').on('click', function() {
                        if(streaming) {
                            return false; // slim chance
                        }
                        $('#video-wrapper').css({ 'display': 'block' });
                        $('#src-opts').css({ 'display': 'none' });
                        hijackCamera();
                        streaming = true;
                    });
                    
                    $('#btn-snapshot').click(function() {
                        video.pause();
                        streaming = false;
                        dispatcher.trigger('snapshot');
                    });
                    $('#v-cancel').click(function() {
                        $('#img-source').dialog('close');
                    });

                    $('#btn-pmx').addClass('active');

                    $('#btn-reset').click(function() {
                        dispatcher.trigger('reset');
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
