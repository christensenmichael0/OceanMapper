// leaflet gateway
export const addCustomLeafletHandlers = () => {
  const L = window.L;
  // add custom map event
  L.ChartClickHandler = L.Handler.extend({
    addHooks: function() {
        L.DomEvent.on(window, 'chartClick', this._chartClick, this);
    },

    removeHooks: function() {
        L.DomEvent.off(window, 'chartClick', this._chartClick, this);
    },

    _chartClick: function(ev) {
        // Treat Gamma angle as horizontal pan (1 degree = 1 pixel) and Beta angle as vertical pan
        // this._map.panBy( L.point( ev.gamma, ev.beta ) );
        console.log(ev);
    }
  });

  L.Map.addInitHook('addHandler', 'chartClick', L.ChartClickHandler);

  return L
}

