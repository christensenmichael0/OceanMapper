from matplotlib import cm

cmap_config = {
    'wind_speed': {
        'color_map': cm.get_cmap('viridis'), 
        'data_range': [0,25],
        'interval': 1
    },
    'ocean_current_speed': {
        'color_map': cm.get_cmap('magma'), 
        'data_range': [0,2],
        'interval': 0.25
    },
    'sig_wave_height': {
        'color_map': cm.get_cmap('jet'), 
        'data_range': [0,11],
        'interval': 1
    },
    'primary_wave_dir': {
        'color_map': None, 
        'data_range': [None, None],
        'interval': None
    },
    'primary_wave_period': {
        'color_map': cm.get_cmap('cool'), 
        'data_range': [0,21],
        'interval': 1
    },
}