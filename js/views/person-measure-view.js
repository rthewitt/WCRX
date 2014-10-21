define(["jquery", "underscore", "backbone", "text!humanTemplate"], function($, _, Backbone, templateH) {

    var PMV = Backbone.View.extend({

        el: "#person-measures",

        events: {
            "change input":"changed",
            "change select":"changed"
        },

        initialize: function(options) {
            this.dispatcher = options.dispatcher;
            this.model = options.personModel;
            _.bindAll(this, "changed");
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
            var ct = _.template(templateH);
            this.$el.html(ct(this.model.attributes));
            this.decorate();
        },

        changed: function(evt) {
            var changed = evt.currentTarget;
            var value = $(evt.currentTarget).val();
            var mx = this.model.set(changed.name, parseFloat(value));
            this.model.resize();
            this.dispatcher.trigger('modified:person');
        },

    });

    return PMV;
});
