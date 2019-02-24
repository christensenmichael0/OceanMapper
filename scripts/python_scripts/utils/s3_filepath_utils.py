import datetime
import mercantile

from utils.datasets import datasets

def build_file_path(model_top_level_folder, sub_resource, model_prefix_str, field_datetime, file_type, 
        scalar_tiles=True, vector_tiles=False, level=None):
    """
    build_file_path(model_top_level_folder, sub_resource, model_prefix_str, field_datetime, file_type, 
        scalar_tiles=True, vector_tiles=False, level=None)

    This function builds a s3 filepath
    -----------------------------------------------------------------------
    Inputs:

    model_top_level_folder (str) - the top level folder for a particular data source (i.e. GFS_WINDS)
    sub_resource (str) - the sub resource name (i.e. primary_wave_direction)
    model_prefix_str (str) - the model prefix used when composing a filename (i.e. gfs_winds)
    field_datetime (datetime.datetime) - a datetime object for a particular model time
    file_type (str) - the file type (i.e. json, pickle)
    scalar_tiles (bool) - whether or not to include a scalar tilepath
    vector_tiles (bool) - whether or not to include a vector tilepath
    level (str): the model level formatted str (i.e. 10m)
    -----------------------------------------------------------------------
    Output: (str) - the output s3 filepath and tilepaths (scalar and vector - if available)
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 09/23/2018
    """

    formatted_folder_date = datetime.datetime.strftime(field_datetime,'%Y%m%d_%H')
    output_tilepaths = {'scalar': '', 'vector': ''}

    if level:
        output_filepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            sub_resource + '/' + level + '/' + file_type + '/' + model_prefix_str + '_' +
            formatted_folder_date + '.' + file_type)
        
        scalar_tilepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            sub_resource + '/' + level + '/tiles/scalar/{z}/{x}/{y}.png') if scalar_tiles else None

        vector_tilepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            sub_resource + '/' + level + '/tiles/vector/{z}/{x}/{y}.png') if vector_tiles else None

    else:
        output_filepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            sub_resource + '/' + file_type + '/' + model_prefix_str + '_' + formatted_folder_date +
             '.' + file_type)

        scalar_tilepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            sub_resource + '/tiles/scalar/{z}/{x}/{y}.png') if scalar_tiles else None

        vector_tilepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            sub_resource + '/tiles/vector/{z}/{x}/{y}.png') if vector_tiles else None

    output_tilepaths['scalar'] = scalar_tilepath
    output_tilepaths['vector'] = vector_tilepath

    return output_filepath, output_tilepaths


def build_tiledata_path(model_top_level_folder, sub_resource, level, field_datetime, coords, override_zoom = None):
    """
    build_tiledata_path(model_top_level_folder, sub_resource, field_datetime, coords, override_zoom = None)

    This function builds a s3 filepath to a subsetted 'tile' dataset
    -----------------------------------------------------------------------
    Inputs:

    model_top_level_folder (str) - the top level folder for a particular data source (i.e. GFS_WINDS)
    sub_resource (str) - the sub resource name (i.e. primary_wave_direction)
    level (str): the model level formatted str (i.e. 10m)
    field_datetime (datetime.datetime) - a datetime object for a particular model time
    coords (array) - [longitude, latitude] coordinates
    override_zoom (int) - used to specifying building a tile data path with a specific zoom

    -----------------------------------------------------------------------
    Output: (str) - the output s3 filepath to a specific data 'tile' 
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 02/21/2019
    """

    formatted_folder_date = datetime.datetime.strftime(field_datetime,'%Y%m%d_%H')

    # override zoom is used when specifying a specific zoom to use as is the case when building tile images on the fly
    if override_zoom:
        available_zoom = override_zoom
    else:
        available_zoom = datasets[model_top_level_folder]['sub_resource'][sub_resource]['data_tiles_zoom_level']
    
    parent_tile = mercantile.tile(coords[0], coords[1], available_zoom, truncate=False)
    i,j,zoom=[*parent_tile]

    tile_folder_str = '{0}/{1}/{2}'.format(zoom, i, j)
    
    # build tiledata path given the x,y,z coords of the parent tile
    if level:
        output_filepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            sub_resource + '/' + level + '/tiles/data/' + tile_folder_str + '.pickle')
    else:
        output_filepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            sub_resource + '/tiles/data/' + tile_folder_str + '.pickle')

    return output_filepath
