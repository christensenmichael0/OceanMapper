import boto3
import pickle
import datetime
import numpy as np
import mercantile
import os
import pyproj
from matplotlib import pyplot as plt, cm
import matplotlib.colors as colors
import cmocean
import copy
import io
import os
import PIL

# import shapefile as shp  # Requires the pyshp package
# from descartes import PolygonPatch

from pathlib import Path
import pandas
import geopandas

def make_tile_figure(height=256, width=256, dpi=256):
    """
    make_tile_figure(height=256, width=256, dpi=256)

    create a transparent figure with a specified width,
    height, and dpi with no x/y ticks and axis turned off

    Ouput: figure and axes object
    """

    fig = plt.figure(dpi=dpi, facecolor='none', edgecolor='none')
    fig.set_alpha(0)
    fig.set_figheight(height/dpi)
    fig.set_figwidth(width/dpi)
    figax = fig.add_axes([0., 0., 1., 1.], xticks=[], yticks=[])
    figax.set_axis_off()
    
    return fig, figax

def get_min_zoom(series):
  if 'MIN_ZOOM' in series:
    min_zoom = series.MIN_ZOOM
  elif 'min_zoom' in series:
    min_zoom = series.min_zoom
  else:
    min_zoom = 0

  return min_zoom


layers = [
  {
    'name': 'offshore_wind_blocks',
    'shapefile_path': '/home/mchriste/shapefiles/BOEM_Lease_Areas_2_13_2019/BOEM_Lease_Areas_2_13_2019.shp',
    'linewidth': 0.9,
    'edgecolor': '#ff3300'
  }
]

# project to EPSG:3857 for plotting
EPSG3857 = pyproj.Proj(init='EPSG:3857')
tile_zoom_levels = range(3,9)

for zoom in tile_zoom_levels:
  # create the figure and axes
  fig, ax = make_tile_figure()
  ax.set_frame_on(False)
  ax.set_clip_on(False)
  ax.set_position([0, 0, 1, 1])
  
  # add layers to figure axes
  # import pdb; pdb.set_trace()
  for layer in layers:
    #read shapefile and make sure we dont have any missing values in geometry column
    df = geopandas.read_file(layer['shapefile_path'])
    
    trimmed_df = df[(get_min_zoom(df) <= zoom) & (df.geometry.notnull())]
    trimmed_df_reproject = trimmed_df.to_crs(epsg=3857)
    trimmed_df_reproject.plot(facecolor='none', edgecolor=layer['edgecolor'], linewidth=layer['linewidth'], ax=ax)

  # get list of all tiles for certain geographic extents and zoom
  tiles_gen = mercantile.tiles(west=-180, south=-89.9, east=180, north=89.9, zooms=zoom)
  tiles = [tile for tile in tiles_gen]
  # create and save tiles
  for tile_indx in range(0,len(tiles)):
    print('Working on {} of {}'.format(tile_indx,len(tiles)-1))
    tile = tiles[tile_indx]
    
    i,j,zoom=[*tile]
    ll = mercantile.bounds(i, j, zoom)

    _epsg_x_min, _epsg_y_min = EPSG3857(*ll[:2])
    _epsg_x_max, _epsg_y_max = EPSG3857(*ll[2:])
        
    # set x/y limits to match available tile extents
    ax.set_xlim(_epsg_x_min,_epsg_x_max)
    ax.set_ylim(_epsg_y_min, _epsg_y_max)
    
    filename = '{0}/{1}/{2}/{3}.png'.format('offshore_wind_leases_tiles', zoom, i, j)
    # import pdb; pdb.set_trace()

    if not os.path.exists(os.path.dirname(filename)):
        os.makedirs(os.path.dirname(filename))

    # only run during local testing
    dpi=256 # dpi for output tile

    fig.savefig(filename, dpi=dpi, pad_inches=0.0, transparent=True)

  # release memory
  plt.close()



# EXTRA -- HOW TO ADD LABELS --
# for index, row in df_countries.iterrows():
#   try:
#     if row.NAME_EN and row.geometry.centroid.coords[0]:
#       ax.text(row.geometry.centroid.coords[0][0],row.geometry.centroid.coords[0][1],row.NAME_EN, 
#         ha='center', va='center', fontsize=4)
#   except:
#     continue
