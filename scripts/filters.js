angular.module('XivelyApp.filters', ['XivelyApp.services'])

    .filter('temp', function (Settings) {
        return function (input) {
            if (angular.isUndefined(input)) return;
            if (Settings.getTempUnits() == 'f') {
                return Math.round(1.8 * (input - 273) + 32);
            }
            return Math.round(input - 273);
        };
    })

    .filter('hourFormat', function () {
        return function (input) {
            if (angular.isUndefined(input)) return;
            return moment(input).format('HH:mm');
        }
    })

    .filter('weekday', function () {
        return function (input) {
            if (angular.isUndefined(input)) return;
            return moment.unix(input).format('dddd');
        }
    });
