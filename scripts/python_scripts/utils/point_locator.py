import fiona
from shapely import geometry
from shapely.prepared import prep


with fiona.open("ne_10m_ocean/ne_10m_ocean.shp") as fiona_collection:

    # In this case, we'll assume the shapefile only has one record/layer (e.g., the shapefile
    # is just for the borders of a single country, etc.).

    shapefile_record = fiona_collection.next()
    import pdb; pdb.set_trace()

    #TODO: deal with null island
    print(shapefile_record['properties']['featurecla'])

    # Use Shapely to create the polygon
    shape = geometry.asShape( shapefile_record['geometry'] )

    point = geometry.Point(0, 0) # longitude, latitude

    # Alternative: if point.within(shape)
    if shape.contains(point):
        print("In OCEAN!!")