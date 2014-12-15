define(["jquery", "underscore", "backbone", "../templates"], function($, _, Backbone, precompiled) {

    var templateH = precompiled['human-template'];

    var PMV = Backbone.View.extend({

        el: "#person-measures",

        events: {
            "change input":"changed",
            "blur input":"blurred"
        },

        initialize: function(options) {
            this.dispatcher = options.dispatcher;
            this.model = options.personModel;
            this.modified = false;
            _.bindAll(this, "changed");
            _.bindAll(this, "blurred");
            _.bindAll(this, "clearUnset");

            this.listenTo(options.dispatcher, 'flow:clear', this.clearUnset);

            this.model.resize();
        },
        
        close: function() {
            this.$el.empty();
            this.unbind();
        },

        decorate: function() {
            this.$('select').each(function(i, elem) { 
                $(elem).customSelect(); 
            });

            var self = this;
            this.$(":input").focus(function() {
                self.$("label[for='" + this.id + "']").addClass("labelfocus");
            }).blur(function() {
                self.$("label").removeClass("labelfocus");
            });
        },

        render: function() {
            //var ct = _.template(templateH);
            var ht = templateH;
            this.$el.html(ht(this.model.attributes));
            if(!this.modified) {
                this.$('input').addClass('unset');
                this.$('select').addClass('unset');
                this.modified = true;
            }
            this.decorate();
        },

        clearUnset: function() {
            this.$('input.unset').removeClass('unset');
        },

        blurred: function(evt) {
            // do not require measure change 
            // default may be accurate
            var visited = evt.currentTarget;
            $(visited).removeClass('unset');
            if(this.$('input.unset').length === 0) {
                // tell application that we can progress
                this.dispatcher.trigger('flow:clear');
            }
        },

        changed: function(evt) {
            var changed = evt.currentTarget;
            var value = $(changed).val();
            var mx = this.model.set(changed.name, parseFloat(value));
            this.model.resize();
            this.dispatcher.trigger('modified:person');
        },

    });

    return PMV;
});
