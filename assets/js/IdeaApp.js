var IdeaApp = angular.module('IdeaApp', ['toastr', 'ngSails']);

// Controller for Idea Search
IdeaApp.controller('IdeaSearchController', ['$scope', '$sails', '$http', 'toastr', '$window', function($scope, $sails, $http, toastr, $window){
}]);

// Controller for Idea List
IdeaApp.controller('IdeaListController', ['$scope', '$sails', '$http', 'toastr', '$window', function($scope, $sails, $http, toastr, $window){
  // $scope.idea = { is_editing: false };
  $scope.togglePublished = function() {
    $scope.idea.published = !$scope.idea.published;
    // Submit request to Sails.
    $http.post('/idea/update/'+$scope.idea.id, {
      published: $scope.idea.published
    });
  }
  $scope.toggleEditing = function() {
    $scope.idea.is_editing = !$scope.idea.is_editing;
  }
}]);

// Controller for Idea Forms
IdeaApp.controller('IdeaFormController', ['$scope', '$sails', '$http', 'toastr', '$window', function($scope, $sails, $http, toastr, $window){

  // update or create idea?
  $scope.formMode = $window.location.href.match(/new/) ? 'create' : 'update';

  // Checkbox lists
  $scope.action_areas = [
    'Shared values',
    'Collaboration',
    'Communities',
    'Health care',
  ];
  $scope.outcome_areas = [
    'Enhanced well-being',
    'Managed chronic disease & stress',
    'Reduced health care costs',
  ];

  // set-up loading state
  $scope.ideaForm = {
    loading: false
  }

  $scope.init = function () {
    console.log('init', $scope.ideaForm.id, $scope.formMode);
    // get initial listing of photos
    if ($scope.formMode==='update') {
      $http.post('/photos/' + $scope.ideaForm.id).then(function onSuccess(sailsResponse){
        $scope.ideaForm.photos = sailsResponse.data;
        console.log(sailsResponse);
      });
    } else {
      $scope.ideaForm.id = 'new';
      $http.post('/photos/queue').then(function onSuccess(sailsResponse){
        $scope.ideaForm.photos = sailsResponse.data;
        console.log('/photos/queue', sailsResponse, sailsResponse.data);
      });
    }
  }

  // watch for updates from socket.io via sails
  var imageHandler = $sails.on('photos', function (message) {
    if (message.verb === 'add') {
      $scope.ideaForm.photos.push(message.image);
    }
    else if (message.verb === 'unlink') {
      var idx = $scope.ideaForm.photos.indexOf(message.image);
      $scope.ideaForm.photos.splice(idx, 1);
    }
  });

  // helper functions to select/clear photos
  $scope.selectPhoto = function(photo){
    $scope.ideaForm.photo = photo;
    $scope.ideaForm.no_photo = false;
  },
  $scope.clearPhoto = function() {
    $scope.ideaForm.photo = '';
  },

  // toggle selection for multiple checklist
  $scope.toggleAction = function toggleAction(item) {
    if (typeof $scope.ideaForm.action_areas === 'undefined') $scope.ideaForm.action_areas = [];
    var idx = $scope.ideaForm.action_areas.indexOf(item);
    if (idx > -1) { $scope.ideaForm.action_areas.splice(idx, 1); }
    else { $scope.ideaForm.action_areas.push(item); }
    console.log($scope.ideaForm.action_areas);
  };
  $scope.toggleOutcome = function toggleOutcome(item) {
    if (typeof $scope.ideaForm.outcome_areas === 'undefined') $scope.ideaForm.outcome_areas = [];
    var idx = $scope.ideaForm.outcome_areas.indexOf(item);
    if (idx > -1) { $scope.ideaForm.outcome_areas.splice(idx, 1); }
    else { $scope.ideaForm.outcome_areas.push(item); }
    console.log($scope.ideaForm.outcome_areas);
  };

  // handle submit
  $scope.submitIdeaForm = function(){

    // Set the loading state (i.e. show loading spinner)
    $scope.ideaForm.loading = true;
    var postUrl = ($scope.formMode==='update') ? '/idea/update/'+$scope.ideaForm.id : '/idea/create';

    // Submit request to Sails.
    $http.post(postUrl, {
      idea_name: $scope.ideaForm.idea_name,
      idea_content: $scope.ideaForm.idea_content,
      action_areas: $scope.ideaForm.action_areas,
      outcome_areas: $scope.ideaForm.outcome_areas,
      photo: $scope.ideaForm.photo,
      no_photo: $scope.ideaForm.no_photo,
      first_name: $scope.ideaForm.first_name,
      middle: $scope.ideaForm.middle,
      last_name: $scope.ideaForm.last_name,
      organization: $scope.ideaForm.organization,
      email: $scope.ideaForm.email,
      twitter: $scope.ideaForm.twitter,
      published: $scope.ideaForm.published
    })
    .then(function onSuccess(sailsResponse){
      if ($scope.formMode==='update') {
        toastr.success('Post saved OK!');
        // propagate updates to parent IdeaListController controller
        $scope.$parent.idea = $scope.ideaForm;
        // close form
        $scope.$parent.idea.is_editing = false;
      } else {
        window.location = '/idea/';
      }
    })
    .catch(function onError(sailsResponse){
      toastr.error(sailsResponse.status, 'Error');
    })
    .finally(function eitherWay(){
      $scope.ideaForm.loading = false;
    });
  }

}]);

// simple filter for generating valid IDs from arbitrary values
IdeaApp.filter('slugify',function() {
  return function(input) {
    if (input) {
      return input.replace(/[^\w\d]+/g, '-').toLowerCase();
    }
  }
});