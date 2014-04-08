angular.module('XivelyApp', ['dx', 'ionic', 'ngAnimate', 'XivelyApp.services', 'XivelyApp.filters', 'XivelyApp.directives'])

    .config(function ($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('intro', {
                url: '/',
                templateUrl: 'intro.html',
                controller: 'IntroCtrl'
            })
            .state('main', {
                url: '/main',
                templateUrl: 'main.html',
                controller: 'WeatherCtrl'
            });

        $urlRouterProvider.otherwise("/");

    })

    .filter('int', function () {
        return function (v) {
            return parseInt(v) || '';
        };
    })

    .filter('orderObjectBy', function () {
        return function (items, field, reverse) {
            var filtered = [];
            angular.forEach(items, function (item) {
                filtered.push(item);
            });
            filtered.sort(function (a, b) {
                return a[field].localeCompare(b[field]);
            });
            filtered.sort();
            if (reverse) filtered.reverse();
            return filtered;
        };
    })

    .controller('IntroCtrl', function ($scope, $state, Settings, $animate, $ionicSlideBoxDelegate) {
        // Called to navigate to the main app
        $scope.startApp = function () {
            $state.go('main');
            Settings.set('skipIntro', true);
        };
        $scope.next = function () {
            $ionicSlideBoxDelegate.next();
        };
        $scope.previous = function () {
            $ionicSlideBoxDelegate.previous();
        };

        // Called each time the slide changes
        $scope.slideChanged = function (index) {
            $scope.slideIndex = index;
        };

        if (Settings.get('skipIntro'))
            $state.go('main');

    })

    .controller('WeatherCtrl', function ($window, $scope, $timeout, $state, $ionicPlatform, $ionicScrollDelegate, $ionicNavBarDelegate, $ionicLoading, $ionicSlideBoxDelegate, $rootScope, Settings, xively, Weather, Geo, Flickr, $ionicModal, focus) {
        var _this = this;

        ionic.Platform.ready(function () {
            // Hide the status bar
            if (ionic.Platform.isIOS())
                StatusBar.hide();
        });

        $scope.timescale = [
            {value: 300, interval: 0, text: '5 minutes', type: 'Raw datapoints'},
            {value: 1800, interval: 0, text: '30 minutes', type: 'Raw datapoints'},
            {value: 3600, interval: 0, text: '1 hours', type: 'Raw datapoints'},
            {value: 21600, interval: 300, text: '6 hours', type: 'Averaged datapoints'},
            {value: 86400, interval: 300, text: '1 day', type: 'Averaged datapoints'},
            {value: 604800, interval: 10800, text: '7 days', type: 'Averaged datapoints'},
            {value: 2592000, interval: 86400, text: '1 month', type: 'Averaged datapoints'},
            {value: 7776000, interval: 86400, text: '3 months', type: 'Averaged datapoints'}
        ];

        /* get graf time scale form settings */
        var ts = xively.getTimeScale();
        $scope.timeScale = _.find($scope.timescale, { 'value': ts.value });


        $scope.activeBgImageIndex = 0;
        $rootScope.currentDataStream = {};
        $rootScope.activeStream = {};

        $scope.gaugeScale = {};
        $scope.gaugeRange = {};
        $scope.gaugeValue = null;
        $scope.gaugeSubvalues = [];
        $scope.viewXively = false;

        $scope.gaugeSettings =
        {
            subvalues: $scope.gaugeSubvalues,
            scale: $scope.gaugeScale,
            rangeContainer: $scope.gaugeRange,
            tooltip: { enabled: true },
            value: $scope.gaugeValue,
            subvalueIndicator: {
                offset: -10 }
        };

        $scope.chartLabel =
        {
            argumentType: 'datetime',
            label: { format: 'H:mm', color: 'white'},
            valueMarginsEnabled: false,
            tick: {
                visible: true
            }
        };

        $scope.chartData = [];

        $scope.chartSettings =
        {
            dataSource: $scope.chartData,
            argumentAxis: $scope.chartLabel,
            valueAxis: {
                valueMarginsEnabled: false,
                tick: {
                    visible: true
                },
                type: 'continuous',
                valueType: 'numeric',
                tickInterval: 0.5,
                grid: {visible: false},
                //min: 0,
                label: {visible: true, color: 'white'}
            },
            series: [
                {
                    argumentField: 'at',
                    valueField: 'value',
                    type: 'line',
                    point: { visible: false },
                    style: { opacity: 0.70 },
                    color: 'rgba(255,255,255,0.9)',
                    hoverStyle: { color: 'rgb(74, 135, 238)' }
                }
            ],
            legend: {
                visible: false
            },
            tooltip: {
                enabled: true
            },
            crosshair: {
                enabled: true,
                horizontalLine: {
                    color: 'white',
                    dashStyle: 'longDash'
                },
                verticalLine: {
                    color: 'white',
                    dashStyle: 'dotdashdot'
                },
                opacity: 0.8
            }
            /*
             loadingIndicator: {
             text: "Loading Xively data ...",
             backgroundColor: ""
             }
             */
        };

        $scope.toggleView = function () {
            $scope.viewXively = !$scope.viewXively;
            $ionicScrollDelegate.$getByHandle('details').scrollBottom();
        };

        $scope.selectAction = function (time) {
            $scope.timeScale = _.find($scope.timescale, { 'value': time.value });
            xively.setTimeScale($scope.timeScale);
            $scope.loadXively = true;
        };

        $scope.showSettings = function () {
            if (!$scope.settingsModal) {
                // Load the modal from the given template URL
                $ionicModal.fromTemplateUrl('settings.html', function (modal) {
                    $scope.settingsModal = modal;
                    $scope.settingsModal.show();
                }, {
                    // The animation we want to use for the modal entrance
                    animation: 'slide-in-up'
                });
            } else {
                $scope.settingsModal.show();
            }
        };

        $scope.showData = function (stream) {
            if (!(angular.isUndefined($rootScope.activeStream) || $rootScope.activeStream === null) && $rootScope.activeStream.id == $rootScope.datastreams[stream].id) {
                $rootScope.activeStream = null;
                $scope.chartData = null;
            }
            else {
                //$("#chartContainer").dxChart('instance').showLoadingIndicator();
                $scope.loadXively = true;
                xively.get(stream);
                $rootScope.activeStream = $rootScope.datastreams[stream];
            }

            $ionicScrollDelegate.$getByHandle('details').scrollBottom();
        };

        $scope.showValueCtrl = function (stream) {
            $rootScope.datastreams[stream].isSelecting = true;
            $rootScope.datastreams[stream].newValue = $rootScope.datastreams[stream].current_value;
            focus('input-time');
        };

        $scope.setValueCtrl = function (stream) {
            $rootScope.datastreams[stream].isSelecting = false;
            $rootScope.datastreams[stream].current_value = $rootScope.datastreams[stream].newValue;
            xively.publish(stream, $rootScope.datastreams[stream].current_value);
        };

        $scope.closeValueCtrl = function (stream) {
            $rootScope.datastreams[stream].isSelecting = false;
            $rootScope.datastreams[stream].newValue = $rootScope.datastreams[stream].current_value;
        };

        $scope.toggleCtrlSwitch = function (stream) {
            xively.publish(stream, $rootScope.datastreams[stream].current_value);
        };

        $rootScope.$watchCollection('currentDataStream.data', function (data) {
            if (angular.isDefined(data) && data.length > 0 && $rootScope.activeStream != null) {

                if ($scope.timeScale.value <= 86400)
                    $scope.chartLabel.label = { format: 'H:mm', color: 'white'};
                else if ($scope.timeScale.value <= 604800)
                    $scope.chartLabel.label = { format: 'ddd', color: 'white'};
                else if ($scope.timeScale.value <= 2592000)
                    $scope.chartLabel.label = { format: 'dd-MM', color: 'white'};
                else
                    $scope.chartLabel.label = { format: 'MMM', color: 'white'};
                $scope.chartData = data;
                $scope.chartSettings.dataSource = $scope.chartData;
                _this.updateGauge($rootScope.activeStream, data[data.length - 1].value);

            }
            else {
                $scope.chartData = [];
                $scope.gaugeValue = null;
                $scope.chartSettings.dataSource = $scope.chartData;
                $scope.gaugeSettings.value = $scope.gaugeValue;
            }
            $scope.loadXively = false;
            $ionicScrollDelegate.$getByHandle('details').scrollBottom();
            $ionicSlideBoxDelegate.$getByHandle('charts').update();
        });

        this.updateGauge = function (stream, newValue) {
            $scope.gaugeScale =
            {
                startValue: stream.minDomain, endValue: stream.maxDomain,
                majorTick: { tickInterval: 5 },
                minorTick: {
                    visible: true,
                    tickInterval: 1
                },
                label: {
                    customizeText: function (arg) {
                        return arg.valueText;
                    }
                },
                valueType: "numeric"
            };

            $scope.gaugeRange =
            {
                ranges: [
                    { startValue: stream.minDomain, endValue: stream.minCritical, color: '#0077BE'},
                    { startValue: stream.minCritical, endValue: stream.maxCritical, color: '#E6E200'},
                    { startValue: stream.maxCritical, endValue: stream.maxDomain, color: '#77DD77'}
                ],
                offset: 5
            };

            $scope.gaugeValue = newValue;

            if (stream.min_value && stream.max_value) {
                $scope.gaugeSubvalues = [stream.min_value, stream.max_value];
                $scope.gaugeSettings.subvalues = $scope.gaugeSubvalues;
            }

            $scope.gaugeSettings.scale = $scope.gaugeScale;
            $scope.gaugeSettings.rangeContainer = $scope.gaugeRange;
            $scope.gaugeSettings.value = $scope.gaugeValue;
        };

        /*
         $scope.$on('orientation.changed', function () {
         $ionicScrollDelegate.scrollBottom(true);
         });
         */
        this.getBackgroundImage = function (lat, lng, locString) {
            Flickr.search(locString, lat, lng).then(function (resp) {
                var photos = resp.photos;
                if (photos.photo.length) {
                    $scope.bgImages = photos.photo;
                    _this.cycleBgImages();
                }
            }, function (error) {
                console.error('Unable to get Flickr images', error);
            });
        };

        this.getForecast = function (lat, lng) {
            Weather.getForecast(lat, lng).then(function (resp) {
                $scope.forecast = resp.list;
            }, function (error) {
                alert('Unable to get forecast. Try again later');
                console.error(error);
            });

            Weather.getHourly(lat, lng).then(function (resp) {
                $scope.hourly = resp.list;
            }, function (error) {
                alert('Unable to get forecast. Try again later.');
                console.error(error);
            });
        };

        this.getCurrent = function (lat, lng) {

            Weather.getAtLocation(lat, lng).then(function (resp) {
                $scope.current = resp;
                _this.getForecast(resp.coord.lat, resp.coord.lon);


            }, function (error) {
                alert('Unable to get current conditions');
                console.error(error);
            });
        };

        this.cycleBgImages = function () {
            $timeout(function cycle() {
                if ($scope.bgImages && (Settings.get('useFlickr'))) {
                    $scope.activeBgImage = $scope.bgImages[$scope.activeBgImageIndex++ % $scope.bgImages.length];
                }
                $timeout(cycle, 120000);
            });
        };

        $scope.refreshData = function (init) {

            if (init) {
                $scope.loading = $ionicLoading.show({
                    content: 'Finding  location... <i class="icon ion-loading-c">',
                    showBackdrop: true,
                    animation: 'fade-in'
                });
            }

            xively.refresh(init).then(function (location) {
                if (location) {

                    _this.getCurrent(location.lat, location.lon);
                    Geo.reverseGeocode(location.lat, location.lon).then(function (locString) {
                        $scope.currentCity = locString;
                        if (Settings.get('useFlickr'))
                            _this.getBackgroundImage(location.lat, location.lon, locString);
                        else
                            $scope.activeBgImage = null;

                        $rootScope.$broadcast('scroll.refreshComplete');
                        $scope.loading.hide();
                    });
                } else
                    Geo.getLocation().then(function (position) {
                        var lat = position.coords.latitude;
                        var lng = position.coords.longitude;

                        _this.getCurrent(lat, lng);

                        Geo.reverseGeocode(lat, lng).then(function (locString) {
                            $scope.currentCity = locString;
                            if (Settings.get('useFlickr'))
                                _this.getBackgroundImage(lat, lng, locString);
                            else
                                $scope.activeBgImage = null;

                        });
                        $rootScope.$broadcast('scroll.refreshComplete');
                        $scope.loading.hide();

                    }, function (error) {
                        alert('Unable to get current location: ' + error);
                        $rootScope.$broadcast('scroll.refreshComplete');
                        $scope.loading.hide();
                    });
            });

        };

        $scope.refreshData(true);

    }).
    controller('SettingsCtrl', function ($scope, $state, Settings, scandit) {
        var _this = this;

        $scope.settings = Settings.getSettings();

        // Watch deeply for settings changes, and save them
        // if necessary
        $scope.$watch('settings', function () {
            Settings.save();
        }, true);

        $scope.closeSettings = function () {
            $scope.modal.hide();
        };
        $scope.intro = function () {
            Settings.set('skipIntro', false);
            $state.go('intro');
        };

        $scope.$on('$destroy', function () {
            $scope.modal.remove();
        });

        _this.success = function (resultArray) {
            $scope.settings.deviceId = resultArray[0];
        };

        _this.failure = function (error) {
            // alert("Failed: " + error);
        };

        $scope.scan = function () {
            scandit.scan(_this.success, _this.failure);
        };

    });
