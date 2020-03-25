import React, { Component } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "./Heatmap.scss";

class Heatmap extends Component {
    render() {
        // TODO: onclick seems like a weird place to have it
        return (
            <div className="heatmap">
                <CalendarHeatmap
                    startDate={this.props.startDate}
                    endDate={this.props.endDate}
                    values={this.props.values}
                    onClick={this.props.onClick}
                    showMonthLabels={true}
                    showWeekdayLabels={true}
                    horizontal={this.props.horizontal}
                />
            </div>
        );
    }
}

export default Heatmap;
