import datetime

def build_file_path(model_top_level_folder, model_prefix_str, field_datetime, file_type, 
        scalar_tiles=True, vector_tiles=False, level=None):
    """
    build_file_path(model_top_level_folder, model_prefix_str, field_datetime, file_type, 
        scalar_tiles=True, vector_tiles=False, level=None)

    This function builds a s3 filepath
    -----------------------------------------------------------------------
    Inputs:

    model_top_level_folder (str) - the top level folder for a particular data source (i.e. GFS_WINDS)
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
    Date Modified: 09/11/2018
    """

    formatted_folder_date = datetime.datetime.strftime(field_datetime,'%Y%m%d_%H')
    output_tilepaths = {'scalar': '', 'vector': ''}

    if level:
        output_filepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            level + '/' + file_type + '/' + model_prefix_str + '_' + 
            formatted_folder_date + '.' + file_type)
        
        scalar_tilepath = (model_top_level_folder + '/' + formatted_folder_date + '/' + level + 
            '/tiles/scalar/{z}/{x}/{y}.png') if scalar_tiles else None

        vector_tilepath = (model_top_level_folder + '/' + formatted_folder_date + '/' + level + 
            '/tiles/vector/{z}/{x}/{y}.png') if vector_tiles else None

    else:
        output_filepath = (model_top_level_folder + '/' + formatted_folder_date + '/' +
            file_type + '/' + model_prefix_str + '_' + formatted_folder_date + '.' +
            file_type)

        scalar_tilepath = (model_top_level_folder + '/' + formatted_folder_date +
            '/tiles/scalar/{z}/{x}/{y}.png') if scalar_tiles else None

        vector_tilepath = (model_top_level_folder + '/' + formatted_folder_date +
            '/tiles/vector/{z}/{x}/{y}.png') if vector_tiles else None

    output_tilepaths['scalar'] = scalar_tilepath
    output_tilepaths['vector'] = vector_tilepath

    return output_filepath, output_tilepaths
