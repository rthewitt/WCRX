define(function(){

  this["JST"] = this["JST"] || {};

  this["JST"]["chair-template"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape, __j = Array.prototype.join;function print() { __p += __j.call(arguments, '') }with (obj) {__p += '<div id="chair-side" class="mxrx">\n    <form>\n        <div class="tmp-internal"><h3>Side Measures</h3></div>\n        <label for="seat-back-height">Seat Back Height</label>\n        <input type="text" id="seat-back-height" name="seatBackHeight" value=\'' +((__t = ( seatBackHeight )) == null ? '' : __t) +'\' tabindex="2"/>\n        <label for="seat-depth">Seat Depth</label>\n        <select id="seat-depth" name="seatDepth" tabindex="3">\n            '; _.each([12, 13, 14, 15, 16, 17, 18, 19], function(num) { ;__p += '\n            <option value="' +((__t = ( num )) == null ? '' : __t) +'" '; if(seatDepth === num) print('selected') ;__p += ' >' +((__t = ( num )) == null ? '' : __t) +'"</option>\n            '; }); ;__p += '\n            <option value="20" disabled >20"</option>\n        </select>\n        <label for="foam-height">Foam Height</label>\n        <select id="foam-height" name="foamHeight" tabindex="4">\n            <option value="0.4" '; if(foamHeight === 0.4) print('selected') ;__p += ' >No Cushion</option>\n            <option value="2" '; if(foamHeight === 2) print('selected') ;__p += ' >2" Cushion</option>\n        </select>\n        <label for="seat-back">Seat Back</label>\n        <select id="seat-back" name="seatBackWidth" tabindex="5">\n            <option value="0.4" '; if(seatBackWidth === 0.4) print('selected') ;__p += ' >No Cushion</option>\n            <option value="2" '; if(seatBackWidth === 2) print('selected') ;__p += ' >2" Cushion</option>\n        </select>\n        <label for="wheel-diameter">Wheel Diameter</label>\n        <select id="wheel-diameter" name="wheelDiameter" tabindex="6">\n            '; _.each([20, 22, 24, 25, 26], function(num) { ;__p += '\n            <option value="' +((__t = ( num )) == null ? '' : __t) +'" '; if(wheelDiameter === num) print('selected') ;__p += ' >' +((__t = ( num )) == null ? '' : __t) +'"</option>\n            '; }); ;__p += '\n        </select>\n        <!-- This is actually COG -->\n        <label for="axle-distance">Axle Distance</label>\n        <select id="axle-distance" name="axleDistance" tabindex="7">\n            <option value="0.0" disabled>0"</option>\n            <option value="0.5" disabled>0.5"</option>\n            '; _.each([1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0], function(num) { ;__p += '\n            <option value="' +((__t = ( num )) == null ? '' : __t) +'" '; if(axleDistance === num) print('selected') ;__p += ' >' +((__t = ( num )) == null ? '' : __t) +'"</option>\n            '; }); ;__p += '\n        </select>\n        <label for="front-wheel-pin">Front Wheel Pin</label>\n        <select id="front-wheel-pin" name="frontWheelPin" tabindex="8">\n            '; _.each([1, 2, 3], function(num) { ;__p += '\n            <option value="' +((__t = ( num )) == null ? '' : __t) +'" '; if(frontWheelPin === num) print('selected') ;__p += ' >' +((__t = ( num )) == null ? '' : __t) +'</option>\n            '; }); ;__p += '\n        </select>\n        <label for="ground-clr">Ground Clearance</label>\n        <input type="text" id="ground-clr" name="groundClr" value=\'' +((__t = ( groundClr )) == null ? '' : __t) +'"\' readonly />\n        <label for="dump">Dump</label>\n        <input type="text" id="dump" name="dump" value=\'' +((__t = ( dump )) == null ? '' : __t) +'"\' readonly />\n    </form>\n</div>\n<div id="chair-front" class="mxrx">\n    <form>\n        <div class="tmp-internal"><h3>Front Measures</h3></div>\n        <label for="seat-width">Seating Surface Width</label>\n        <select id="seat-width" name="seatWidth" tabindex="1">\n            '; _.each([12, 13, 14, 15, 16, 17, 18, 19], function(num) { ;__p += '\n            <option value="' +((__t = ( num )) == null ? '' : __t) +'" '; if(seatWidth === num) print('selected') ;__p += ' >' +((__t = ( num )) == null ? '' : __t) +'"</option>\n            '; }); ;__p += '\n            <option value="20" disabled >20"</option>\n        </select>\n    </form>\n</div>\n';}return __p};

  this["JST"]["human-template"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div id="human-side" class="mxrx">\n    <div class="tmp-internal"><h3>Side Measures</h3></div>\n    <form>\n        <label for="upper-arm-length">Upper Arm Length</label>\n        <input type="text" id="upper-arm-length" name="upperArmLength" value="' +((__t = ( upperArmLength )) == null ? '' : __t) +'" tabindex="3"/>\n        <label for="lower-arm-length">Forearm Length</label>\n        <input type="text" id="lower-arm-length" name="lowerArmLength" value="' +((__t = ( lowerArmLength )) == null ? '' : __t) +'" tabindex="4"/>\n        <label for="torso-length">Torso Length</label>\n        <input type="text" id="torso-length" name="torsoLength" value="' +((__t = ( torsoLength )) == null ? '' : __t) +'" tabindex="5"/>\n        <label for="trunk-depth">Trunk Depth</label>\n        <input type="text" id="trunk-depth" name="trunkDepth" value="' +((__t = ( trunkDepth )) == null ? '' : __t) +'" tabindex="6"/>\n        <label for="contact-point">Forward Contact</label>\n        <input type="text" id="contact-point" name="contactPoint" value="' +((__t = ( contactPoint )) == null ? '' : __t) +'" tabindex="7"/>\n        <label for="thigh-depth">Thigh Depth</label>\n        <input type="text" id="upper-leg-length" name="upperLegLength" value="' +((__t = ( upperLegLength )) == null ? '' : __t) +'" tabindex="8"/>\n        <label for="lower-leg-length">Lower Leg Length</label>\n        <input type="text" id="lower-leg-length" name="lowerLegLength" value="' +((__t = ( lowerLegLength )) == null ? '' : __t) +'" tabindex="9"/>\n    </form>\n</div>\n<div id="human-front" class="mxrx">\n    <div class="tmp-internal"><h3>Front Measures</h3></div>\n    <form>\n        <label for="chest-width">Chest Width</label>\n        <input type="text" id="chest-width" name="chestWidth" value="' +((__t = ( chestWidth )) == null ? '' : __t) +'" tabindex="1"/>\n        <label for="hip-width">Hip Width</label>\n        <input type="text" id="hip-width" name="hipWidth" value="' +((__t = ( hipWidth )) == null ? '' : __t) +'" tabindex="2"/>\n    </form>\n</div>\n';}return __p};

  this["JST"]["summary-template"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape, __j = Array.prototype.join;function print() { __p += __j.call(arguments, '') }with (obj) {__p += '<div id="summary-patient" class="mxrx">\n    <div class="tmp-internal"><h3>Patient</h3></div>\n    <label for="upper-arm-length">Upper Arm Length: <span id="upper-arm-length" class="setting-value" name="upperArmLength">' +((__t = ( person.upperArmLength )) == null ? '' : __t) +'"</span></label>\n    <label for="lower-arm-length">Forearm Length: <span id="lower-arm-length" class="setting-value" name="lowerArmLength">' +((__t = ( person.lowerArmLength )) == null ? '' : __t) +'"</span></label>\n    <label for="torso-length">Torso Length: <span id="torso-length" class="setting-value" name="torsoLength">' +((__t = ( person.torsoLength )) == null ? '' : __t) +'"</span></label>\n    <label for="trunk-depth">Trunk Depth: <span id="trunk-depth" class="setting-value" name="trunkDepth">' +((__t = ( person.trunkDepth )) == null ? '' : __t) +'"</span></label>\n    <label for="contact-point">Forward Contact: <span id="contact-point" class="setting-value" name="contactPoint">' +((__t = ( person.contactPoint )) == null ? '' : __t) +'"</span></label>\n    <label for="thigh-depth">Thigh Depth: <span id="upper-leg-length" class="setting-value" name="upperLegLength">' +((__t = ( person.upperLegLength )) == null ? '' : __t) +'"</span></label>\n    <label for="lower-leg-length">Lower Leg Length: <span id="lower-leg-length" class="setting-value" name="lowerLegLength">' +((__t = ( person.lowerLegLength )) == null ? '' : __t) +'"</span></label>\n    <label for="chest-width">Chest Width: <span id="chest-width" class="setting-value" name="chestWidth">' +((__t = ( person.chestWidth )) == null ? '' : __t) +'"</span></label>\n    <label for="hip-width">Hip Width: <span id="hip-width" class="setting-value" name="hipWidth">' +((__t = ( person.hipWidth )) == null ? '' : __t) +'"</span></label>\n</div>\n<div id="summary-chair" class="mxrx">\n    <div class="tmp-internal"><h3>WheelChair</h3></div>\n    <label for="seat-back-height">Seat Back Height: <span id="="seat-back-height" class="setting-value" name="seatBackHeight">' +((__t = ( chair.seatBackHeight )) == null ? '' : __t) +'"</span></label>\n    <label for="seat-depth">Seat Depth: <span id="seat-depth" class="setting-value" name="seatDepth">' +((__t = ( chair.seatDepth )) == null ? '' : __t) +'"</span></label>\n    <label for="foam-height">Foam Height:\n      '; if(chair.foamHeight === 0.4) { ;__p += '\n      <span id="foam-height" class="setting-value" name="foamHeight">No Cushion</span>\n      '; } else if(chair.foamHeight === 2) { ;__p += '\n        <span id="foam-height" class="setting-value" name="foamHeight">2" Cushion</span>\n      '; } ;__p += '\n    </label>\n    <label for="seat-back">Seat Back:\n      '; if(chair.seatBackWidth === 0.4) { ;__p += '\n        <span id="seat-back" class="setting-value" name="seatBackWidth">No Cushion</span>\n      '; } else if(chair.seatBackWidth === 2) { ;__p += '\n        <span id="seat-back" class="setting-value" name="seatBackWidth">2" Cushion</span>\n      '; } ;__p += '\n    </label>\n    <label for="wheel-diameter">Wheel Diameter: <span id="wheel-diameter" class="setting-value" name="wheelDiameter">' +((__t = ( chair.wheelDiameter )) == null ? '' : __t) +'"</span></label>\n    <!-- This is actually COG -->\n    <label for="axle-distance">Axle Distance: <span id="axle-distance" class="setting-value" name="axleDistance">' +((__t = ( chair.axleDistance )) == null ? '' : __t) +'"</span></label>\n    <label for="front-wheel-pin">Front Wheel Pin: <span id="front-wheel-pin" class="setting-value" name="frontWheelPin">' +((__t = ( chair.frontWheelPin )) == null ? '' : __t) +'</span></label>\n    <label for="ground-clr">Ground Clearance: <span id="ground-clr" class="setting-value" name="groundClr" >' +((__t = ( chair.groundClr )) == null ? '' : __t) +'"</span></label>\n    <label for="dump">Dump: <span id="dump" class="setting-value" name="dump">' +((__t = ( chair.dump )) == null ? '' : __t) +'"</span></label>\n    <label for="seat-width">Seating Surface Width: <span id="seat-width" class="setting-value" name="seatWidth">' +((__t = ( chair.seatWidth )) == null ? '' : __t) +'"</span></label>\n</div>\n';}return __p};

  return this["JST"];

});