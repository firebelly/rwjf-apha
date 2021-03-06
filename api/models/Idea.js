/**
* Idea.js
*
* @description :: RWJF Idea model
*/

var fs = require('fs-extra');
var conf = sails.config.custom;
var request = require('request');

module.exports = {

  attributes: {
    idea_name: { type: 'string' },
    idea_content: { type: 'string' },
    action_areas: { type: 'array' },
    outcome_areas: { type: 'array' },
    photo: { type: 'string' },
    no_photo: { type: 'boolean' },
    first_name: { type: 'string' },
    middle: { type: 'string' },
    last_name: { type: 'string' },
    organization: { type: 'string' },
    email: { type: 'string' },
    twitter: { type: 'string' },
    published: { type: 'boolean' },
    num_likes: { type: 'integer', defaultsTo: 0 },
    num_views: { type: 'integer', defaultsTo: 0 },
    monitor: { model: 'monitor', defaultsTo: null }
  },

  // Move queue directory of photos to photos/idea.id, recreate /queue for next idea
  afterCreate: function(idea, cb) {
    fs.move(conf.photosDir + '/queue', conf.photosDir + '/' + idea.id, function (err) {
      if (err) return cb(err);
      sails.log.verbose('Moved queue to ' + conf.photosDir + '/' + idea.id + ' OK!');
      fs.mkdir(conf.photosDir + '/queue', function (err) {
        if (err) return cb(err);
        sails.log.verbose('Made dir '+conf.photosDir + '/queue' + ' OK!');
      });
    });
    // Post data to rwjf-log
    request.post({ url:'http://rwjf-logger.firebelly.co/log.php', body: { log: { type: 'new idea', content: idea }}, json: true}, function(err, body, res) { if (err) { sails.log.warn('Unable to remote log'); }});
    cb();
  },

  // Remove photo directory for Idea if it's destroyed
  afterDestroy: function(destroyedRecords, cb) {
    _.each(destroyedRecords, function(record) {
      fs.remove(conf.photosDir + '/' + record.id, function (err) {
        if (err) cb(err);
      });
    });
    cb();
  },

  // Default various values on Ideas
  afterValidate: function(values, cb) {
    if (values.first_name) {
      values.full_name = [values.first_name, values.middle, values.last_name].join(' ');
    } else {
      values.full_name = '';
    }
    if (values.twitter) {
      // Force @ in twitter handle
      values.twitter = '@' + values.twitter.replace('@','');
    }
    if (values.photo) {
      values.photo_url = conf.photosBaseURL + '/' + values.id + '/' + values.photo;
    } else if (values.no_photo) {
      values.photo_url = '/images/no-photo.png';
    }
    cb();
  }

};
