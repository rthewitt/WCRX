define(["jquery", "underscore", "backbone", "text!chairTemplate"], function($, _, Backbone, templateC) {

    var CMV = Backbone.View.extend({

        el: '#chair-measures',

        events: {
            "change input":"changed",
            "change select":"changed"
        },

        initialize: function(options) {
            this.dispatcher = options.dispatcher;
            this.model = options.chairModel;
            _.bindAll(this, "changed");
            this.model.resize(); 
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

        close: function() {
            this.$el.empty();
            this.unbind();
        },

        render: function() {
            var ct = _.template(templateC);
            this.$el.html(ct(this.model.attributes));
            this.decorate();
        },

        changed: function(evt) {
            var changed = evt.currentTarget;
            var value = $(evt.currentTarget).val();
            var mx = this.model.set(changed.name, parseFloat(value));
            this.model.resize();
            this.dispatcher.trigger('modified:chair');
        },

    });

    return CMV;
});
