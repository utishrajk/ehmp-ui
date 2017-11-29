define([
    'backbone',
    'marionette'
], function(Backbone, Marionette) {
    'use strict';
    var screenConfig = {
        id: 'activities2-staff-full',
        context: 'staff',
        contentRegionLayout: 'gridOne',
        applets: [{
            id: 'activities2',
            title: 'Activities (Hello World again from fei systems)',
            region: 'center',
            fullScreen: true,
            viewType: 'expanded'
        }],
        locked:{
            filters: false
        },
        patientRequired: false,
        globalDatepicker: false
    };

    return screenConfig;
});
