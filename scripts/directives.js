angular.module('XivelyApp.directives', [])

    .constant('WEATHER_ICONS', {
        '01d': 'ion-ios7-sunny-outline',
        '01n': 'ion-ios7-moon-outline',
        '02d': 'ion-ios7-partlysunny-outline',
        '02n': 'ion-ios7-cloudy-night-outline',
        '03d': 'ion-ios7-cloudy-outline',
        '03n': 'ion-ios7-cloudy-outline',
        '04d': 'ion-ios7-cloudy-outline',
        '04n': 'ion-ios7-cloudy-outline',
        '09d': 'ion-ios7-rainy-outline',
        '09n': 'ion-ios7-rainy-outline',
        '10d': 'ion-ios7-rainy-outline',
        '10n': 'ion-ios7-rainy-outline',
        '11d': 'ion-ios7-thunderstorm-outline',
        '11n': 'ion-ios7-thunderstorm-outline',
        '13d': 'ion-ios7-snowy',
        '13n': 'ion-ios7-snowy',
        '50d': 'ion-ios7-drag',
        '50n': 'ion-ios7-drag'

    })

    .directive('weatherIcon', function (WEATHER_ICONS) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                icon: '='
            },
            template: '<i class="icon" ng-class="weatherIcon"></i>',
            link: function ($scope) {

                $scope.$watch('icon', function (v) {
                    if (!v) {
                        return;
                    }

                    var icon = v;

                    if (icon in WEATHER_ICONS) {
                        $scope.weatherIcon = WEATHER_ICONS[icon];
                    } else {
                        $scope.weatherIcon = WEATHER_ICONS['cloudy'];
                    }
                });
            }
        }
    })

    .directive('currentTime', function ($timeout, $filter) {
        return {
            restrict: 'E',
            replace: true,
            template: '<span class="current-time">{{currentTime}}</span>',
            link: function ($scope, $element, $attr) {
                $timeout(function checkTime() {
                    $scope.currentTime = moment().format('HH:mm');
                    $timeout(checkTime, 500);
                });
            }
        }
    })

    .directive('currentWeather', function ($timeout, $rootScope, Settings) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/current-weather.html',
            scope: true,
            compile: function (element, attr) {
                return function ($scope, $element, $attr) {
                    // Delay so we are in the DOM and can calculate sizes

                    $timeout(function () {
                        var windowHeight = window.innerHeight;
                        var thisHeight = $element[0].offsetHeight;
                        //var headerHeight = document.querySelector('#header').offsetHeight;
                        //var padding = document.querySelector('#main-content');
                        $element[0].style.paddingTop = (windowHeight - thisHeight - 25) + 'px';
                        angular.element(document.querySelector('.scroll-content')).css('-webkit-overflow-scrolling', 'auto');
                        $timeout(function () {
                            angular.element(document.querySelector('.scroll-content')).css('-webkit-overflow-scrolling', 'touch');
                        }, 100);
                    });

                }
            }
        }
    })

    .directive('xively', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/xively.html',
            link: function ($scope, $element, $attr) {
            }
        }
    })

    .directive('forecast', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/forecast.html',
            link: function ($scope, $element, $attr) {
            }
        }
    })

    .directive('weatherBox', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                title: '@'
            },
            template: '<div class="weather-box"><h4 class="title">{{title}}</h4><div ng-transclude></div></div>',
            link: function ($scope, $element, $attr) {
            }
        }
    })

    .directive('backgroundCycler', function ($compile, $animate) {
        var animate = function ($scope, $element, newImageUrl) {
            var child = $element.children()[0];

            var scope = $scope.$new();
            scope.url = newImageUrl;
            var img = $compile('<background-image></background-image>')(scope);

            $animate.enter(img, $element, null, function () {
                // console.log('Inserted');
            });
            if (child) {
                $animate.leave(angular.element(child), function () {
                    // console.log('Removed');
                });
            }
        };

        return {
            restrict: 'E',
            link: function ($scope, $element, $attr) {
                $scope.$watch('activeBgImage', function (v) {
                    if (!v) {
                        return;
                    }
                    // console.log('Active bg image changed', v);
                    var item = v;
                    var url = "http://farm" + item.farm + ".static.flickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_z.jpg";
                    animate($scope, $element, url);
                });
            }
        }
    })

    .directive('backgroundImage', function ($compile, $animate) {
        return {
            restrict: 'E',
            template: '<div class="bg-image"></div>',
            replace: true,
            scope: true,
            link: function ($scope, $element, $attr) {
                if ($scope.url) {
                    $element[0].style.backgroundImage = 'url(' + $scope.url + ')';
                }
            }
        }
    })
    .directive('orientationChange', function ($window, $timeout) {
        return {
            restrict: 'A',
            replace: true,
            scope: true,
            compile: function (element, attr) {
                return function ($scope, $element, $attr) {
                    $window.addEventListener("orientationchange", function () {
                        $timeout(function () {
                            var windowHeight = window.innerHeight;
                            var paddingTop = parseInt($element[0].style.paddingTop);
                            var offsetHeight = $element[0].offsetHeight;
                            $element[0].style.paddingTop = (windowHeight - offsetHeight + paddingTop - 25) + 'px';
                            $scope.$broadcast('orientation.changed');
                        }, 10);
                    }, false);
                }
            }
        };
    });

