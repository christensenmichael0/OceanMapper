// getCapabilities
// https://gis.boem.gov/arcgis/services/BOEM_BSEE/MMC_Layers/MapServer/WMSServer?request=GetCapabilities&service=WMS

// Interactive Mapper
// https://www.arcgis.com/home/webmap/viewer.html?url=https%3A%2F%2Fgis.boem.gov%2Farcgis%2Frest%2Fservices%2FBOEM_BSEE%2FMMC_Layers%2FMapServer&source=sd

// General info
// https://gis.boem.gov/arcgis/rest/services/BOEM_BSEE/MMC_Layers/MapServer

url="https://gis.boem.gov/arcgis/services/BOEM_BSEE/MMC_Layers/MapServer/WmsServer"

// BOEM OCS Protraction Diagrams & Leasing Maps
var blocks = L.tileLayer.wms(url, {
    layers: '19',
    format: 'image/png',
    transparent: true,
});

// BOEM OCS Lease Blocks
var blocks = L.tileLayer.wms(url, {
    layers: '18',
    format: 'image/png',
    transparent: true,
});


var blah = L.tileLayer.wms(WMS_URL_GOES_HERE, {
    layers: '19',
    format: 'image/png',
    transparent: true,
});

dpi=96&transparent=true&format=png32&layers=show:10&bbox=-10523851.691018326,2808217.931080385,-9596823.411975956,3557912.3045011945&bboxSR=102100&imageSR=102100&size=758,613&f=image

new_url='https://gis.boem.gov/arcgis/rest/services/BOEM_BSEE/MMC_Layers/MapServer/export'

var blah = L.tileLayer.wms(new_url, {
    layers: 'show:10',
    format: 'png32',
    transparent: true,
});



// TODO the function to build the url only cares about the inputs.. width, height, LL_corner, UR_corner

var mapBounds = map.getBounds();
   
max_lat = map.getBounds()._northEast.lat
min_lat = map.getBounds()._southWest.lat
min_lon = map.getBounds()._southWest.lng
max_lon = map.getBounds()._northEast.lng

ne_corner = L.latLng(max_lat, max_lon);
se_corner = L.latLng(min_lat, max_lon);
sw_corner = L.latLng(min_lat, min_lon);
nw_corner = L.latLng(max_lat, min_lon);

ll = L.CRS.EPSG3857.project(sw_corner);
ur = L.CRS.EPSG3857.project(ne_corner);

let imageBounds = [[min_lat,min_lon],[max_lat,max_lon]]
    
width = document.getElementById('map').clientWidth
height = document.getElementById('map').clientHeight

let imageUrl = `https://gis.boem.gov/arcgis/rest/services/BOEM_BSEE/MMC_Layers/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:10&bbox=${ll.x},${ll.y},${ur.x},${ur.y}&bboxSR=102100&imageSR=102100&size=${width},${height}&f=image`;

L.imageOverlay(imageUrl, imageBounds).addTo(map);

// let testImg = https://gis.boem.gov/arcgis/rest/services/BOEM_BSEE/MMC_Layers/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:10&bbox=-10523851.691018326,2808217.931080385,-9596823.411975956,3557912.3045011945&bboxSR=102100&imageSR=102100&size=758,613&f=image

