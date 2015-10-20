var MonitorApp = angular.module('MonitorApp', ['toastr','ngSails']);

// monitor HQ
MonitorApp.controller('MonitorHQController', ['$scope', '$sails', '$http', 'toastr', '$window', '$interval', function($scope, $sails, $http, toastr, $window, $interval){
  $scope.monitors = [];
  $http.get('/monitor')
  .then(function onSuccess(sailsResponse){
    $scope.monitors = sailsResponse.data;
  })
  .catch(function onError(sailsResponse){
    toastr.error(sailsResponse.status, 'Error');
  })
  $scope.log = "Listening...\n";

  var HQHandler = $sails.on('monitors', function (message) {
    var extra = '';
    if (message.verb === 'add') {
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.monitor.id);
      // console.log(idx, message);
      if (idx<0) {
        $scope.monitors.push(message.monitor);
      } else {
        $scope.monitors[idx] = message.monitor;
        extra = ' : Idea ' + message.monitor.idea.id;
      }
    }
    else if (message.verb === 'remove') {
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.monitor.id);
      $scope.monitors.splice(idx, 1);
    }
    else if (message.verb === 'refresh') {
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.monitor.id);
      console.log('refresh: ',idx);
      console.log($scope.monitors[idx], message.monitor);
      extra = ' : Idea ' + message.monitor.idea.id;
      $scope.monitors[idx] = message.monitor;
    }
    $scope.log += ('monitor '+message.verb+': '+message.monitor.id) + extra + "\n";
  });

}]);

// single monitor
MonitorApp.controller('MonitorController', ['$scope', '$sails', '$http', 'toastr', '$window', '$interval', function($scope, $sails, $http, toastr, $window, $interval){
  $scope.has_been_liked = false;

  $scope.likeIdea = function() {
    // $http.post('/idea/like/'+$scope.monitor.idea.id);
    $scope.monitor.idea.num_likes += 1;
    $scope.has_been_liked = true;
  }

  $scope.closeLike = function() {
    $scope.has_been_liked = false;
  }

  var refreshHandler = $sails.on('monitors', function (message) {
    if (message.verb === 'refresh' && message.monitor.id==$scope.monitor.id) {
      console.log('monitor refresh sent: '+message.monitor.id);
      $scope.has_been_liked = false;
      setTimeout(function() {
        $scope.monitor = message.monitor;
      }, 500);
    }
  });


  // if (angular.isDefined($scope.refreshTimer)) {
  // }
  // $scope.refreshTimer = $interval(function() {
  //   $http.get('/monitor/refresh/'+$scope.monitor.id)
  //   .success(function(data, status, headers, config) {
  //     // console.log('Fetched data!', data);
  //     $scope.monitor = data;
  //     // console.log($scope.monitor);
  //   });
  // }, 5000);

}]);
