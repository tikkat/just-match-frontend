angular.module('just.common')
    .directive("scroll", function ($window) {
        return function (scope, element, attrs) {
            angular.element($window).bind("scroll", function () {
                function getDocHeight() {
                    return Math.max(
                        document.body.scrollHeight, document.documentElement.scrollHeight,
                        document.body.offsetHeight, document.documentElement.offsetHeight,
                        document.body.clientHeight, document.documentElement.clientHeight
                    );
                }

                var footerHeight = angular.element("footer").height();
                var windowHeight = window.innerHeight;
                var docHeight = getDocHeight() - footerHeight;
                if ((this.pageYOffset + windowHeight) <= docHeight) {
                    element.addClass('sticky');
                } else {
                    element.removeClass('sticky');
                }
            });
        };
    })
    .factory('httpPostFactory', function ($http) {
        return function (file, data, callback) {
            $http({
                url: file,
                method: "POST",
                data: data,
                headers: {'Content-Type': undefined, enctype: 'multipart/form-data'}
            }).success(function (response) {
                callback(response);
            });
        };
    })
    .factory('MyDate', function () {

        //Constructor
        function MyDate(date) {
            this.date = date;
        }

        MyDate.prototype.setISO8601 = function (string) {
            var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
                "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
                "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
            var d = string.match(new RegExp(regexp));

            var offset = 0;
            var date = new Date(d[1], 0, 1);

            if (d[3]) {
                date.setMonth(d[3] - 1);
            }
            if (d[5]) {
                date.setDate(d[5]);
            }
            if (d[7]) {
                date.setHours(d[7]);
            }
            if (d[8]) {
                date.setMinutes(d[8]);
            }
            if (d[10]) {
                date.setSeconds(d[10]);
            }
            if (d[12]) {
                date.setMilliseconds(Number("0." + d[12]) * 1000);
            }
            if (d[14]) {
                offset = (Number(d[16]) * 60) + Number(d[17]);
                offset *= ((d[15] === '-') ? 1 : -1);
            }

            offset -= date.getTimezoneOffset();
            var time = (Number(date) + (offset * 60 * 1000));
            this.date.setTime(Number(time));
        };

        return MyDate;
    })
    .controller('MainCtrl', ['authService', '$location', 'justFlowService', 'justRoutes', 'i18nService', '$scope', 'Resources', '$filter', 'userService', '$q',
        function (authService, $location, flow, routes, i18nService, $scope, Resources, $filter, userService, $q) {
            var that = this;
            this.showSetting = false;
            that.isCompany = -1;
            this.backStep = -1;

            this.signedIn = function () {
                return authService.isAuthenticated();
            };
            this.signout = function () {
                authService.logout();
                userService.clearUserModel();
                //flow.completed(routes.global.start.url);
                flow.replace(routes.global.start.url);
                this.menu(0);
            };
            this.signin = function () {
                var path = $location.path();
                flow.redirect(routes.user.signin.url, function () {
                    flow.redirect(path);
                    that.getUser();
                });
                this.menu(0);
            };
            this.updateLanguage = function () {
                i18nService.getLanguage().then(function (lang) {
                    that.language = lang;
                });
            };
            i18nService.addLanguageChangeListener(function () {
                that.updateLanguage();
            });

            this.selectLanguage = function (show) {
                //show = 1 : force open
                //show = 0 : force hide
                //show = undefined : toggle
                show = show | !routes.global.isSelectLanguageOpen;
                routes.global.isSelectLanguageOpen = show;
            };
            this.menu = function (show) {
                //show = 1 : force open
                //show = 0 : force hide
                //show = undefined : toggle
                show = show | !routes.global.isMainMenuOpen;
                routes.global.isMainMenuOpen = show;
            };

            this.setProfile = function () {
                $scope.$broadcast('onSignin');
            };

            $scope.$on('onSigninSetmenu', function (event) {
                that.getUser();
                that.setProfile();
            });

            this.getUser = function () {
                if (that.signedIn()) {
                    that.user = userService.userModel();
                    if (that.user.$promise) {
                        that.user.$promise.then(function (response) {
                            var deferd = $q.defer();
                            that.user = response;
                            if (response.data.relationships.company.data !== null) {
                                that.isCompany = 1;
                            } else {
                                that.isCompany = 0;
                            }
                            deferd.resolve(that.user);
                            return deferd.promise;
                        });
                    } else {
                        if (that.user.data.relationships.company.data !== null) {
                            that.isCompany = 1;
                        } else {
                            that.isCompany = 0;
                        }
                    }
                }
            };

            this.historyBack = function () {
                window.history.go(that.backStep);
            };

            this.getUser();

            this.updateLanguage();
        }]
    );
