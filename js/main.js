require.config({
    paths: {
        "jquery": ["http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min", 
                    "libs/jquery/dist/jquery.min"],
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
        "jquery.customSelect": {
            deps: ["jquery"]
        }
    },
});


// jquery extensions act as decorators and are thus discarded
define(["jquery", "backbone", "box2dweb", "./wcrx", "./graphics", "./config", "jquery.customSelect"], function($, Backbone, Box2D, WCRX, graphics, config) {

    $('select').each(function(i, el) { $(el).customSelect(); });

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
    var canvases = ['canvas'];
    var sims = [];

    canvases.forEach(function(cvs) {
        var cmx = new config.ChairMeasures({ tempId: cvs });
        var hmx = new config.HumanMeasures({ tempId: cvs });

        var wcrx = new WCRX(cmx, hmx); 
        wcrx.init(config);

        var canvas = document.getElementById(cvs);
        var context = canvas.getContext('2d');
       

        var draw = graphics.getDraw(context);

        var sim = { 
            wcrx: wcrx,
            context: context,
            canvasPos: getElementPosition(canvas),
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
        //wcrx.token = window.setTimeout(function() {
            wcrx.update(sim.draw);
        }, 1000 / 60);
    }

    function resetAll() { sims.forEach(resetSim); };


    $(document).ready(function($) {

        isMouseDown = false;

        $(":input").focus(function() {
            $("label[for='" + this.id + "']").addClass("labelfocus");
        }).blur(function() {
            $("label").removeClass("labelfocus");
        });
 


        $('#canvas').mousedown(function() {
           isMouseDown = true;
        });
        
        $('#canvas').mouseup(function() {
           if(sims[0].mouseJoint) {
               sims[0].wcrx.world.DestroyJoint(sims[0].mouseJoint);
               sims[0].mouseJoint = undefined;
               var seatSlide = sims[0].wcrx.humanParts.joints.seatSlide;
               if(seatSlide && !seatSlide.IsMotorEnabled()) {
                   console.log('restoring bond');
                   seatSlide.EnableMotor(true);
                   seatSlide.SetMaxMotorForce(500);
                   seatSlide.SetMotorSpeed(0.0);
               }
           }
           isMouseDown = false;
        });

        $('#canvas').mousemove(function(e) {
           var sim = sims[0];
           mouseX = (e.clientX - sim.canvasPos.x) / config.PTM;
           mouseY = (e.clientY - sim.canvasPos.y) / config.PTM;
           console.log('x: '+mouseX + ', y: '+mouseY);
           //console.log('box2d x: '+ (e.clientX/config.PTM)+ ', box2d y: '+(e.clientY/config.PTM));

           var p = new Box2D.Common.Math.b2Vec2(mouseX, mouseY); // verify
           var body = sim.wcrx.getBodyAtPos(p);
           if(isMouseDown && !sim.mouseJoint) {
               if(body) {
                    if(body === sim.wcrx.humanPartBodies.upperLeg) {
                        var seatRev = sim.wcrx.humanParts.joints.seatRev;
                        var seatSlide = sim.wcrx.humanParts.joints.seatSlide;
                        console.log('breaking bond...');
                        if(seatRev) {
                            sim.wcrx.world.DestroyJoint(sim.wcrx.humanParts.joints.seatRev);
                            sim.wcrx.humanParts.joints.seatRev = undefined;
                        }
                        if(seatSlide && seatSlide.IsMotorEnabled()) {
                            console.log('turning off motor');
                            seatSlide.EnableMotor(false);
                        }
                    }
                    var def = new Box2D.Dynamics.Joints.b2MouseJointDef();
                    
                    def.bodyA = sim.wcrx.ground;
                    def.bodyB = body;
                    def.target = p;

                    def.collideConnected = true;
                    def.maxForce = 100 * body.GetMass();
                    def.dampingRatio = 0;

                    sim.mouseJoint = sim.wcrx.world.CreateJoint(def);
                    body.SetAwake(true);
                }
            }
            if(sim.mouseJoint) sim.mouseJoint.SetTarget(p);
        });


        $("#btn-reset").click(resetAll);
        $('#btn-snapshot').click(function() {
            window.clearInterval(sims[0].wcrx.token);
            delete sims[0].wcrx.token;
            var variables = sims[0].wcrx.snapshot();

            var W = variables[0],
                H = variables[1],
                F = variables[2],
                U = variables[3],
                L = variables[4],
                sPos = variables[5], // temp
                sRad = variables[6], // temp
                wPos = variables[7]; // temp

            var Sy = Math.round(sPos.y * config.PTM + sims[0].canvasPos.y);
            var Sx = Math.round(sPos.x * config.PTM + sims[0].canvasPos.x - sRad);

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
            var P = perspective = Q - W; // how far elbow just out of wheel plane
            var E = Q * Math.atan(gamma);
            
            var uHeight = U * config.PTM / config.ITM,
                uWidth = sims[0].wcrx.humanMeasures.get('upperArmWidth') * config.PTM / config.ITM;

            var lHeight = L * config.PTM / config.ITM,
                lWidth = sims[0].wcrx.humanMeasures.get('lowerArmWidth') * config.PTM / config.ITM;

            var uPersp = W * config.PTM / config.ITM;
            $('body').append('<div style="position:absolute; top: '+Sy+'; left: '+Sx+';">'+
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
