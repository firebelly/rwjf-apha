/**
* Monitor.js
*
* @description :: RWJF Monitor model
*/

module.exports = {

  attributes: {
    paused: { type: 'boolean', defaultsTo: false },
    ip: { type: 'string', defaultsTo: '' },
    ping: { type: 'integer', defaultsTo: 0 },
    idea: { 
      model: 'idea',
    }
  },

  // Null out monitor's idea before destroying
  beforeDestroy: function(id, cb) {
    Monitor.findOne(id).populate('idea').exec(function(err, monitor) {
      if (err) return cb(err);
      if (monitor.idea) {
        monitor.idea.monitor = null;
        monitor.idea.save(cb);
      } else {
        cb();
      }
    });
  },

  // Method to find an Idea not currently shown on a Monitor, then associate to Monitor and save
  findFreshIdea: function(id, cb) {
    sails.log.verbose('Finding fresh idea for monitor '+id);
    Monitor.findOne(id).exec(function (err, thisMonitor) {
      if (err) return cb(err);
      if (!thisMonitor) {
        sails.log.error('Monitor '+id+' not found.');
        return cb();
      }

      // Get count of Ideas to randomize
      Idea.count({ published: true, monitor: null }).exec(function(err, numIdeas) {
        if (err) return cb(err);
        var randIdea = Math.floor(Math.random() * numIdeas);
        sails.log.verbose(numIdeas + ' ideas, choosing ' + randIdea);
        // Idea.find().where({ published: true, monitor: null }).sort({ num_views: 'ASC' }).limit(1).exec(function foundIdeas(err, ideas) {
        Idea.find().where({ published: true, monitor: null }).skip(randIdea).limit(1).exec(function foundIdeas(err, ideas) {
          if (err) return cb(err);
          if (ideas.length === 0) {
            sails.log.warn('All ideas are being shown');
            return cb();
          }
          var idea = ideas[0];
          sails.log.verbose('found idea' + idea.id + ' ' + idea.idea_name);
          idea.num_views++;
          idea.monitor = thisMonitor.id;
          idea.save();
          // Save and return monitor
          thisMonitor.idea = idea.id;
          thisMonitor.save(cb);
        });
      });

    });
  }
};
