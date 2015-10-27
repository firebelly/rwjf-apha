/**
 * IdeaController
 *
 * Server-side logic for managing Ideas
 */

var chokidar = require('chokidar'),
    glob = require('glob'),
    path = require('path');

// custom app config (mostly for photosBaseURL and photosDir)
var conf = sails.config.custom;

// watch /queue/ dir for files added/removed
var watcher = chokidar.watch(conf.photosDir + '/queue/', {
  ignored: /[\/\\]\./, 
  persistent: true
});

// if photo is added, broadcast with socket
watcher.on('add', function(file) { 
  var filename = path.basename(file);
  var photo = { src: conf.photosBaseURL + '/queue/' + filename, name: filename };
  console.log('File', file, photo, 'has been added');
  sails.sockets.blast('photos', { verb: 'add', photo: photo });
});

// similarly, broadcast if a photo is deleted
watcher.on('unlink', function(file) { 
  console.log('File', file, 'has been unlinked');
  var filename = path.basename(file);
  var photo = { src: conf.photosBaseURL + '/queue/' + filename, name: filename };
  sails.sockets.blast('photos', { verb: 'unlink', photo: photo });
});

module.exports = {

  // list of ideas page
  index: function(req, res) {
    Idea.count().exec(function countCB(error, found) { 
      var numIdeas = found; 
      Idea.find().sort({createdAt: 'DESC'}).exec(function foundIdeas (err, ideas) {
        if (err) {
          res.send(400);
        } else {
          if (req.wantsJSON) {
            return res.json(ideas);
          }
          else {
            return res.view({
              ideas: ideas, 
              formMode: 'list',
              numIdeas: numIdeas
            });
          }
        }
      });
    });
  },

  // new idea page
  new: function(req, res) {
    Idea.count().exec(function countCB(error, found) { 
      var numIdeas = found; 
      res.view('idea/create', {
        idea: {},
        formMode: 'create',
        numIdeas: numIdeas
      });
    });
  },

  // spits out json list of images in /:id/ (either idea.id or 'queue') directory for initial form loads
  photos: function(req, res) {
    glob(conf.photosDir + '/' + req.param('id') + '/*', function (er, files) {
      photos = [];
      _.each(files, function(file) {
        var filename = path.basename(file);
        photos.push({ src: conf.photosBaseURL + '/' + req.param('id') + '/' + filename, name: filename });
      });
      res.json(photos);
    });
  },
};
