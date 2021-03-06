define([
    'marionette',
    'main/ADK',
    'app/applets/orders/viewUtils',
], function(Marionette, ADK, ViewUtils) {
    'use strict';

    //========================= BANNER UTILITIES ==========================
    var displayBanner = function(action, orderType, uid, options) {
        var suppressBanner = !!(_.get(options, 'suppressBanner', false));
        if (suppressBanner === false) {
            var message = (_.capitalize(orderType || 'unknown') + ' draft order succesfully ' + action);

            var successBanner = new ADK.UI.Notification({
                title: 'Success',
                message: message,
                type: "success"
            });
            successBanner.show();
        }
    };
    var displayErrorBanner = function(action, orderType, error, options) {
        var suppressBanner = !!(_.get(options, 'suppressBanner', false));
        if (suppressBanner === false) {
            var errorMessage = 'Error ' + action + ' draft order';

            // Report the error to the console to provide debugging info without confusing the user
            console.log(errorMessage + ': ' + error);

            var errorBanner = new ADK.UI.Notification({
                title: 'Error',
                message: errorMessage,
                type: "danger"
            });
            errorBanner.show();
        }
    };

    //========================= DIALOG UTILITIES ==========================
    var getDeleteDraftDialogMessage = function(action) {
        return 'Are you sure you want to delete?';
    };

    var DELETE_DIALOG_DEFAULT_ATTRIBUTES = {
        title: 'Delete',
        confirmButton: 'Yes',
        cancelButton: 'No',
        confirmTitle: 'Press enter to delete',
        cancelTitle: 'Press enter to go back'
    };

    var DELETE_DIALOG_ATTRIBUTES = {
        message: getDeleteDraftDialogMessage('delete'),
        onConfirm: function(options) {
            this.deleteDraft(options);
        }
    };

    var LEAVE_DIALOG_ATTRIBUTES = {
        message: getDeleteDraftDialogMessage('leave'),
        onConfirm: function(options) {
            this.trigger('draft:delete:success', this, {}, options);
        }
    };

    var showDeleteDraftDialog = function(draft, options) {
        var uid = draft.get('uid');
        var dialogAttributes = _.isEmpty(uid) ? LEAVE_DIALOG_ATTRIBUTES : DELETE_DIALOG_ATTRIBUTES;
        var attributes = _.extend({}, DELETE_DIALOG_DEFAULT_ATTRIBUTES, dialogAttributes);

        var deleteDraftOrderDialog = new ViewUtils.DialogBox(attributes);
        deleteDraftOrderDialog.show(draft, options);
    };

    //============================= UTILITIES =============================
    var getSubDomain = function(model) {
        if (_.isUndefined(model)) {
            return 'unknown';
        }
        return model.get('subDomain') || 'unknown';
    };

    var getUid = function(model) {
        if (_.isUndefined(model)) {
            return '';
        }
        return model.get('uid') || '';
    };

    var loadPayload = function() {
        var draft = this.model.get('draft');
        if (_.isUndefined(draft)) {
            return;
        }
        var payload = draft.getPayload();
        this.model.set(payload);
    };

    var executeEventCallback = function(event, options) {
        var callback = _.camelCase('on:' + event);
        _.invoke(this, callback, options);
    };

    var onSuccess = function(event, model, resp, options) {
        var action = 'managed';
        switch (event) {
            case 'draft:create:success':
            case 'draft:update:success':
                action = 'saved';
                break;
            case 'draft:read:success':
                action = 'loaded';
                var isAutoLoadingPayload = !!(_.get(options, 'loadPayload', false));
                if (isAutoLoadingPayload === true) {
                    loadPayload.apply(this);
                }
                break;
            case 'draft:delete:success':
                action = 'deleted';
                break;
            case 'draft:save:success':
                action = 'saved';
                break;
            case 'draft:saveConsult:success':
                action = 'saved';
                break;
            default:
                break;
        }
        executeEventCallback.call(this, event, options);
        this.model.trigger(event, model, resp, options);
        displayBanner(action, getSubDomain(model), getUid(model), options);
    };

    var onError = function(event, model, resp, options) {
        var action = 'involving';
        switch (event) {
            case 'draft:create:error':
            case 'draft:update:error':
                action = 'saving';
                break;
            case 'draft:read:error':
                action = 'loading';
                break;
            case 'draft:delete:error':
                action = 'deleting';
                break;
            case 'draft:save:error':
                action = 'saving';
                break;
            case 'draft:saveConsult:error':
                action = 'saving';
                break;
            default:
                break;
        }
        executeEventCallback.call(this, event, options);
        this.model.trigger(event, model, resp, options);
        var errorMessage = resp;
        if (!_.isString(errorMessage)) {
            errorMessage = (!_.isUndefined(model) ? (model.validationError || model.get('errorMessage')) : 'Server error');
        }
        displayErrorBanner(action, getSubDomain(model), errorMessage, options);
    };

    var onBefore = function(event, model, resp, options) {
        executeEventCallback.call(this, event, options);
        this.model.trigger(event, model, resp, options);
    };

    var baseDraftFunction = function(draftFunction, param) {
        var draft = this.model.get('draft');
        if (_.isUndefined(draft)) {
            return;
        }
        return draftFunction.call(this, draft, param);
    };

    var setUid = function(draft, uid) {
        draft.setUid(uid || '');
    };

    var saveDraft = function(draft, options) {
        var payload = draft.extractPayload(this.model);
        draft.setPayload(payload);
        draft.saveDraft(options);
    };

    var saveConsultDraft = function(draft, options) {
        var payload = draft.extractPayload(this.model);
        draft.setPayload(payload);
        draft.saveConsultDraft(options);
    };

    var loadDraft = function(draft, options) {
        // Instead of loading the draft order immediately, we double-check to make sure we're not waiting for
        // any pre-load events to occur.  The events are transmitted as "change" events on the view model.
        this.loadDraftFunction = _.bind(draft.getDraft, draft, options);
        checkPreloadConditions.apply(this);
    };

    var deleteDraft = function(draft, options) {
            draft.deleteDraft(options);
    };

    var resetDraft = function(draft) {
        draft.resetDraft();
    };

    var getAttribute = function(draft, options) {
        var attribute = _.get(options, 'attribute', '');
        var modelName = _.get(options, 'modelName', ('draft-' + attribute));

        var value = draft.get(attribute);
        if (!_.isUndefined(value)) {
            this.model.set(modelName, value);
        }
    };

    var getData = function(draft, options) {
        options = options || {};
        options.attribute = 'data';
        getAttribute.call(this, draft, options);
    };

    var copyToModel = function(draft, options) {
        var modelName = _.get(options, 'modelName', 'clinicalObject');

        var payload = draft.extractPayload(this.model);
        draft.setPayload(payload);
        draft.populateModel();
        this.model.set(modelName, draft);
    };

    var checkPreloadConditions = function() {
        // Iterate through each of the event matches that need to be set on the model before draft loading can happen.
        // If all the events have happened and we've requested a 'loadDraft', we call the temporarily stored function.
        var eventCheckResults = _.find(this.preloadEvents, function(event) {
            return (_.isUndefined(this.model.get(event)));
        }, this);

        if ((_.isUndefined(eventCheckResults)) && (_.isFunction(this.loadDraftFunction))) {
            this.loadDraftFunction();
            this.loadDraftFunction = null;
        }
    };

    var draftEvents = {
        'draft:create:success': _.partial(onSuccess, 'draft:create:success'),
        'draft:update:success': _.partial(onSuccess, 'draft:update:success'),
        'draft:read:success': _.partial(onSuccess, 'draft:read:success'),
        'draft:delete:success': _.partial(onSuccess, 'draft:delete:success'),
        'draft:save:success': _.partial(onSuccess, 'draft:save:success'),
        'draft:saveConsult:success': _.partial(onSuccess, 'draft:saveConsult:success'),
        'draft:create:error': _.partial(onError, 'draft:create:error'),
        'draft:update:error': _.partial(onError, 'draft:update:error'),
        'draft:read:error': _.partial(onError, 'draft:read:error'),
        'draft:delete:error': _.partial(onError, 'draft:delete:error'),
        'draft:save:error': _.partial(onError, 'draft:save:error'),
        'draft:saveConsult:error': _.partial(onError, 'draft:saveConsult:error'),
        'before:draft:create': _.partial(onBefore, 'before:draft:create'),
        'before:draft:update': _.partial(onBefore, 'before:draft:update'),
        'before:draft:read': _.partial(onBefore, 'before:draft:read'),
        'before:draft:delete': _.partial(onBefore, 'before:draft:delete'),
        'before:draft:save': _.partial(onBefore, 'before:draft:save'),
        'before:draft:saveConsult': _.partial(onBefore, 'before:draft:saveConsult')
    };

    var modelEvents = {
        'draft:setuid': _.partial(baseDraftFunction, setUid),
        'draft:save': _.partial(baseDraftFunction, saveDraft),
        'draft:saveConsult': _.partial(baseDraftFunction, saveConsultDraft),
        'draft:load': _.partial(baseDraftFunction, loadDraft),
        'draft:delete': _.partial(baseDraftFunction, deleteDraft),
        'draft:reset': _.partial(baseDraftFunction, resetDraft),
        'draft:getAttribute': _.partial(baseDraftFunction, getAttribute),
        'draft:getData': _.partial(baseDraftFunction, getData),
        'draft:copyToModel': _.partial(baseDraftFunction, copyToModel)
    };

    //=========================== API FUNCTIONS ===========================
    var initialize = function(options) {
        var draft = new ADK.UIResources.Writeback.Orders.Draft.Model({
            subDomain: options.type || 'laboratory'
        });

        // In this Behavior, the Draft ADK Resource is a 'child' of the main View Model. Behavior API functionality is
        // exposed via event messaging on the 'parent' View Model. To accommodate the relationship, we set-up bindings
        // to allow event flow from the main Model (parent) to the Draft ADK Resource (child)
        this.bindEntityEvents(draft, draftEvents);

        this.model = this.view.options.model;
        this.model.set('draft', draft, {
            silent: true
        });

        // Setup pre-load events (specified in the Behavior options) that need to be fired prior to the form being loaded.
        this.preloadEvents = options.preloadEvents || [];
        _.each(this.preloadEvents, function(event) {
            this.listenTo(this.model, 'change:' + event, _.bind(checkPreloadConditions, this));
        }, this);
    };

    var onRender = function() {
        // Automatically load the draft order if the 'draft-uid' parameter is set on the model prior to rendering.
        var draftUid = this.model.get('draft-uid');
        if (!_.isUndefined(draftUid)) {
            this.model.trigger('draft:setuid', draftUid);
            this.model.trigger('draft:load', {
                loadPayload: this.model.get('draft-load-payload')
            });
            this.model.unset('draft-uid', {
                silent: true
            });
        }
    };

    var onBeforeDestroy = function() {
        this.unbindEntityEvents(this.model.get('draft'), draftEvents);

        // Clear out the pre-load event listeners, if they were configured in the beginning.
        _.each(this.preloadEvents, function(event) {
            this.stopListening(this.model, event);
        }, this);
    };

    var onDestroy = function() {
        this.model.unset('draft', {
            silent: true
        });

        this.preloadEvents = null;
        this.loadDraftFunction = null;
    };

    //============================ PUBLIC API =============================
    var draftBehavior = Marionette.Behavior.extend({
        defaults: {
            type: 'laboratory'
        },
        modelEvents: modelEvents,
        initialize: initialize,
        onRender: onRender,
        onBeforeDestroy: onBeforeDestroy,
        onDestroy: onDestroy
    });

    return draftBehavior;
});
