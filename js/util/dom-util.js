define(['../config'], function(config) {

    // functions that may be needed for multiple views
    return { 
        getElementPos: function (element) {
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
        },
        inchesToPixels: function(inches) {
            return inches * config.PTM / config.ITM
        },
        inchesToMeters: function(numInches) {
            return numInches / config.ITM;
        },
        pixesToMeters: function(numPixels) {
            return numPixels / config.ITM;
        }
    };

});
