import React from "react";
import Flex from "../framework/flex";
import SelectLabel from "../framework/select-label";
// import ToggleBranchLabels from "./toggle-branch-labels";
import ColorBy from "./color-by";
import Toggle from "./toggle";
// import Search from "./search";
import DateRangeInputs from "./date-range-inputs";
import AnalysisDateSlider from "./analysis-date-slider";
import ChooseLayout from "./choose-layout";
import ChooseVirus from "./choose-virus";
import ChooseMetric from "./choose-metric";
import GeoResolution from "./geo-resolution";
import AllFilters from "./all-filter";
import * as globals from "../../util/globals";
import { titleStyles } from "../../globalStyles";
import { connect } from "react-redux";
import { toggleColorByLikelihood, toggleConfidence } from "../../actions/treeProperties";

const header = (text) => (
  <span style={titleStyles.small}>
    {text}
  </span>
);

@connect((state) => ({
  analysisSlider: state.controls.analysisSlider,
  confidence: state.controls.confidence,
  colorByLikelihood: state.controls.colorByLikelihood
}))
class Controls extends React.Component {
  static propTypes = {
    analysisSlider: React.PropTypes.any,
    colorByLikelihood: React.PropTypes.object.isRequired,
    confidence: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func
  }
  getStyles() {
    return {};
  }
  analysisSlider() {
    if (this.props.analysisSlider && this.props.analysisSlider.valid) {
      return (
        <g>
          <br/>
          {header("Analysis Date")}
          <AnalysisDateSlider/>
        </g>
      );
    }
    return null;
  }
  // restore <ToggleBranchLabels/> below when perf is improved
  render() {
    // const styles = this.getStyles();
    return (
      <Flex
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        style={{
          width: globals.controlsWidth,
          padding: "0px 20px 20px 20px"
        }}
      >

        {header("Dataset")}
        <ChooseVirus/>

        {header("Date Range")}
        <DateRangeInputs/>

        {this.analysisSlider()}

        {header("Color By")}
        <ColorBy/>
        <Toggle
          display={this.props.colorByLikelihood.display}
          on={this.props.colorByLikelihood.on}
          callback={() => this.props.dispatch(toggleColorByLikelihood())}
          label="Likelihoods"
        />

        {header("Tree Options")}

        <SelectLabel text="Layout"/>
        <ChooseLayout/>

        <SelectLabel text="Branch Length"/>
        <ChooseMetric/>
        <Toggle
          display={this.props.confidence.display}
          on={this.props.confidence.on}
          callback={() => this.props.dispatch(toggleConfidence())}
          label="Confidence Intervals"
        />

        {header("Map Options")}
        <SelectLabel text="Geographic resolution"/>
        <GeoResolution/>

        {header("Filters")}
        <AllFilters/>

      </Flex>
    );
  }
}

export default Controls;
