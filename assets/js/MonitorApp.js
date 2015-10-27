var MonitorApp = angular.module('MonitorApp', ['toastr','ngSails']);

// quickie array shuffle
var shuffleArray = function(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

// single monitor
MonitorApp.controller('MonitorController', ['$scope', '$sails', 'toastr', '$timeout', '$interval', function($scope, $sails, toastr, $timeout, $interval){
  var closeLikeTimer;
  var colorSchemeArr = shuffleArray([1,2,3,4,5,6]);

  $scope.hasBeenLiked = false;
  $scope.transitioning = false;
  $scope.colorSchemeIndex = colorSchemeArr.pop();
 
  $scope.likeIdea = function() {
    // send like to pause monitor & update num_likes
    $sails.post('/monitor/like/'+$scope.monitor.id)
    .then(function onSuccess(sailsResponse){
      $scope.monitor.idea.num_likes += 1;
      $scope.hasBeenLiked = true;
      // kill closeLikeTimer if it exists
      if (closeLikeTimer) $timeout.cancel(closeLikeTimer);
      closeLikeTimer = $timeout($scope.closeLike, 5000);
    })
    .catch(function onError(sailsResponse){
      toastr.error('Error storing like: '+sailsResponse.status, 'Error');
    });
  }

  $scope.closeLike = function() {
    if (closeLikeTimer) $timeout.cancel(closeLikeTimer);
    // unpause the monitor
    $sails.post('/monitor/unpause/'+$scope.monitor.id)
    .then(function onSuccess(sailsResponse){
      $scope.hasBeenLiked = false;
    })
    .catch(function onError(sailsResponse){
      toastr.error('Error unpausing monitor: '+sailsResponse.status, 'Error');
    });
  }

  // watch for monitor updates
  var refreshHandler2 = $sails.on('message', function(message) {
    console.log('message',message);
  });

  var refreshHandler = $sails.on('monitor', function(message) {
    if (message.verb === 'restart') {
      setTimeout(function() {
        $window.location.href = '/';
      }, 2000);
    } else if (message.verb === 'refresh' && message.data.id==$scope.monitor.id) {
      // console.log('data refresh sent: '+message.data.id);
      $scope.hasBeenLiked = false;
      $scope.transitioning = true;

      // ping HQ that this monitor is still alive
      $sails.post('/monitor/ping/'+$scope.monitor.id);

      $timeout(function() {
        $scope.monitor = message.data;
        $scope.transitioning = false;
        
        // refresh random monitor color
        if (!colorSchemeArr.length) colorSchemeArr = shuffleArray([1,2,3,4,5,6]);
        $scope.colorSchemeIndex = colorSchemeArr.pop();
      }, 2500);
    }
  });

  // stop watching on destroy
  $scope.$on('$destroy', function() {
    $sails.off('monitor', refreshHandler);
  });

}]);

// monitor HQ
MonitorApp.controller('MonitorHQController', ['$scope', '$sails', '$sails', 'toastr', '$timeout', function($scope, $sails, $sails, toastr, $timeout){
  $scope.log = "Listening...\n";

  $sails.get('/monitor')
  .then(function(sailsResponse){
    $scope.monitors = sailsResponse.data;
  },function(sailsResponse) {
    toastr.error(sailsResponse, 'Error');
  });

  $scope.deleteMonitor = function(id) {
    $sails.post('/monitor/destroy/'+id)
    .then(function onSuccess(sailsResponse){
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(id);
      $scope.monitors.splice(idx, 1);
    });
  }

  var HQHandler = $sails.on('monitor', function(message) {
    console.log(message);
    var extra = '';
    if (message.verb === 'created') {
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.data.id);
      if (idx<0) {
        $scope.monitors.push(message.data);
      } else {
        $scope.monitors[idx] = message.data;
        // extra = ' : Idea ' + message.data.idea.id;
      }
    }
    else if (message.verb === 'destroyed') {
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.id);
      $scope.monitors.splice(idx, 1);
    }
    else if (message.verb === 'refresh') {
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.data.id);
      // console.log('refresh: ',idx);
      // console.log($scope.monitors[idx], message.data);
      extra = ' : Idea ' + message.data.idea.id;
      $scope.monitors[idx] = message.data;
    }
    $scope.log = ('monitor '+message.verb+': '+message.id) + extra + "\n" + $scope.log.substr(0,10000);
  });

  // stop watching on destroy
  $scope.$on('$destroy', function() {
    $sails.off('monitor', HQHandler);
  });

}]);
