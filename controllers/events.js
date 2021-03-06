var Event = require('../models/event');
var Moment = require('moment');
var eventFileUtils = require('../lib/util/eventFileUtils');

exports.list = function(req, res) {
    if (req.query.day) {
        if (req.query.day === 'latest') {
            returnLatestEventDayList(res);
        } else {
            returnDayEventList(res, Moment(req.query.day));
        }
    } else {
        returnLatestEventList(res);
    }
};

exports.create = function(req, res) {
    if (req.body.cameraName &&
        req.body.cameraLocation &&
        req.files['video'] &&
        req.files['previewImage']) {
        Event.create({
                cameraName: req.body.cameraName,
                cameraLocation: req.body.cameraLocation,
                date: req.body.date,
                video: req.files['video'][0].filename,
                previewImage: req.files['previewImage'][0].filename
            },
            function (err) {
                if (err) {
                    res.send(err);
                }
                res.sendStatus(200);
            });
    } else {
        res.sendStatus(400);
    }
};

exports.get = function(req, res) {
    Event.findOne({'_id' : req.params.event_id }, function(err, event) {
        if (err) {
            res.send(err);
        }
        res.json(event);
    });
};

exports.removeOldest = function(cb) {
        Event.findOne({}, null, {sort: {date: 1}}, function (err, event) {
            if (err) {
                cb(err, null);
            }
            if (event) {
                event.remove();
                eventFileUtils.deleteEventFiles(event);
            }
            cb(null, event);
        });
};

exports.delete = function(req, res) {
    if ('all' === req.params.event_id) {
        Event.remove({}, function (err) {
            if (err) {
                res.send(err);
            } else {
                eventFileUtils.deleteAllEventFiles();
                res.sendStatus(200);
            }
        });
    } else {
        Event.findOne({_id: req.params.event_id}, function (err, event) {
            if (err) {
                res.send(err);
            } else {
                if (event) {
                    event.remove();
                    eventFileUtils.deleteEventFiles(event);
                    res.sendStatus(200);
                } else {
                    res.sendStatus(400);
                }
            }
        });
    }
};

function returnLatestEventList(res) {
    Event.find({}, null, {sort: {date: -1}}, function (err, events) {
        if (err) {
            res.send(err);
        }
        res.json(events);
    });
}

function returnLatestEventDayList(res) {
    var currentDate = Moment();

    Event.findOne({'date': {'$lt': currentDate}}, null, {sort: {date: -1}}, function(err, event) {
        if (err) {
            res.send(err);
        }
        if (event) {
            returnDayEventList(res, Moment(event.date));
        } else {
            returnDayEventList(res, currentDate);
        }
    });
}

function returnDayEventList(res, queryDate) {
    var startOfDay = Moment(queryDate).startOf('day').toDate();
    var endOfDay = Moment(queryDate).endOf('day').toDate();
    var previousEventDate = null;
    var nextEventDate = null;

    Event.find({'date': { '$gte': startOfDay,  '$lt': endOfDay }}, null, {sort: {date: 1}}, function (err, events) {
        if (err) {
            res.send(err);
        }
        Event.findOne({'date': {'$lt': startOfDay}}, null, {sort: {date: -1}}, function(err, previousDayEvent) {
            if (err) {
                res.send(err);
            }
            if (previousDayEvent) {
                previousEventDate = Moment(previousDayEvent.date).startOf('day').toDate();
            }
            Event.findOne({'date': {'$gte': endOfDay}}, null, {sort: {date: 1}}, function (err, nextDayEvent) {
                if (err) {
                    res.send(err);
                }
                if (nextDayEvent) {
                    nextEventDate = Moment(nextDayEvent.date).startOf('day').toDate();
                }
                res.json({
                    events: events,
                    date: startOfDay,
                    nextEventDate: nextEventDate,
                    previousEventDate: previousEventDate
                });
            });
        });
    });
}
