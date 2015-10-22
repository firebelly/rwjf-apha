var MonitorApp = angular.module('MonitorApp', ['toastr','ngSails']);
// establish a color on page load
colorPicker();

// pick a random color class for the body
function colorPicker() {
  colorNumber = Math.floor(Math.random() * 6) + 1;
  $('body.monitor-view').attr('data-color', colorNumber);
}

// single monitor
MonitorApp.controller('MonitorController', ['$scope', '$sails', '$http', 'toastr', '$timeout', '$interval', function($scope, $sails, $http, toastr, $timeout, $interval){
  $scope.has_been_liked = false;
  var closeLikeTimer;

  $scope.likeIdea = function() {
    // send like to pause monitor & update num_likes
    $http.post('/monitor/like/'+$scope.monitor.id)
    .then(function onSuccess(sailsResponse){
      $scope.monitor.idea.num_likes += 1;
      $scope.has_been_liked = true;
      // kill closeLikeTimer if it exists
      if (closeLikeTimer) $timeout.cancel(closeLikeTimer);
      closeLikeTimer = $timeout($scope.closeLike, 5000);
    })
    .catch(function onError(sailsResponse){
      toastr.error('Error storing like: '+sailsResponse.status, 'Error');
    });
  }

  $scope.closeLike = function() {
    // unpause the monitor
    $http.post('/monitor/unpause/'+$scope.monitor.id)
    .then(function onSuccess(sailsResponse){
      $scope.has_been_liked = false;
    })
    .catch(function onError(sailsResponse){
      toastr.error('Error unpausing monitor: '+sailsResponse.status, 'Error');
    });
  }

  var refreshHandler = $sails.on('monitors', function (message) {
    if (message.verb === 'refresh' && message.monitor.id==$scope.monitor.id) {
      console.log('monitor refresh sent: '+message.monitor.id);
      $scope.has_been_liked = false;
      $timeout(function() {
        $scope.monitor = message.monitor;
      }, 500);

      colorPicker();
    }
  });

}]);

// monitor HQ
MonitorApp.controller('MonitorHQController', ['$scope', '$sails', '$http', 'toastr', '$timeout', function($scope, $sails, $http, toastr, $timeout){
  $scope.monitors = [];
  $http.get('/monitor')
  .then(function onSuccess(sailsResponse){
    $scope.monitors = sailsResponse.data;
  })
  .catch(function onError(sailsResponse){
    toastr.error(sailsResponse.status, 'Error');
  })
  $scope.log = "Listening...\n";

  $scope.deleteMonitor = function(id) {
    $http.post('/monitor/destroy/'+id)
    .then(function onSuccess(sailsResponse){
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(id);
      $scope.monitors.splice(idx, 1);
    });
  }

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
    $scope.log = ('monitor '+message.verb+': '+message.monitor.id) + extra + "\n" + $scope.log.substr(0,10000);
  });

}]);
