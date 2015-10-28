/**
 * MonitorController.js
 *
 * @description :: Server-side logic for managing monitors
 */

// Monitor refresh interval runs periodically to update 
var refreshInterval = setInterval(function(){
  Monitor.find().where({paused: false}).populate('idea').sort({ updatedAt: 'ASC' }).limit(1).exec(function foundMonitors(err, monitors) {
    if (err) {
      sails.log.error(err);
    } else if (monitors.length === 0) {
      sails.log.warn('No monitors found');
    } else {
      var monitor = monitors[0];
      var oldIdea = monitor.idea;
      Monitor.findFreshIdea(monitor.id, function(err, freshMonitor) {
        if (err) {
          sails.log.error(err);
        } else {
          // clear out old idea's monitor field
          if (oldIdea) {
            oldIdea.monitor = null;
            oldIdea.save();
          }
          // populate idea, broadcast to sockets
          Monitor.findOne(monitor.id).populate('idea').exec(function(err, refreshedMonitor) {
            sails.sockets.blast('monitor', { verb: 'refresh', data: refreshedMonitor });
          });
        }
      });
    }
  });

  // Clean up old monitors that haven't pinged in a minute
  var moldyMonitorDate = new Date().getTime() - 60000;
  Monitor.find().where({ ping: { '<': moldyMonitorDate } }).populate('idea').exec(function foundMonitors(err, monitors) {
    _.each(monitors, function(monitor) {
      if (monitor.idea) {
        monitor.idea.monitor = null;
        monitor.idea.save();
      }
      Monitor.destroy({ id: monitor.id }).exec(function(err) {
        if (err) {
          sails.log.error(err);
        } else {
          Monitor.publishDestroy(monitor.id);
        }
      });
    });
  });

}, 6000);

module.exports = {

  // New monitor page
  new: function(req, res) {
    Monitor.create({ 
      ip: req.ip, 
      ping: new Date().getTime() 
    })
    .exec(function(err, monitor) {
      if (err) {return res.serverError(err);}

      // Broadcast creation of monitor
      Monitor.publishCreate(monitor, req);
      req.session.monitor = monitor;

      // Initialize monitor with fresh idea
      Monitor.findFreshIdea(monitor.id, function(err, freshMonitor) {
        if (err) {return res.serverError(err);}
        // Populate idea, broadcast to sockets
        Monitor.findOne(monitor.id).populate('idea').exec(function(err, refreshedMonitor) {
          sails.sockets.blast('monitor', { verb: 'refresh', data: refreshedMonitor });

          res.view('monitor/show', {
            monitor: refreshedMonitor,
            layout: false
          });
        });
      });

    });
  },

  // Like clicked on monitor, update idea num_likes and pause monitor
  like: function(req, res, next) {
    Monitor.findOne(req.param('id')).populate('idea').exec(function foundMonitor(err, monitor) {
      if (err) return next(err);
      if (!monitor) return next();
      monitor.idea.num_likes += 1;
      monitor.idea.save();
      monitor.paused = true;
      monitor.save();
      sails.sockets.blast('monitor', { verb: 'like', data: monitor });
      return res.json(monitor);
    });
  },

  // Monitors send ping when they get a refresh signal so we know they're alive (dead monitors cleared out with refresh interval above)
  ping: function(req, res, next) {
    Monitor.update({id: req.param('id')}, { ping: new Date().getTime() }).exec(function(err, refreshedMonitor) {
      if (err) return next(err);
      return res.json(refreshedMonitor);
    });
  },

  // Unpause monitor so it enters randomized rotation again
  unpause: function(req, res, next) {
    Monitor.update({id: req.param('id')}, { paused: false }).exec(function updatedOK(err, refreshedMonitor) {
      if (err) return next(err);
      return res.json(refreshedMonitor);
    });
  },

  // Monitorbot HQ
  hq: function(req, res, next) {
    res.view('monitor/hq', {
      layout: false
    });
  },
  
};
