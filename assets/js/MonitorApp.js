var MonitorApp = angular.module('MonitorApp', ['toastr','ngSails']);

// Quickie function to shuffle an array
var shuffleArray = function(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

// Single monitor
MonitorApp.controller('MonitorController', ['$scope', '$sails', 'toastr', '$timeout', function($scope, $sails, toastr, $timeout){
  var closeLikeTimer;
  var colorSchemeArr = shuffleArray([1,2,3,4]);

  $scope.hasBeenLiked = false;
  $scope.transitioning = false;
  $scope.colorSchemeIndex = colorSchemeArr.pop();
 
  $scope.likeIdea = function() {
    // Are we in the middle of transitioning? Abort like
    if ($scope.transitioning) { return }
    // Send like to pause monitor & update num_likes
    $sails.post('/monitor/like/' + $scope.monitor.id)
    .then(function onSuccess(sailsResponse){
      $scope.monitor.idea.num_likes += 1;
      $scope.hasBeenLiked = true;
      // Kill closeLikeTimer if it exists
      if (closeLikeTimer) $timeout.cancel(closeLikeTimer);
      closeLikeTimer = $timeout($scope.closeLike, 5000);
    })
    .catch(function onError(sailsResponse){
      toastr.error('Error storing like: ' + sailsResponse.status, 'Error');
    });
  }

  // Close Like area
  $scope.closeLike = function() {
    if (closeLikeTimer) $timeout.cancel(closeLikeTimer);
    // Unpause the monitor
    $sails.post('/monitor/unpause/' + $scope.monitor.id)
    .then(function onSuccess(sailsResponse){
      $scope.hasBeenLiked = false;
    })
    .catch(function onError(sailsResponse){
      toastr.error('Error unpausing monitor: ' + sailsResponse.status, 'Error');
    });
  }

  // Watch for sails socket broadcasts
  var refreshHandler = $sails.on('monitor', function(message) {
    if (message.verb === 'refresh' && message.data.id==$scope.monitor.id) {
      $scope.hasBeenLiked = false;
      $scope.transitioning = true;

      // ping HQ that this monitor is still alive
      $sails.post('/monitor/ping/' + $scope.monitor.id);

      $timeout(function() {
        $scope.monitor = message.data;
        $scope.transitioning = false;
        
        // refresh random monitor color
        if (!colorSchemeArr.length) colorSchemeArr = shuffleArray([1,2,3,4]);
        $scope.colorSchemeIndex = colorSchemeArr.pop();
      }, 2500);
    }
  });

  // stop watching on destroy
  $scope.$on('$destroy', function() {
    $sails.off('monitor', refreshHandler);
  });

}]);

// Monitor HQ Controller
MonitorApp.controller('MonitorHQController', ['$scope', '$sails', 'toastr', '$timeout', function($scope, $sails, toastr, $timeout){
  $scope.log = "Listening...\n";

  // Pulls in initial state of all monitors
  $sails.get('/monitor')
  .then(function(sailsResponse){
    $scope.monitors = sailsResponse.data;
  },function(sailsResponse) {
    toastr.error(sailsResponse, 'Error');
  });

  $scope.monitorInfo = function(monitor) {
    var info = 'Monitor #' + monitor.id + ' (' + monitor.ip + ')';
    if (monitor.idea) {
      info += ' — Showing Idea #' + monitor.idea.id + ' (' + monitor.idea.idea_name + ')';
    }
    return info;
  }

  // Manually delete monitor links
  $scope.deleteMonitor = function(id) {
    $sails.post('/monitor/destroy/' + id)
    .then(function onSuccess(sailsResponse){
      var idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(id);
      $scope.monitors.splice(idx, 1);
    });
  }

  // Watch for monitor updates and show in HQ log
  var HQHandler = $sails.on('monitor', function(message) {
    var monitor_info = '',
        idx;
    if (message.verb === 'created') {
      idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.data.id);
      if (idx<0) {
        $scope.monitors.push(message.data);
      } else {
        $scope.monitors[idx] = message.data;
      }
      monitor_info = $scope.monitorInfo(message.data);
    }
    else if (message.verb === 'destroyed') {
      idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.id);
      $scope.monitors.splice(idx, 1);
      monitor_info = 'Monitor #' + message.id;
    }
    else if (message.verb === 'refresh' || message.verb === 'like') {
      idx = $scope.monitors.map(function(e) { return e.id; }).indexOf(message.data.id);
      $scope.monitors[idx] = message.data;
      monitor_info = $scope.monitorInfo(message.data);
    }
    // Dump data in top of log
    $scope.log = (message.verb + ': ' + monitor_info + "\n") + $scope.log.substr(0,10000);
  });

  // Stop watching on destroy
  $scope.$on('$destroy', function() {
    $sails.off('monitor', HQHandler);
  });

}]);
