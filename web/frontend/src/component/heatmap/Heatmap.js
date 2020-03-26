import React, { Component } from "react";
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
        mapVals = this.props.sortedLinks.concat(this.props.sortedInstagrams);
        /*
        // TODO
        if (this.props.selectedActivityType === ALL_ACTIVITIES_STRING) {
            mapVals = this.props.sortedLinks.concat(this.props.sortedInstagrams);
            // console.log("mapVals", mapVals)
        } else if (this.props.selectedActivityType === INSTAGRAMS_STRING) {
            mapVals = this.props.sortedInstagrams;
        } else if (this.props.selectedActivityType === LINKS_STRING) {
            mapVals = this.props.sortedLinks;
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

export default Heatmap;
