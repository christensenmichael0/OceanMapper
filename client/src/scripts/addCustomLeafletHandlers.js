// leaflet gateway
export const addCustomLeafletHandlers = (L) => {
  // const L = window.L;
  // add custom map event
  L.TimeseriesChartClickHandler = L.Handler.extend({
    addHooks: function() {
        L.DomEvent.on(window, 'timeSeriesClick', this._timeSeriesClick, this);
    },

    removeHooks: function() {
        L.DomEvent.off(window, 'timeSeriesClick', this._timeSeriesClick, this);
    },

    _timeSeriesClick: function(ev) {
        // Treat Gamma angle as horizontal pan (1 degree = 1 pixel) and Beta angle as vertical pan
        // this._map.panBy( L.point( ev.gamma, ev.beta ) );
        console.log(ev);
    }
  });

  L.Map.addInitHook('addHandler', 'timeSeriesClick', L.TimeseriesChartClickHandler);

  // return L
}

