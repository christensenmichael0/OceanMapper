import mercantile
import geopandas
import pyproj
import matplotlib
matplotlib.use('agg')
from matplotlib import pyplot as plt
import io
import base64
from utils.tile_utils import make_tile_figure, get_min_zoom


# def get_min_zoom(series):
#   if 'MIN_ZOOM' in series:
#     min_zoom = series.MIN_ZOOM
#   elif 'min_zoom' in series:
#     min_zoom = series.min_zoom
#   else:
#     min_zoom = 0

#   return min_zoom

# def make_tile_figure(height=256, width=256, dpi=256):
#     """
#     make_tile_figure(height=256, width=256, dpi=256)

#     create a transparent figure with a specified width,
#     height, and dpi with no x/y ticks and axis turned off

#     Ouput: figure and axes object
#     """

#     fig = plt.figure(dpi=dpi, facecolor='none', edgecolor='none')
#     fig.set_alpha(0)
#     fig.set_figheight(height/dpi)
#     fig.set_figwidth(width/dpi)
#     figax = fig.add_axes([0., 0., 1., 1.], xticks=[], yticks=[])
#     figax.set_axis_off()

#     return fig, figax


def build_tile_from_shape(incoming_tile, shapefile_path, style={}):
    """
    build_tile_from_shape(incoming_tile, shapefile_path,  config={})

    Create a single tile with specific styling for consumption in a map
    -----------------------------------------------------------------------
    Inputs:

    incoming_tile (mercantile.Tile): a mercanatile tile with z,x,y params
    shapefile_path (str): filepath or url to .zip folder
    additional_params (obj): an object containing additional config params which are used to override defaults
    -----------------------------------------------------------------------
    Ouput: base64 encoded image converted to a utf-8 string
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 03/28/2020
    """

    # override default config if necessary
    config = {'linewidth': 0.9,'edgecolor': '#ff3300'}
    config.update(style)

    # deconstruct incoming tile
    i,j,zoom=[*incoming_tile]

    # create the figure and axes
    fig, ax = make_tile_figure()
    ax.set_frame_on(False)
    ax.set_clip_on(False)
    ax.set_position([0, 0, 1, 1])

    # project to EPSG:3857 for plotting
    EPSG3857 = pyproj.Proj(init='EPSG:3857')
  

    #read shapefile and make sure we dont have any missing values in geometry column
    df = geopandas.read_file(shapefile_path)
    
    trimmed_df = df[(get_min_zoom(df) <= zoom) & (df.geometry.notnull())]
    trimmed_df_reproject = trimmed_df.to_crs(epsg=3857)
    trimmed_df_reproject.plot(facecolor='none', edgecolor=config['edgecolor'], linewidth=config['linewidth'], ax=ax)

    # get extents of incoming tile and crop accordingly
    ll = mercantile.bounds(i, j, zoom)

    _epsg_x_min, _epsg_y_min = EPSG3857(*ll[:2])
    _epsg_x_max, _epsg_y_max = EPSG3857(*ll[2:])
    
    # set x/y limits to match available tile extents
    ax.set_xlim(_epsg_x_min,_epsg_x_max)
    ax.set_ylim(_epsg_y_min, _epsg_y_max)

    # convert image into base64 encoded string
    dpi = 256
    with io.BytesIO() as out_img:
        # fig.savefig(out_img, format='png', dpi=dpi, pad_inches=0.0, transparent=True)
        fig.savefig(out_img, format='png', transparent=True)
        out_img.seek(0)
        encoded_img = base64.b64encode(out_img.read()).decode('utf-8')

    return encoded_img

     