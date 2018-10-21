import fiona
from shapely import geometry

def in_ocean(point_lon,point_lat):
    """
    in_ocean(point_lon,point_lat)

    This function determines if a provided point is in the ocean
    -----------------------------------------------------------------------
    Inputs:

    point_lon (float) - the coordinate longitude
    point_lat (float) - the coordinate latitude
    -----------------------------------------------------------------------
    Output: (bool) - true/false
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 09/23/2018
    """

    coord_in_ocean = False
    with fiona.open("utils/ne_10m_ocean/ne_10m_ocean.shp") as fiona_collection:

        shapefile_record = fiona_collection.next()

        #TODO: deal with null island
        # need to create a 1km square island

        # Use Shapely to create the polygon
        shape = geometry.asShape( shapefile_record['geometry'] )

        point = geometry.Point(point_lon, point_lat) # longitude, latitude

        # Alternative: if point.within(shape)
        if shape.contains(point):
            coord_in_ocean = True

    return coord_in_ocean