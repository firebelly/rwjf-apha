var MonitorApp = angular.module('MonitorApp', ['toastr','ngSails']);

MonitorApp.controller('MonitorController', ['$scope', '$sails', '$http', 'toastr', '$window', '$interval', function($scope, $sails, $http, toastr, $window, $interval){

  // if (angular.isDefined($scope.refreshTimer)) {

  // }

  $scope.refreshTimer = $interval(function() {
    $http.get('/monitor/refresh/'+$scope.monitor.id)
    .success(function(data, status, headers, config) {
      // console.log('Fetched data!', data);
      $scope.monitor = data;
      // console.log($scope.monitor);
    });
  }, 5000);

}]);
