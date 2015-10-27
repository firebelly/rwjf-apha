/**
 * MonitorController
 *
 * @description :: Server-side logic for managing monitors
 */

var refreshInterval = setInterval(function(){
  Monitor.find().where({paused: false}).populate('idea').sort({ updatedAt: 'ASC' }).limit(1).exec(function foundMonitors(err, monitors) {
    if (err) {
      sails.log.error(err);
    } else if (monitors.length === 0) {
      sails.log.error('No monitors found');
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

  // cleanup old monitors
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

}, 2500);

module.exports = {

  // new monitor page
  new: function(req, res) {
    Monitor.create({ ping: new Date().getTime() })
    .exec(function(err, monitor) {
      if (err) {return res.serverError(err);}
      Monitor.publishCreate(monitor, req);
      req.session.monitor = monitor;
      res.view('monitor/show', {
        monitor: monitor,
        layout: false
      });

    });
  },

  // like clicked on monitor, update idea num_likes and pause monitor
  like: function(req, res, next) {
    Monitor.findOne(req.param('id')).populate('idea').exec(function foundMonitor(err, monitor) {
      if (err) return next(err);
      if (!monitor) return next();
      monitor.idea.num_likes += 1;
      monitor.idea.save();
      monitor.paused = true;
      monitor.save();
      return res.json(monitor);
    });
  },

  // monitors send ping when they get a refresh signal so we know their alive (cleared out with refresh interval above)
  ping: function(req, res, next) {
    Monitor.update({id: req.param('id')}, { ping: new Date().getTime() }).exec(function(err, refreshedMonitor) {
      if (err) return next(err);
      return res.json(refreshedMonitor);
    });
  },

  // unpause monitor so it enters randomized rotation again
  unpause: function(req, res, next) {
    Monitor.update({id: req.param('id')}, { paused: false }).exec(function updatedOK(err, refreshedMonitor) {
      if (err) return next(err);
      return res.json(refreshedMonitor);
    });
  },

  // fire up the monitorbot
  hq: function(req, res, next) {
    var socketId = sails.sockets.id(req);
    var session = req.session;
    // Get updates about monitors being created
    Monitor.watch(req);
    // Get updates about monitors being created
    res.view('monitor/hq', {
      layout: false
    });
  },
  
};
