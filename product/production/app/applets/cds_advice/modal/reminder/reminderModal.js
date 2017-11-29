define([
    'backbone',
    'marionette',
    'underscore',
    'hbs!app/applets/cds_advice/modal/reminder/reminderBodyTpl',
    'app/applets/cds_advice/util',
], function(Backbone, Marionette, _, bodyTpl, Util) {
    'use strict';

    function createBodyView(model) {
        var opts = model ? {
            model: model
        } : null;
        var View = Backbone.Marionette.ItemView.extend({
            template: bodyTpl,
            showDetails: function(model) {
                var AdviceModal = require('app/applets/cds_advice/modal/advice/adviceModal');
                var DefaultModal = require('app/applets/cds_advice/modal/default/defaultModal');

                switch (model.get('type')) {
                    case Util.ADVICE_TYPE.REMINDER:
                        showModal(model);
                        break;

                    case Util.ADVICE_TYPE.ADVICE:
                        AdviceModal.show(model);
                        break;

                    default:
                        DefaultModal.show(model);
                }
            },
            getDetailsModal: function(model) {
                this.showDetails(model);
            }
        });
        return new View(opts);
    }

    function showModal(model) {
        var view = createBodyView(model);
        var modalOptions = {
            title: 'Reminder',
            'nextPreviousCollection': model.collection
        };
        var modal = new ADK.UI.Modal({
            view: view,
            options: modalOptions,
            callbackView: view
        });
        modal.show();
    }

    return {
        /**
         * Shows the Reminder details modal.
         *
         * @param {BackboneJS.Model} model The model object created for the list item.
         */
        show: function (model) {
            ADK.UI.Modal.hide();
            showModal(model);
        }
    };
});