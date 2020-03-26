import React, { Component } from "react";
import PropTypes from 'prop-types';
import CalendarHeatmap from "react-calendar-heatmap";
import DateDetailList from "../..//component/dateDetailList/DateDetailList";
import moment from "moment";

import "./Heatmap.scss";


class Heatmap extends Component {

    render() {
        const startDate = new Date(`${this.props.year}-01-01`);
        const endDate = new Date(`${this.props.year}-12-31`);

        const dataForDate = this.props.selectedDate ? this.props.heatmapDateMap[this.props.selectedDate] : [];
        const dateDetailList = this.props.selectedDate ? (
            <DateDetailList
                ref="date-detail-list"
                data={dataForDate}
            />
        ) : null;
        const isSelectedDateMap = parseInt(moment(this.props.selectedDate).format("YYYY")) === this.props.year;

        var mapVals = [];
        mapVals = this.props.links.concat(this.props.instagrams);
        console.log("render props", this.props)
        /*
        // TODO
        if (this.props.selectedActivityType === ALL_ACTIVITIES_STRING) {
            mapVals = this.props.links.concat(this.props.instagrams);
        } else if (this.props.selectedActivityType === INSTAGRAMS_STRING) {
            mapVals = this.props.links;
        } else if (this.props.selectedActivityType === LINKS_STRING) {
            mapVals = this.props.links;
        }
        */

        // TODO: onclick seems like a weird place to have it
        return (
            <div className="heatmap">
                <h4>{this.props.year}</h4>
                <CalendarHeatmap
                    startDate={startDate}
                    endDate={endDate}
                    values={mapVals}
                    onClick={this.props.onClick}
                    showMonthLabels={true}
                    showWeekdayLabels={true}
                    horizontal={this.props.horizontal}
                />
                {isSelectedDateMap ? dateDetailList : undefined}
            </div>
        );
    }
}

// TODO
Heatmap.propTypes = {
  instagrams: PropTypes.array,
  links: PropTypes.array
}

Heatmap.defaultProps = {
  instagrams: [],
  links: []
};

export default Heatmap;
