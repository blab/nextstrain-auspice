import React from "react";
import d3 from "d3";
import _ from "lodash";
import { connect } from "react-redux";
import Card from "../framework/card";
import {changeDateFilter} from "../../actions/treeProperties";
import { numericToCalendar, calendarToNumeric } from "../../util/dateHelpers";
import setupLeaflet from "../../util/leaflet";
import setupLeafletPlugins from "../../util/leaflet-plugins";
import {drawDemesAndTransmissions, updateOnMoveEnd, updateVisibility} from "../../util/mapHelpers";
import { animationWindowWidth, animationTick, twoColumnBreakpoint } from "../../util/globals";
import computeResponsive from "../../util/computeResponsive";
import {getLatLongs} from "../../util/mapHelpersLatLong";
import {
  CHANGE_ANIMATION_START,
  CHANGE_ANIMATION_TIME,
  CHANGE_ANIMATION_CUMULATIVE,
  MAP_ANIMATION_PLAY_PAUSE_BUTTON
} from "../../actions/types.js";

@connect((state) => {
  return {
    datasetGuid: state.tree.datasetGuid,
    controls: state.controls,
    nodes: state.tree.nodes,
    visibility: state.tree.visibility,
    visibilityVersion: state.tree.visibilityVersion,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions,
    colorScale: state.controls.colorScale,
    colorBy: state.controls.colorBy,
    map: state.map,
    geoResolution: state.controls.geoResolution,
    // mapAnimationStartDate: state.controls.mapAnimationStartDate,
    mapAnimationDurationInMilliseconds: state.controls.mapAnimationDurationInMilliseconds,
    mapAnimationCumulative: state.controls.mapAnimationCumulative,
    mapAnimationPlayPauseButton: state.controls.mapAnimationPlayPauseButton,
    sequences: state.sequences,
    mapTriplicate: state.controls.mapTriplicate,
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax,
    dateScale: state.controls.dateScale,
    dateFormat: state.controls.dateFormat
  };
})

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null,
      demes: false,
      latLongs: null,
      d3DOMNode: null,
      d3elems: null,
      datasetGuid: null,
      responsive: null,
    };
  }
  static propTypes = {
    colorScale: React.PropTypes.object.isRequired
  }
  componentWillMount() {
    if (!window.L) {
      setupLeaflet(); /* this sets up window.L */
    }
  }
  componentDidMount() {
    /*
      this attaches several properties to window.L
      it's a bit of a hack, but it's a code execution order problem and it works fine.
    */
    setupLeafletPlugins();
  }
  componentWillReceiveProps(nextProps) {
    this.maybeComputeResponive(nextProps);
    this.maybeRemoveAllDemesAndTransmissions(nextProps); /* geographic resolution just changed (ie., country to division), remove everything. this change is upstream of maybeDraw */
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.props.nodes === null) {return}
    this.maybeCreateLeafletMap(); /* puts leaflet in the DOM, only done once */
    this.maybeSetupD3DOMNode(); /* attaches the D3 SVG DOM node to the Leaflet DOM node, only done once */
    this.maybeDrawDemesAndTransmissions(prevProps); /* it's the first time, or they were just removed because we changed dataset or colorby or resolution */
    this.maybeUpdateDemesAndTransmissions(prevProps); /* every time we change something like colorBy */
    this.maybeAnimateDemesAndTransmissions();
  }
  maybeCreateLeafletMap() {
    /* first time map, this sets up leaflet */
    if (
      this.props.browserDimensions &&
      this.props.metadata &&
      !this.state.map &&
      document.getElementById("map")
    ) {
      this.createMap();
    }
  }
  maybeComputeResponive(nextProps) {
    /*
      React to browser width/height changes responsively
      This is stored in state because it's used by both the map and the d3 overlay
    */
    if (
      this.props.browserDimensions &&
      (this.props.browserDimensions.width !== nextProps.browserDimensions.width ||
      this.props.browserDimensions.height !== nextProps.browserDimensions.height)
    ) {
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    } else if (!this.state.responsive && nextProps.browserDimensions) { /* first time */
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    } else if (
      this.props.browserDimensions &&
      this.props.datasetGuid &&
      nextProps.datasetGuid &&
      this.props.datasetGuid !== nextProps.datasetGuid // the dataset has changed
    ) {
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    } else if (this.props.sidebar !== nextProps.sidebar) {
      this.setState({responsive: this.doComputeResponsive(nextProps)});
    }
  }
  doComputeResponsive(nextProps) {
    return computeResponsive({
      horizontal: nextProps.browserDimensions.width > twoColumnBreakpoint && (this.props.controls && this.props.controls.splitTreeAndMap) ? .5 : 1,
      vertical: 1.0, /* if we are in single column, full height */
      browserDimensions: nextProps.browserDimensions,
      sidebar: nextProps.sidebar,
      minHeight: 480,
      maxAspectRatio: 1.0,
    })
  }
  maybeSetupD3DOMNode() {
    if (
      this.state.map &&
      this.state.responsive &&
      !this.state.d3DOMNode
    ) {
      const d3DOMNode = d3.select("#map svg");
      this.setState({d3DOMNode});
    }
  }
  maybeDrawDemesAndTransmissions(prevProps) {

    /* before April 2017 we fired this every time */

    const mapIsDrawn = !!this.state.map;
    const allDataPresent = !!(this.props.colorScale && this.props.metadata && this.props.nodes && this.state.responsive && this.state.d3DOMNode);
    const demesAbsent = !this.state.demes;

    /* if at any point we change dataset and app doesn't remount, we'll need these again */
    // const newColorScale = this.props.colorScale.version !== prevProps.colorScale.version;
    // const newGeoResolution = this.props.geoResolution !== prevProps.geoResolution;
    // const initialVisibilityVersion = this.props.visibilityVersion === 1; /* see tree reducer, we set this to 1 after tree comes back */
    // const newVisibilityVersion = this.props.visibilityVersion !== prevProps.visibilityVersion;

    if (
      // determining when the tree is ready needs to be improved
      this.props.datasetGuid &&
      mapIsDrawn &&
      allDataPresent &&
      demesAbsent
    ) {
      /* data structures to feed to d3 latLongs = { tips: [{}, {}], transmissions: [{}, {}] } */
      if (!this.state.boundsSet){ //we are doing the initial render -> set map to the range of the data
        const SWNE = this.getGeoRange();
        this.state.map.fitBounds(L.latLngBounds(SWNE[0], SWNE[1]));
      }

      this.state.map.setMaxBounds(this.getBounds())

      const latLongs = this.latLongs(); /* no reference stored, we recompute this for now rather than updating in place */
      const d3elems = drawDemesAndTransmissions(
        latLongs,
        this.props.colorScale.scale,
        this.state.d3DOMNode,
        this.state.map,
        this.props.nodes,
        this.props.controls
      );

      /* Set up leaflet events */
      // this.state.map.on("viewreset", this.respondToLeafletEvent.bind(this));
      this.state.map.on("moveend", this.respondToLeafletEvent.bind(this));

      // don't redraw on every rerender - need to seperately handle virus change redraw
      this.setState({
        boundsSet: true,
        demes: true,
        d3elems,
        latLongs,
      });
    }
  }
  maybeRemoveAllDemesAndTransmissions(nextProps) {
    /*
      xx dataset change, remove all demes and transmissions d3 added
      xx we could also make this smoother: http://bl.ocks.org/alansmithy/e984477a741bc56db5a5
      THE ABOVE IS NO LONGER TRUE: while App remounts, this is all getting nuked, so it doesn't matter.
      Here's what we were doing and might do again:

      // this.state.map && // we have a map
      // this.props.datasetGuid &&
      // nextProps.datasetGuid &&
      // this.props.datasetGuid !== nextProps.datasetGuid // and the dataset has changed
    */

    const mapIsDrawn = !!this.state.map;
    const geoResolutionChanged = this.props.geoResolution !== nextProps.geoResolution;

    // (this.props.colorBy !== nextProps.colorBy ||
    //   this.props.visibilityVersion !== nextProps.visibilityVersion ||
    //   this.props.colorScale.version !== nextProps.colorScale.version);

    if (
      mapIsDrawn &&
      geoResolutionChanged
    ) {
      this.state.d3DOMNode.selectAll("*").remove();

      /* clear references to the demes and transmissions d3 added */
      this.setState({
        boundsSet: false,
        demes: false,
        d3elems: null,
        latLongs: null,
      })
    }
  }
  respondToLeafletEvent(leafletEvent) {
    if (leafletEvent.type === "moveend") { /* zooming and panning */
      updateOnMoveEnd(this.state.d3elems, this.latLongs(), this.props.controls, this.props.nodes);
    }
  }
  getGeoRange() {
    const latitudes = [];
    const longitudes = [];
    for (let k in this.props.metadata.geo){
      for (let c in this.props.metadata.geo[k]){
        latitudes.push(this.props.metadata.geo[k][c].latitude);
        longitudes.push(this.props.metadata.geo[k][c].longitude);
      }
    }
    const maxLat = d3.max(latitudes);
    const minLat = d3.min(latitudes);
    const maxLng = d3.max(longitudes);
    const minLng = d3.min(longitudes);
    const lngRange = (maxLng - minLng)%360;
    const latRange = (maxLat - minLat);
    const south = Math.max(-80, minLat - latRange*0.2);
    const north = Math.min(80, maxLat + latRange*0.2);
    const east = Math.max(-180, minLng - lngRange*0.2);
    const west = Math.min(180, maxLng + lngRange*0.2);
    return [L.latLng(south,west), L.latLng(north, east)];
  }
  maybeUpdateDemesAndTransmissions(prevProps) {
    /* nothing to update */
    const noMap = !this.state.map;
    const noDemes = !this.state.demes;

    if (noMap || noDemes) return;

    const latLongs = this.latLongs();
    if (latLongs == null) return;

    if (
      this.props.visibilityVersion !== prevProps.visibilityVersion ||
      this.props.colorScale.version !== prevProps.colorScale.version
    ) {
      updateVisibility(this.state.d3elems, latLongs, this.props.controls, this.props.nodes);
    }
  }
  maybeAnimateDemesAndTransmissions() {
    /* todo */
  }
  latLongs() {
    if (this.props.nodes && this.props.visibility && this.props.metadata && this.state.map) {
      return getLatLongs(
        this.props.nodes,
        this.props.visibility,
        this.props.metadata,
        this.state.map,
        this.props.colorBy,
        this.props.geoResolution,
        this.props.colorScale,
        this.props.sequences,
        this.props.mapTriplicate,
      );
    } else {
      return null;
    }
  }
  getBounds() {
    let southWest;
    let northEast;

    /* initial map bounds */
    if (this.props.mapTriplicate === true) {
      southWest = L.latLng(-70, -540);
      northEast = L.latLng(80, 540);
    } else {
      southWest = L.latLng(-70, -180);
      northEast = L.latLng(80, 180);
    }

    const bounds = L.latLngBounds(southWest, northEast);

    return bounds;
  }
  createMap() {

    let zoom = 2;
    let center = [0,0];

    /******************************************
    * GET LEAFLET IN THE DOM
    *****************************************/

    var map = L.map('map', {
      center: center,
      zoom: zoom,
      scrollWheelZoom: false,
      maxBounds: this.getBounds(),
      minZoom: 2,
      maxZoom: 8,
      zoomControl: false,
      /* leaflet sleep see https://cliffcloud.github.io/Leaflet.Sleep/#summary */
      // true by default, false if you want a wild map
      sleep: false,
      // time(ms) for the map to fall asleep upon mouseout
      sleepTime: 750,
      // time(ms) until map wakes on mouseover
      wakeTime: 750,
      // defines whether or not the user is prompted oh how to wake map
      sleepNote: true,
      // should hovering wake the map? (clicking always will)
      hoverToWake: false
    })

    map.getRenderer(map).options.padding = 2;

    L.tileLayer('https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHJ2cmIiLCJhIjoiY2l1MDRoMzg5MDEwbjJvcXBpNnUxMXdwbCJ9.PMqX7vgORuXLXxtI3wISjw', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        // noWrap: true
    }).addTo(map);

    L.control.zoom({position: "bottomright"}).addTo(map);

    this.setState({map});
  }
  maybeCreateMapDiv() {
    let container = null;
    if (
      this.props.browserDimensions &&
      this.state.responsive
    ) {
      container = (
        <div style={{position: "relative"}}>
          <button style={{
              position: "absolute",
              left: 25,
              top: 25,
              zIndex: 9999,
              border: "none",
              width: 56,
              padding: 15,
              borderRadius: 4,
              backgroundColor: "rgb(124, 184, 121)",
              fontWeight: 700,
              color: "white",
            }}
          onClick={this.handleAnimationPlayPauseClicked.bind(this) }
            >
            {this.props.mapAnimationPlayPauseButton}
          </button>
          <button style={{
              position: "absolute",
              left: 90,
              top: 25,
              zIndex: 9999,
              border: "none",
              padding: 15,
              borderRadius: 4,
              backgroundColor: "rgb(230, 230, 230)",
              fontWeight: 700,
              color: "white"
            }}
          onClick={this.handleAnimationResetClicked.bind(this) }
            >
            Reset
          </button>
          <div style={{
              height: this.state.responsive.height,
              width: this.state.responsive.width
            }} id="map">
          </div>
        </div>
      )
    }
    return container;
  }
  handleAnimationPlayPauseClicked() {
    /******************************************
    * ANIMATE MAP (AND THAT LINE ON TREE)
    *****************************************/
    if (this.props.mapAnimationPlayPauseButton === "Play") {
      this.animateMap();
      this.props.dispatch({
        type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
        data: "Pause"
      });
    } else {
      clearInterval(window.NEXTSTRAIN.mapAnimationLoop)
      window.NEXTSTRAIN.mapAnimationLoop = null;
      this.props.dispatch({
        type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
        data: "Play"
      });
    }
  }

  resetAnimation() {
    clearInterval(window.NEXTSTRAIN.mapAnimationLoop);
    window.NEXTSTRAIN.mapAnimationLoop = null;
    this.props.dispatch(changeDateFilter(this.props.controls.absoluteDateMin, this.props.controls.absoluteDateMax));
    this.props.dispatch({
      type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
      data: "Play"
    });
  }

  handleAnimationResetClicked() {
    this.resetAnimation();
  }
  animateMap() {
    /* By default, start at absoluteDateMin; allow overriding via augur default export */

    // dates are num date format
    // leftWindow --- rightWindow ------------------------------- end
    // 2011.4 ------- 2011.6 ------------------------------------ 2015.4

    let leftWindow = calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.dateMin);
    let end = calendarToNumeric(this.props.dateFormat, this.props.dateScale, this.props.absoluteDateMax);
    let totalRange = end - leftWindow; // years in the animation

    let animationIncrement = (animationTick * totalRange) / this.props.mapAnimationDurationInMilliseconds; // [(ms * years) / ms] = years eg 100 ms * 5 years / 30,000 ms =  0.01666666667 years
    const windowRange = animationWindowWidth * totalRange;
    let rightWindow = leftWindow + windowRange;

    if (!window.NEXTSTRAIN) {
      window.NEXTSTRAIN = {}; /* centralize creation of this if we need it anywhere else */
    }

    /* we should setState({reference}) so that it's not possible to create multiple */

    window.NEXTSTRAIN.mapAnimationLoop = setInterval(() => {

      const newWindow = {min: numericToCalendar(this.props.dateFormat, this.props.dateScale, leftWindow),
        max: numericToCalendar(this.props.dateFormat, this.props.dateScale, rightWindow)};

      /* first pass sets the timer to absolute min and absolute min + windowRange because they reference above initial time window */
      this.props.dispatch(changeDateFilter(newWindow.min, newWindow.max));

      if (!this.props.mapAnimationCumulative) {
        leftWindow = leftWindow + animationIncrement;
      }
      rightWindow = rightWindow + animationIncrement;

      if (rightWindow >= end) {
        clearInterval(window.NEXTSTRAIN.mapAnimationLoop)
        window.NEXTSTRAIN.mapAnimationLoop = null;
        this.props.dispatch(changeDateFilter(this.props.absoluteDateMin, this.props.absoluteDateMax));
        this.props.dispatch({
          type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
          data: "Play"
        });
      }
    }, animationTick);

  }
  render() {
    // clear layers - store all markers in map state https://github.com/Leaflet/Leaflet/issues/3238#issuecomment-77061011
    return (
      <Card center title="Transmissions">
        {this.maybeCreateMapDiv()}
      </Card>
    );
  }
}

export default Map;
