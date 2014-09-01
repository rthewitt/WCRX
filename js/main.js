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

define(["require", "backbone", "box2dweb", "./wcrx", "./graphics", "./config"], function(require, Backbone, Box2D, WCRX, graphics, config) {

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
        return { x: x, y: y };
     }




    graphics.init(config);
    var canvases = ['canvas', 'canvas2'];
    var sims = [];
    window.sims = sims; // TODO remove

    canvases.forEach(function(cvs) {
        var cmx = new config.ChairMeasures({ tempId: cvs });
        var hmx = new config.HumanMeasures({ tempId: cvs });

        var wcrx = new WCRX(cmx, hmx); 
        wcrx.init(config);

        var canvas = document.getElementById(cvs);
        var context = canvas.getContext('2d');
        //var canvasPosition = getElementPosition(canvas);

        var draw = graphics.getDraw(context);

        var sim = { 
            wcrx: wcrx,
            context: context,
            draw: graphics.getDraw(context)
        };
        sims.push(sim);

        resetSim(sim);
    });

    var Person = Backbone.Model.extend({
        defaults: config.person,
        initialize: function() {
            this.on("change:lowerLegLength", function(model) {
                var lll = model.get("lowerLegLength");
                console.log('TODO: '+lll);
            });
        }
    });
    var person = new Person;

    var personControls = Backbone.View.extend({
        el: "#humanForm",
        model: sims[0].wcrx.humanMeasures,
        events: {
            "change input":"changed",
            "change select":"changed"
        },
        initialize: function() {
            _.bindAll(this, "changed");
        },
        changed: function(evt) {
            var changed = evt.currentTarget;
            var value = $(evt.currentTarget).val();
            var mx = this.model.set(changed.name, value);
            resetSim(sims[0]);
        }
    });
    new personControls;

    var chairControls = Backbone.View.extend({
        el: "#chairForm",
        model: sims[0].wcrx.chairMeasures,
        events: {
            "change input":"changed",
            "change select":"changed"
        },
        initialize: function() {
            _.bindAll(this, "changed");
        },
        changed: function(evt) {
            var changed = evt.currentTarget;
            var value = $(evt.currentTarget).val();
            var mx = this.model.set(changed.name, value);
            resetSim(sims[0]);
        }
    });
    new chairControls;

    function resetSim(sim) {
        var wcrx = sim.wcrx;
        if(!!wcrx.token) {
            window.clearInterval(wcrx.token);
            delete wcrx.token;
        }
        wcrx.reset();
        graphics.setDebug(wcrx.world, sim.context);
        wcrx.token = window.setInterval(function() {
            wcrx.update(sim.draw);
        }, 1000 / 60);
    }

    function resetAll() { sims.forEach(resetSim); };


    $(document).ready(function($) {
        $(":input").focus(function() {
            $("label[for='" + this.id + "']").addClass("labelfocus");
        }).blur(function() {
            $("label").removeClass("labelfocus");
        });
 


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

       
        function handleMouseMove(e) {
            /*
           mouseX = (e.clientX - canvasPosition.x) / config.PTM;
           mouseY = (e.clientY - canvasPosition.y) / config.PTM;
           console.log('x: '+mouseX + ', y: '+mouseY);
           */
        }
        $("#btn-reset").click(resetAll);
        $('#btn-debug').click(function() {
            config.debug = !config.debug;
        });
        $('#btn-chair').click(function() {
            sims.forEach(function(sim) {
                var wcrx = sim.wcrx;
                if(!wcrx.chairParts.initted) {
                    wcrx.chairMeasures.resetChair();
                    wcrx.initChair();
                } else wcrx.destroyChair();
            });
        });
        $('#btn-person').click(function() {
            sims.forEach(function(sim) {
                var wcrx = sim.wcrx;
                if(!wcrx.humanParts.initted) {
                    wcrx.humanMeasures.resetPerson();
                    wcrx.initPerson();
                } else wcrx.destroyPerson();
            });
        });
        $('#btn-skeleton').click(function() {
            config.skeleton = !config.skeleton;
        });
        $('#btn-images').click(function() {
            config.showImages = !config.showImages;
        });
    });
});
