define([
    'moment',
    'app/applets/orders/writeback/common/requiredFields/requiredFieldsUtils',
    'app/applets/orders/writeback/requests/responseFormFields',
    'app/applets/orders/writeback/requests/responseFormUtils',
    'app/applets/orders/writeback/common/assignmentType/assignmentTypeUtils',
    'app/applets/orders/viewUtils',
    'app/applets/task_forms/activities/requests/responseEventHandler'
], function(moment, RequiredFieldsUtils, FormFields, FormUtils, AssignmentTypeUtils, ViewUtils, EventHandler) {
    'use strict';

    var DATE_FORMAT = 'MM/DD/YYYY';
    var DATE_TIME_FORMAT = DATE_FORMAT + ' HH:mm';

    var ACTIVE_STATE = 'active';
    var PENDING_RESPONSE_SUBSTATE = 'Pending Response';

    var formView = ADK.UI.Form.extend({
        fields: FormFields,
        basicRequiredFields: ['action'],
        events: {
            'response-confirm-cancel-button': 'fireCancel',
            'click #responseAcceptButton': 'fireAccept',
            'click #activityDetails': 'fireDetail'
        },
        modelEvents: {
            'change:assignment': 'changeAssignment',
            'change:facility': 'handleFacilityChange',
            'change:team': 'handleTeamChange',
            'change:roles': 'adjustAcceptButtonProperties',
            'change:action': 'changeAction'
        },
        ui: {
            'assignmentField': '.assignment',
            'assignmentContainer': '.assignment-row',
            'requestDetailsField': '.requestDetails',
            'facilityField': '.facility',
            'personField': '.person',
            'teamField': '.team',
            'rolesField': '.roles',
            'facilityContainer': '.facility-row',
            'personContainer': '.person-row',
            'teamContainer': '.team-row',
            'rolesContainer': '.roles-row',
            'commentField': '.comment',
            'commentContainer': '.comment-row',
            'requestField': '.request',
            'requestContainer': '.request-row',
            'cancelButton': '#responseCancelButton',
            'acceptButton': '#responseAcceptButton'
        },
        data: {},
        onRender: function() {
            if (_.isEmpty(this.model.get('assignment'))) {
                this.model.set('assignment', 'opt_person');
            }
            var requests = this.model.get("data").requests;
            this.model.set('displayName', requests[requests.length - 1].title);

            this.data = this.model.get('data');
            this.taskId = this.model.get('taskId');
            this.taskStatus = this.model.get('taskStatus');
            RequiredFieldsUtils.requireFields(this);
            this.setupRequestedByText();
            this.setupSubState();
            this.setupDates();
            this.copyRequestDetails();
            this.adjustAcceptButtonProperties();

            this.adjustButtonProperties();
            this.listenTo(this.model, 'change', this.adjustButtonProperties);

            this.listenTo(this.model, 'change.inputted', function(e) {
                if (e && e.changed) {
                    if (e.changed.request !== undefined) {
                        this.handleRequestInput(e);
                    }
                    if (e.changed.comment !== undefined) {
                        this.handleCommentInput(e);
                    }
                }
            });
            this.listenToOnce(this.model, 'change.inputted', this.registerChecks);
        },
        onDestroy: function() {
            this.unregisterChecks();
            this.$el.trigger('tray.loaderHide');
        },
        registerChecks: function() {
            var checkOptions = {
                id: 'request-activity-writeback-in-progress',
                label: 'Response',
                failureMessage: 'Response Writeback Workflow In Progress! Any unsaved changes will be lost if you continue.',
                onContinue: _.bind(function(model) {
                    this.workflow.close();
                }, this)
            };
            ADK.Checks.register([
                new ADK.Navigation.PatientContextCheck(checkOptions),
                new ADK.Checks.predefined.VisitContextCheck(checkOptions)
            ]);
        },
        unregisterChecks: function() {
            ADK.Checks.unregister({
                id: 'request-activity-writeback-in-progress'
            });
        },
        adjustAcceptButtonProperties: function() {
            RequiredFieldsUtils.makeButtonDependOnRequiredFields(this, this.ui.acceptButton);
        },
        //This is called from assignmentContainer
        adjustButtonProperties: function() {
            this.adjustAcceptButtonProperties();
            // this.adjustDraftButtonProperties();
            // this.adjustAcceptButtonProperties();
        },
        copyRequestDetails: function() {
            var newRequestDetails = '';
            if (this.data && _.isObject(this.data) && _.isArray(this.data.requests) && (this.data.requests.length > 0) && _.isObject(this.data.requests[this.data.requests.length - 1]) && (this.data.requests[this.data.requests.length - 1].request !== ' ')) {
                newRequestDetails = this.data.requests[this.data.requests.length - 1].request;
            }
            this.model.set('requestDetails', newRequestDetails);
        },
        setupRequestedByText: function() {
            var requestorName = this.data.requests[this.data.requests.length - 1].submittedByName || '';

            var requestDateTime;
            if (this.data.requests[this.data.requests.length - 1].submittedTimeStamp) {
                requestDateTime = moment(this.data.requests[this.data.requests.length - 1].submittedTimeStamp).format(DATE_TIME_FORMAT);
            }

            var requestorInformation = requestorName;
            if (requestDateTime) {
                requestorInformation = requestorInformation + ' on ' + requestDateTime;
            }
            this.model.set('requestorInformation', requestorInformation);

            if (this.data.requests[this.data.requests.length - 1].visit && this.data.requests[this.data.requests.length - 1].visit.location) {
                var requestorLocationUid = this.data.requests[0].visit.location;
                var requestorSiteCode = requestorLocationUid.split(':')[3];

                var facilities = new ADK.UIResources.Picklist.Team_Management.Facilities();

                this.listenToOnce(facilities, 'read:success', function(collection, response) {
                    if (response && response.data && _.isArray(response.data) && (response.data.length === 1) && response.data[0] && response.data[0].vistaName) {
                        this.model.set('requestorLocation', response.data[0].vistaName);
                    }
                });

                facilities.fetch({
                    siteCode: requestorSiteCode
                });
            }
        },
        behaviors: {
            Tooltip: {
                placement: 'bottom'
            }
        },
        setupSubState: function() {
            if (this.model.get('ehmpState') === ACTIVE_STATE) {
                this.model.set('subState', PENDING_RESPONSE_SUBSTATE);
            }
        },
        setupDates: function() {
            this.model.set('earliestDateText', moment.utc(this.data.requests[this.data.requests.length - 1].earliestDate, "YYYYMMDDHHmmSS").local().format(DATE_FORMAT));
            this.model.set('latestDateText', moment.utc(this.data.requests[this.data.requests.length - 1].latestDate, "YYYYMMDDHHmmSS").local().format(DATE_FORMAT));
        },
        changeAction: function() {
            this.model.unset('comment');
            this.model.unset('request');

            this.ui.commentContainer.trigger('control:hidden', true);
            this.ui.requestContainer.trigger('control:hidden', true);
            this.ui.assignmentContainer.trigger('control:hidden', true);

            this.ui.commentField.trigger('control:hidden', true);
            this.ui.requestField.trigger('control:hidden', true);
            this.ui.assignmentField.trigger('control:required', false);

            this.ui.commentField.trigger('control:required', false);
            this.ui.requestField.trigger('control:required', false);
            this.ui.assignmentField.trigger('control:required', false);


            var action = this.model.get('action');
            if (action === EventHandler.REQUEST_COMPLETE) {
                RequiredFieldsUtils.requireFields(this);

                this.ui.commentContainer.trigger('control:hidden', false);
                this.ui.commentField.trigger('control:hidden', false);
            } else if (action === EventHandler.REQUEST_CLARIFICATION) {
                this.ui.requestField.trigger('control:required', true);

                RequiredFieldsUtils.requireFields(this, 'request');

                this.ui.requestContainer.trigger('control:hidden', false);
                this.ui.requestField.trigger('control:hidden', false);
            } else if (action === EventHandler.REQUEST_DECLINE) {
                this.ui.commentField.trigger('control:required', true);

                RequiredFieldsUtils.requireFields(this, 'comment');

                this.ui.commentContainer.trigger('control:hidden', false);
                this.ui.commentField.trigger('control:hidden', false);
            } else if (action === EventHandler.REQUEST_REASSIGN) {
                this.ui.assignmentField.trigger('control:required', true);
                this.ui.commentField.trigger('control:required', true);

                RequiredFieldsUtils.requireFields(this, 'assignment');
                RequiredFieldsUtils.requireFields(this, 'comment');

                this.ui.assignmentContainer.trigger('control:hidden', false);
                this.ui.assignmentField.trigger('control:hidden', false);
                this.ui.commentContainer.trigger('control:hidden', false);
                this.ui.commentField.trigger('control:hidden', false);
            }

            this.adjustAcceptButtonProperties();
        },
        handleRequestInput: function(e) {
            if (e && e.changed && (e.changed.request !== undefined)) {
                this.model.set('request', e.changed.request, {
                    silent: true
                });

                //We updated the model in silent mode, so we need to manually trigger the listeners we actually want to 'hear' our update.
                this.adjustAcceptButtonProperties();
                this.registerChecks();
            }
        },
        handleCommentInput: function(e) {
            if (e && e.changed && (e.changed.comment !== undefined)) {
                this.model.set('comment', e.changed.comment, {
                    silent: true
                });

                //We updated the model in silent mode, so we need to manually trigger the listeners we actually want to 'hear' our update.
                this.adjustAcceptButtonProperties();
                this.registerChecks();
            }
        },
        fireCancel: function(e) {
            this.workflow.close();
        },
        fireAccept: function(e) {
            if (RequiredFieldsUtils.validateRequiredFields(this)) {
                EventHandler.handleResponseAction(e, this.model, 'accepted', this.model.get('action'), this.data);
            }
        },
        fireDetail: function(e) {
            ADK.Messaging.getChannel('task_forms').request('activity_detail', {
                processId: this.model.get('data').activity.processInstanceId
            });
        },
        changeAssignment: function() {
            AssignmentTypeUtils.changeAssignment(this);
        },
        handleFacilityChange: function() {
            AssignmentTypeUtils.handleFacilityChange(this);
        },
        handleTeamChange: function() {
            AssignmentTypeUtils.handleTeamChange(this);
            this.adjustAcceptButtonProperties();
        },
    });

    return formView;
});