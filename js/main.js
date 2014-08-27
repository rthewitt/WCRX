require.config({
    paths: {
        "jquery": ["http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min", 
                    "libs/jquery/dist/jquery.min"],
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
        }
    },
});

define(["require", "backbone", "box2dweb", "./wcrx", "./app", "./graphics", "./config"], function(require, Backbone, Box2D, wcrx, wApp, graphics, config) {

    console.log('initting wcrx');
    wcrx.init(config);


     function getElementPosition(element) {
        var elem=element, tagname="", x=0, y=0;
       
        while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
           y += elem.offsetTop;
           x += elem.offsetLeft;
           tagname = elem.tagName.toUpperCase();

           if(tagname == "BODY")
              elem=0;

           if(typeof(elem) == "object") {
              if(typeof(elem.offsetParent) == "object")
                 elem = elem.offsetParent;
           }
        }
        return {x: x, y: y};
     }

    var App = Backbone.View.extend({
        initialize: function() {
            // TODO
        }
    });
    new App;

    function resetAll() {
        if(!!window.UPDATE) window.clearInterval(window.UPDATE);
        wApp.reset();
        graphics.setDebug(wApp.world);
        window.UPDATE = window.setInterval(function() {
            wApp.update(graphics.draw);
        }, 1000 / 60);
    };


    $(document).ready(function($) {
        $(":input").focus(function() {
            $("label[for='" + this.id + "']").addClass("labelfocus");
        }).blur(function() {
            $("label").removeClass("labelfocus");
        });
 

        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        graphics.init(config, context, wApp.world);
        resetAll();
         
        var canvasPosition = getElementPosition(canvas);

        document.addEventListener("mousedown", function(e) {
           isMouseDown = true;
           handleMouseMove(e);
           document.addEventListener("mousemove", handleMouseMove, true);
        }, true);
        
        document.addEventListener("mouseup", function() {
           document.removeEventListener("mousemove", handleMouseMove, true);
           isMouseDown = false;
           mouseX = undefined;
           mouseY = undefined;
        }, true);

       
        // TODO after moving all of this out, apply scale (not 30)
        function handleMouseMove(e) {
           mouseX = (e.clientX - canvasPosition.x) / 30;
           mouseY = (e.clientY - canvasPosition.y) / 30;
           console.log('x: '+mouseX + ', y: '+mouseY);
        }
        $("#btn-reset").click(resetAll);
        $('#btn-debug').click(function() {
            if(typeof config === "undefined") config = {};
            config.debug = !config.debug;
        });
        $('#btn-skeleton').click(function() {
            if(typeof config === "undefined") config = {};
            config.skeleton = !config.skeleton;
            resetAll();
        });
        $('#btn-images').click(function() {
            if(typeof config === "undefined") config = {};
            config.showImages = !config.showImages;
            resetAll();
        });

    });
});
