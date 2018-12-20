// getCapabilities
// https://gis.boem.gov/arcgis/services/BOEM_BSEE/MMC_Layers/MapServer/WMSServer?request=GetCapabilities&service=WMS

// Interactive Mapper
// https://www.arcgis.com/home/webmap/viewer.html?url=https%3A%2F%2Fgis.boem.gov%2Farcgis%2Frest%2Fservices%2FBOEM_BSEE%2FMMC_Layers%2FMapServer&source=sd

// General info
// https://gis.boem.gov/arcgis/rest/services/BOEM_BSEE/MMC_Layers/MapServer

"https://gis.boem.gov/arcgis/services/BOEM_BSEE/MMC_Layers/MapServer/WmsServer"

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