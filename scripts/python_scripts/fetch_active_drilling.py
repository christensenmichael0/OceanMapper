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
import ioa
import os
import PIL

# import shapefile as shp  # Requires the pyshp package
# from descartes import PolygonPatch

from pathlib import Path
import pandas
import geopandas


#TODO import lease area shapefile and loop through looking for block initials and number.. find the cetroid of that..
# those are the coords.. save that lease block in a dict for quick lookup

# need to parse this pdf
# https://www.bsee.gov/sites/bsee.gov/files/weeklyreport/current_deepwater_activity_12-18-18.pdf

df = geopandas.read_file(layer['shapefile_path'])
trimmed_df = df[(get_min_zoom(df) <= zoom) & (df.geometry.notnull())]
# trimmed_df_reproject = trimmed_df.to_crs(epsg=3857)



for index, row in df_countries.iterrows():
  try:
    if row.NAME_EN and row.geometry.centroid.coords[0]:
      ax.text(row.geometry.centroid.coords[0][0],row.geometry.centroid.coords[0][1],row.NAME_EN, 
        ha='center', va='center', fontsize=4)
  except:
    continue
