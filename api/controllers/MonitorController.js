/**
 * MonitorController
 *
 * @description :: Server-side logic for managing monitors
 */

var refreshInterval = setInterval(function(){
  Monitor.find().sort({ updatedAt: 'ASC' }).limit(1).exec(function foundMonitors(err, monitors) {
    if (err) {
      sails.log.error(err);
      next(err);
    } else if (monitors.length === 0) {
      sails.log.error('No monitors found');
      next();
    } else {
      monitor = monitors[0];
      monitor.refresh();
      setTimeout(function() {
        Monitor.findOne(monitor.id).populate('idea').exec(function foundMonitor(err, refreshed_monitor) {
          // socket.emit('monitor:'+refreshed_monitor.id, { monitor: refreshed_monitor });
          sails.sockets.blast('monitors', { verb: 'refresh', monitor: refreshed_monitor });
        });
      }, 150);
      // cleanup      
      // var moldyMonitorDate = new Date().getTime() - 60000;
      // Monitor.find().where({ updatedAt: { '<': new Date(moldyMonitorDate) } }).populate('idea').exec(function foundMonitors(err, monitors) {
      //   _.each(monitors, function(monitor) {
      //     var logMsg = monitor.id+' deleted, last updated at '+monitor.updatedAt;
      //     sails.sockets.blast('monitors', { verb: 'remove', monitor: monitor });
      //     Monitor.destroy({ id: monitor.id }).exec(function deletedMonitor(err) {
      //       if (!err) {
      //         console.log(logMsg);
      //       }
      //     });
      //   });
      // });
    }
  });
}, 1000);

module.exports = {

  // new monitor page
  new: function(req, res) {
    Monitor.create()
    .exec(function(err, monitor) {
      if (err) {
        return console.log(err);
      }
      else {
        // Monitor.publishCreate(monitor);
        sails.sockets.blast('monitors', { verb: 'add', monitor: monitor });
        setTimeout(function() {
          res.redirect('/monitor/'+monitor.id);
        }, 150);
      }
    });
  },
  // refresh a monitor's idea (see models/Monitor.js)
  refresh: function(req, res, next) {
    Monitor.findOne(req.param('id'), function foundMonitor (err, monitor) {
      if (err) return next(err);
      if (!monitor) return next();
      monitor.refresh();
      Monitor.findOne(req.param('id')).populate('idea').exec(function foundMonitor (err, refreshed_monitor) {
        if (req.wantsJSON) {
          return res.json(refreshed_monitor);
        } else {
          res.redirect('/monitor/'+monitor.id);
        }
      });
    });
  },
  // fire up the monitorbot
  hq: function(req, res, next) {
    res.view('monitor/hq', {
      layout: false
    });
  },
  // show single monitor
  show: function(req, res, next) {
    Monitor.findOne(req.param('id')).populate('idea').exec(function foundMonitor (err, monitor) {
      if (err) return next(err);
      if (!monitor) {
        // monitor deleted? just create a new one
        return res.redirect('/');
        // return next();
      }
      req.session.monitor = monitor;
      sails.sockets.blast('monitors', { verb: 'add', monitor: monitor });
      console.log('monitor added');
      // console.log(req.session);
      res.view('monitor/show', {
        monitor: monitor,
        layout: false
      });
    });
  }
  
};
