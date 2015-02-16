require.config({
    paths: {
        // chrome app will fail on this and use fallback
        "jquery": ["http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min", 
                    "libs/jquery/dist/jquery.min"],
        "jqueryui": "libs/jquery-ui/jquery-ui.min",
        "jquery.customSelect": "libs/jquery.customSelect/jquery.customSelect.min",
        "underscore": "libs/underscore/underscore",
        "backbone": "libs/backbone/backbone",
        "box2dweb": "libs/box2dweb/Box2dWeb-2.1.a.3.min"
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
        'views/summary',
        'region-manager',
        './config',
        // discard jquery decorators
        'jquery.customSelect',
        'jqueryui'
        ], function($, Backbone, ImageData, ChairModel, PersonModel, SideView,
            FrontView, ChairControls, PersonControls, Summary, RegionManager, config) { 


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
                var summary = new Summary(shared);
                var sideView = new SideView(shared);
                var frontView = new FrontView(shared);

                RegionManager.show(personControls);

                // clear swipe gestures
                document.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                });

                $(document).ready(function($) {

                    // hack on load race condition
                    setTimeout(function() {
                        frontView.render();
                    }, 1000);
                    sideView.render();

                    dispatcher.on('flow:clear', function() {
                        $('#btn-cmx').removeClass('blocked');
                        $('#btn-rx').removeClass('blocked');
                    });

                    dispatcher.on('side:bgimage', function(dims) {
                        $('#slider').slider({
                            min: 0.2,
                            max: 2,
                            value: 1,
                            step: 0.005,
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

                    $('.btn-exit').click(function() { window.close(); });

                    $('#img-file').click(function() {
                        $('#img-source').dialog('close');
                        chrome.fileSystem.chooseEntry({ type: 'openFile' }, function(entry) {
                            var reader = new FileReader();
                            reader.onerror = function(e) {
                                console.log('error reading file');
                            };
                            reader.onloadend = function() {
                                var isImg = /image/.test(this.result);
                                if(isImg) dispatcher.trigger('snapshot', { fromFile: true, src: this.result });
                                else console.log('Must load image: ' + this.result);
                            };
                            entry.file(function(file) {
                                reader.readAsDataURL(file);
                            });
                        });
                    });

                    $('#image-upload').on('change', function(ev) {
                        dispatcher.trigger('snapshot', { fromFile: true });
                    });

                    $('#cmx-confirm').dialog({ 
                        modal: true,
                        title: "Are you sure?",
                        autoOpen: false
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
                        setTimeout(function() {
                            video.play();
                        }, 500);
                    });
                    $('#v-keep').click(function() {
                        $('#img-source').dialog('close');
                    });
                    $('#v-cancel').click(function() {
                        sideView.clearBg(true);
                        var $slider = $('#slider');
                        if($slider.find('span').length > 0) {
                            $slider.slider('destroy');
                        }
                        $('#img-source').dialog('close');
                    });

                    $('#btn-pmx').addClass('active');

                    $('#btn-reset').click(function() {
                        dispatcher.trigger('reset');
                    });
                    // TODO change these specific removals to query against active instead
                    $('#btn-pmx').click(function(e) {
                        if($(this).hasClass('active')) return;
                        $('#btn-cmx').removeClass('active');
                        $('#btn-rx').removeClass('active');
                        $('#btn-pmx').addClass('active');
                        RegionManager.show(personControls);
                    });

                    function confirmPerson(origBtn) {
                        $('#cmx-confirm').dialog('option', 'buttons', [{ 
                            text: "Cancel", click: function() {
                                $(this).dialog('close');
                            }
                        }, { 
                            text: "Continue", click: function() {
                                dispatcher.trigger('flow:clear');
                                $(this).dialog('close');
                                $(origBtn).click();
                            } 
                        }]);
                        $('#cmx-confirm').dialog('open');
                    }

                    $('#btn-cmx').click(function(e) {
                        if($(this).hasClass('blocked')) {
                            confirmPerson(this);
                            e.stopPropagation();
                            e.preventDefault();
                            return;
                        } else if($(this).hasClass('active')) return;
                        $('#btn-pmx').removeClass('active');
                        $('#btn-rx').removeClass('active');
                        $('#btn-cmx').addClass('active');
                        RegionManager.show(chairControls);
                    });
                    $('#btn-rx').click(function(e) {
                        if($(this).hasClass('blocked')) {
                            confirmPerson(this);
                            e.stopPropagation();
                            e.preventDefault();
                            return;
                        } else if($(this).hasClass('active')) return;
                        $('#btn-cmx').removeClass('active');
                        $('#btn-pmx').removeClass('active');
                        $('#btn-rx').addClass('active');
                        RegionManager.show(summary);
                    });
                    $('#btn-print').click(function() {
                        window.print();
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
