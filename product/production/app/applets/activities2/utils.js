define([
    'moment'
], function(moment) {
    'use strict';

    return {
        parseResponse: function(response) {
        	console.log('creating a response...');
            response.createdAtName = response.createdatid;
            response.assignedFacilityName = response.assignedtofacilityid;
            response.name = response.instancename;
            response.domain = response.domain;
            response.createdByName = response.createdbyname;
            response.mode = response.mode;
            response.taskState = response.taskstate;
            response.intendedFor = response.intendedfor;
            response.createdOn = response.createdon;
            response.patientName = response.patientname;
            response.patientSsnLastFour = response.patientssnlastfour;
            response.isSensitivePatient = response.issensitivepatient;
            response.status = response.status;
            response.createdAtId = response.createdatid;
            response.processId = response.processid;
            response.assignedToFacilityId = response.assignedtofacilityid;
            response.pid = response.pid;
            response.isActivityHealthy = response.isactivityhealthy;
            response.activityHealthDescription = response.activityhealthdescription;
        }
    };
});