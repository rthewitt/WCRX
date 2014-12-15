define(["jquery", "underscore", "backbone", "../templates"], function($, _, Backbone, precompiled) {

    var templateS = precompiled['summary-template'];

    var SummaryView = Backbone.View.extend({

        el: '#summary',

        // TODO make a composite model
        initialize: function(options) {
            this.context = {
                chair: options.chairModel.attributes,
                person: options.personModel.attributes
            };
        },

        render: function() {
            //var ct = _.template(templateC);
            var st = templateS;
            this.$el.html(st(this.context));
        },

        close: function() {
            this.$el.empty();
            this.unbind();
        }
    });

    return SummaryView;
});
