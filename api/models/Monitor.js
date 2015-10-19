/**
* Monitor.js
*
* @description :: RWJF Monitor model
*/

module.exports = {

  schema: false,
  
  attributes: {
    idea: { 
      model: 'idea' 
    },
    refresh: function() {
      var this_monitor = this;
      var used_ids = [];
      Monitor.find(function foundMonitors(err1, monitors) {
        if (err1) {
          sails.log.error(err1);
        } else {
          _.each(monitors, function(monitor) {
            // console.log(monitor);
            if (monitor.idea) {
              used_ids.push(monitor.idea);
            }
          });
          // console.log(used_ids, monitors);

          Idea.find().where({ published: true, id: { '!': used_ids }}).sort({ num_views: 'ASC' }).limit(1).exec(function foundIdeas(err2, ideas) {
            if (err2) {
              sails.log.error(err2);
              next(err2);
            } else if (ideas.length === 0) {
              sails.log.error('All ideas are being shown');
              return this;
              // this is a problem since there won't be 6 to start with. should we filter out the used_ids later, maybe with lodash, only if num_ideas > num_monitors?
            } else {
              idea = ideas[0];
              this_monitor.idea = idea.id;
              this_monitor.save();
              idea.num_views++;
              // could set this, and unset on socket disconnect for monitors, and then query Idea.find().where({ monitor: null })
              // idea.monitor = monitor.id;
              idea.save();
              console.log('Monitor '+this_monitor.id+' refreshed');
              return this_monitor;
            }
          }); // good
        }
      }); // lord
    }
  },

  // get next idea and associate with monitor
  afterCreate: function(obj, next) {
    Monitor.findOne(obj.id, function(err, new_monitor){
      if (err) {
        next(err);
      } else {
        new_monitor.refresh();
        next();
      }
    });
  }

};
