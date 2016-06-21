import $ from 'jquery';
var React = require('react');
var Moment = require('moment');
var EventList = require('./EventList');

var EventBox = React.createClass({
    propTypes: {
        pollInterval: React.PropTypes.number.isRequired
    },
    getInitialState: function() {
        return {
            events: [],
            date: '',
            prevDate: {},
            nextDate: {}
        };
    },
    getURL: function () {
        var url = this.props.apiUrl;
        if (this.props.location.search) {
            if (this.props.location.query.day) {
                return url + '?day=' + this.props.location.query.day;
            }
        }
        return url += '?day=latest';
    },
    getNextDayLink: function(date) {
        if (Moment(date).isValid()) {
            return this.props.location.pathname + '?day=' + Moment(date).format('YYYY-MM-DD').toString();
        }
        return null;
    },
    loadEventsFromServer: function() {
        var url = this.getURL();

        $.ajax({
            url: url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({
                    events: data.events,
                    date: data.date,
                    prevUrl: this.getNextDayLink(data.previousEventDate),
                    nextUrl: this.getNextDayLink(data.nextEventDate)
                });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.apiUrl, status, err.toString());
            }.bind(this)
        });
    },
    handleEventDelete: function(_id) {
        $.ajax({
            url: this.props.apiUrl + '/' + _id,
            type: 'DELETE',
            success: function(data) {
                this.setState({data: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.apiUrl, status, err.toString());
            }.bind(this)
        });
    },
    componentDidMount: function() {
        this.loadEventsFromServer();
        //setInterval(this.loadEventsFromServer, this.props.pollInterval);
    },
    render: function() {
        return (
            <div className="eventBox">
                <EventList events={this.state.events}
                           date={this.state.date}
                           prevUrl={this.state.prevUrl}
                           nextUrl={this.state.nextUrl}
                           onEventDelete={this.handleEventDelete} />
            </div>
        );
    }
});

module.exports = EventBox;
