SOTE.namespace("SOTE.widget.MapSote");


/**
  * Instantiate the map;  subclass of SOTE.widget.Map that is SOTE-specific
  *   
  *
  * @class Instantiates a map projection layered with images retrieved from the specified client
  *     derived from the given bounding box, date, and data product
  * @constructor
  * @this {map}
  * @param {String} containerId is the container id of the div in which to render the object 
  * @param {Object} [config] is a hash allowing configuration of this component
  * @config {boolean} [hasControls] whether or not the produced map should have zoom and pan controls
  * @config {boolean} [isSelectable] whether or not a bounding box selection is allowed
  * @config {String} [bbox] the extent of the map as w,s,e,n
  * @augments SOTE.widget.Component
  * 
*/

SOTE.widget.MapSote = function(containerId, config)
{		
	// ie,  super(containerId, config);
	SOTE.widget.Map.call(this,containerId, config);
	
	// Load SOTE-specific data into MapSote
	//this.isSoteMapDataCached = false;
	//this.updateComponent("");
	
	// Init
	this.isLayerCachingEnabled = false;
	this.terribleQsSaver = "";
	this.terribleQsSaverJustSet = false;
	
	this.setExtent(this.bbox);
	
	// Register callbacks for when movement begins and zoom ends
	this.map.events.register("movestart", this, this.handleMapMoveStart);
	this.map.events.register("zoomend", this, this.handleMapZoomEnd);  
	
	// Force "zoom end" for widget init
	this.handleMapZoomEnd(null);
	
};


SOTE.widget.MapSote.prototype = new SOTE.widget.Map;


/**
 * Sets whether the existing time steps (ie layers) are allowed to remain enabled/active even if that
 * particular time step isn't selected - the layer's opacity is simply reduced to 0;  this
 * is necessary to enable instantaneous switching between time steps instead of needing to
 * reload the data on every time change.  It becomes a burden when panning/zooming, though, so
 * this function should be used carefully.
 * 
 * @param {boolean}		true to enable caching
 */
SOTE.widget.MapSote.prototype.setLayerCaching = function(enable)
{
	this.isLayerCachingEnabled = enable;
}


/**
 * OpenLayers callback that's called as soon as user begins moving the map;  currently used to 
 * disable layer caching
 */
SOTE.widget.MapSote.prototype.handleMapMoveStart = function(evt)
{
	// Disable map caching after pan/zoom
	this.setLayerCaching(false);
	
	// TODO: Set only active time step(s) to be enabled 
	// Currently:  this terrible hack
	if (this.terribleQsSaver != "")
	{
		this.terribleQsSaverJustSet = true;
		this.updateComponent(this.terribleQsSaver);
	}
	
}

/**
 * OpenLayers callback that's called whenever a zoom action ends;  currently used to 
 * update zoom button opacity if at limits of zoom levels
 */
SOTE.widget.MapSote.prototype.handleMapZoomEnd = function(evt)
{
	// "Disable" zoom in icon if zoomed to highest level
	// TODO: fix "color" updates since they don't currently have an effect
	if (this.map.zoom == this.map.numZoomLevels-1)
	{
		$('.olControlZoomInCustomItemInactive').css("background-color", "rgba(38,38,38,0.3)");
		$('.olControlZoomInCustomItemInactive').css("color", "#555555");
	}
	else
	{
		$('.olControlZoomInCustomItemInactive').css("background-color", "rgba(38,38,38,0.7)");
		$('.olControlZoomInCustomItemInactive').css("color", "#FFFFFF");
	}

	// "Disable" zoom out icon if zoomed to lowest level
	if (this.map.zoom == 0)
	{
		$('.olControlZoomOutCustomItemInactive').css("background-color", "rgba(38,38,38,0.3)");
		$('.olControlZoomOutCustomItemInactive').css("color", "#555555");
	}
	else
	{
		$('.olControlZoomOutCustomItemInactive').css("background-color", "rgba(38,38,38,0.7)");
		$('.olControlZoomOutCustomItemInactive').css("color", "#FFFFFF");
	}	
	
}

/**
  * Change the base layers based on dependencies (i.e. extent, date, data product)
  * 
  * Update component with QS.  
  * 
  * @this {map}
  * @param {String} querystring contains all values of dependencies (from registry)
  * @returns {boolean} true or false depending on if the component still validates with the new criteria
  * 
*/
SOTE.widget.MapSote.prototype.updateComponent = function(querystring)
{	
	// Load SOTE-specific map data if not already cached
	if (!this.isSoteMapDataCached)
	{
		// Define static layers
		var staticProductLayers = 
			[			
				{displayName: "population", wmsProductName: "population", time:"", format: "image/png", urls:["http://map1.vis.earthdata.nasa.gov/data/wms.cgi"], tileSize:[512,512], projection:"EPSG:4326", numZoomLevels:9, maxExtent:[-180,-1350,180,90], maxResolution:0.5625, preferredOpacity: 0.55 },
				{displayName: "grump-v1-population-count_2000", wmsProductName: "grump-v1-population-count_2000", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.55 },				
				{displayName: "ndh-cyclone-hazard-frequency-distribution", wmsProductName: "ndh-cyclone-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-cyclone-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-cyclone-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-cyclone-mortality-risks-distribution", wmsProductName: "ndh-cyclone-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-flood-hazard-frequency-distribution", wmsProductName: "ndh-flood-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-flood-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-flood-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-flood-mortality-risks-distribution", wmsProductName: "ndh-flood-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-drought-hazard-frequency-distribution", wmsProductName: "ndh-drought-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-drought-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-drought-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-drought-mortality-risks-distribution", wmsProductName: "ndh-drought-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-volcano-hazard-frequency-distribution", wmsProductName: "ndh-volcano-hazard-frequency-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-volcano-proportional-economic-loss-risk-deciles", wmsProductName: "ndh-volcano-proportional-economic-loss-risk-deciles", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "ndh-volcano-mortality-risks-distribution", wmsProductName: "ndh-volcano-mortality-risks-distribution", time:"", format: "image/png", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], projection:"EPSG:4326", preferredOpacity: 0.75 },
				{displayName: "fires24", wmsProductName: "fires24", time:"", urls:["http://firefly.geog.umd.edu/wms/wms?"], layers:"fires24", transparent:true, projection:"EPSG:4326", preferredOpacity: 1.0},
				{displayName: "fires48", wmsProductName: "fires48", time:"", urls:["http://firefly.geog.umd.edu/wms/wms?"], layers:"fires48", transparent:true, projection:"EPSG:4326", preferredOpacity: 1.0},
				{displayName: "cartographic:esri-administrative-boundaries_level-1", wmsProductName: "cartographic:esri-administrative-boundaries_level-1", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:esri-administrative-boundaries_level-1", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.55, bringToFront: true },
				{displayName: "cartographic:national-boundaries", wmsProductName: "cartographic:national-boundaries", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/ows"], layers:"cartographic:national-boundaries", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.55, bringToFront: true },
				{displayName: "gpw-v3-coastlines", wmsProductName: "gpw-v3-coastlines", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"gpw-v3-coastlines", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.85, bringToFront: true},
				{displayName: "cartographic:00-global-labels", wmsProductName: "cartographic:00-global-labels", time:"", urls:["http://sedac.ciesin.columbia.edu/geoserver/wms?"], layers:"cartographic:00-global-labels", transparent:true, projection:"EPSG:4326", preferredOpacity: 0.95, bringToFront: true }
			];

		// Generate a layer for each product for each day, then concatenate with static layer array
		var NUM_DAYS_TO_GENERATE = 8;
		this.soteMapData = staticProductLayers.concat(
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_CorrectedReflectance_TrueColor", "MODIS_Terra_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_SurfaceReflectance_Bands143", "MODIS_Terra_SurfaceReflectance_Bands143", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_CorrectedReflectance_TrueColor", "MODIS_Aqua_CorrectedReflectance_TrueColor", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_SurfaceReflectance_Bands143", "MODIS_Aqua_SurfaceReflectance_Bands143", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_CorrectedReflectance_Bands721", "MODIS_Terra_CorrectedReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_CorrectedReflectance_Bands721", "MODIS_Aqua_CorrectedReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_SurfaceReflectance_Bands721", "MODIS_Terra_SurfaceReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_SurfaceReflectance_Bands721", "MODIS_Aqua_SurfaceReflectance_Bands721", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_CorrectedReflectance_Bands367", "MODIS_Terra_CorrectedReflectance_Bands367", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_SurfaceReflectance_Bands121", "MODIS_Terra_SurfaceReflectance_Bands121", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_SurfaceReflectance_Bands121", "MODIS_Aqua_SurfaceReflectance_Bands121", "image/jpeg", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),

			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Snow_Cover", "MODIS_Terra_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Snow_Cover", "MODIS_Aqua_Snow_Cover", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),			
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Sea_Ice", "MODIS_Terra_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Sea_Ice", "MODIS_Aqua_Sea_Ice", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),			
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Land_Surface_Temp_Day", "MODIS_Terra_Land_Surface_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Land_Surface_Temp_Day", "MODIS_Aqua_Land_Surface_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Land_Surface_Temp_Night", "MODIS_Terra_Land_Surface_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Land_Surface_Temp_Night", "MODIS_Aqua_Land_Surface_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Brightness_Temp_Band31_Day", "MODIS_Terra_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Brightness_Temp_Band31_Day", "MODIS_Aqua_Brightness_Temp_Band31_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Brightness_Temp_Band31_Night", "MODIS_Terra_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Brightness_Temp_Band31_Night", "MODIS_Aqua_Brightness_Temp_Band31_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),									
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Aerosol", "MODIS_Terra_Aerosol", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Aerosol", "MODIS_Aqua_Aerosol", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Water_Vapor_5km_Day", "MODIS_Terra_Water_Vapor_5km_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Water_Vapor_5km_Day", "MODIS_Aqua_Water_Vapor_5km_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Water_Vapor_5km_Night", "MODIS_Terra_Water_Vapor_5km_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Water_Vapor_5km_Night", "MODIS_Aqua_Water_Vapor_5km_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Cloud_Top_Pressure_Day", "MODIS_Terra_Cloud_Top_Pressure_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Cloud_Top_Pressure_Day", "MODIS_Aqua_Cloud_Top_Pressure_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Cloud_Top_Pressure_Night", "MODIS_Terra_Cloud_Top_Pressure_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Cloud_Top_Pressure_Night", "MODIS_Aqua_Cloud_Top_Pressure_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Cloud_Top_Temp_Day", "MODIS_Terra_Cloud_Top_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Cloud_Top_Temp_Day", "MODIS_Aqua_Cloud_Top_Temp_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Terra_Cloud_Top_Temp_Night", "MODIS_Terra_Cloud_Top_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("MODIS_Aqua_Cloud_Top_Temp_Night", "MODIS_Aqua_Cloud_Top_Temp_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
						
			SOTE.util.generateProductLayersForDateRange("AIRS_Dust_Score", "AIRS_Dust_Score", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_CO_Total_Column_Day", "AIRS_CO_Total_Column_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_CO_Total_Column_Night", "AIRS_CO_Total_Column_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_SO2_Index_Day", "AIRS_SO2_Index_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_SO2_Index_Night", "AIRS_SO2_Index_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_Prata_SO2_Index_Day", "AIRS_Prata_SO2_Index_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_Prata_SO2_Index_Night", "AIRS_Prata_SO2_Index_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_Precipitation_Day", "AIRS_Precipitation_Day", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("AIRS_Precipitation_Night", "AIRS_Precipitation_Night", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			
			SOTE.util.generateProductLayersForDateRange("OMI_Cloud_Pressure", "OMI_Cloud_Pressure", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("OMI_Aerosol_Index", "OMI_Aerosol_Index", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("OMI_Aerosol_Optical_Depth", "OMI_Aerosol_Optical_Depth", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("OMI_Absorbing_Aerosol_Optical_Depth", "OMI_Absorbing_Aerosol_Optical_Depth", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("OMI_SO2_Lower_Troposphere", "OMI_SO2_Lower_Troposphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("OMI_SO2_Middle_Troposphere", "OMI_SO2_Middle_Troposphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("OMI_SO2_Upper_Troposphere_and_Stratosphere", "OMI_SO2_Upper_Troposphere_and_Stratosphere", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE),
			SOTE.util.generateProductLayersForDateRange("OMI_SO2_Planetary_Boundary_Layer", "OMI_SO2_Planetary_Boundary_Layer", "image/png", ["http://map1a.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1b.vis.earthdata.nasa.gov/data/wms.cgi", "http://map1c.vis.earthdata.nasa.gov/data/wms.cgi"], [512,512], "EPSG:4326", 9, [-180,-1350,180,90], 0.5625, 1.0, NUM_DAYS_TO_GENERATE)
			);

			
		// Load into map
		this.addLayers(this.soteMapData);
		
		// Update flag upon successful load
		this.isSoteMapDataCached = true;
	}
	

	// Parse querystring 
	var qs = (querystring === undefined)? "":querystring;
	
	// Return now if querystring is empty
	if (qs == "")
		return;
		
		
	// Enable layer caching since time has presumably been updated
	// TODO: fix this terrible hack
	if (!this.terribleQsSaverJustSet)
	{
		this.setLayerCaching(true);
	}
	else
	{
		this.terribleQsSaverJustSet = false;
	} 
		
	
	var activeLayers = SOTE.util.extractFromQuery("products", qs);
	var activeTransition = SOTE.util.extractFromQuery("transition", qs);
	var activeTime = SOTE.util.extractFromQuery("time", qs);
	
	
	// Apply querystring request to map
	
	// Extract the baselayer and overlays
	var activeLayerNames = new Array();
	if (activeLayers != ""){
		var a = activeLayers.split(".");
		for(var i=1; i<a.length; ++i){
			activeLayerNames.push(a[i]);
		}
		
	}
	if ((activeLayerNames == null) || (activeLayerNames.length < 1))
	{
		//alert("No products provided in querystring to soteMap class");
		return; 
	}

	// Determine appropriate layer opacities based on currently-selected time
	
	// Parse and validate time qs
	var timeArray = null;
	if (activeTime != "")
		timeArray = activeTime.split(/T/);
	if ((timeArray == null) || (timeArray.length != 2))
	{
		alert("Invalid or no time provided in querystring to soteMap class;  needs to be of the format YYYY-MM-DDTHH:MM:SS");
		return;
	}
	
	// Parse date and time from qs
	var yyyymmdd = timeArray[0];
	var hhmmss = timeArray[1];
	
	// Parse elements of date and time
	var year = yyyymmdd.split("-")[0];
	var month = yyyymmdd.split("-")[1];
	var day = yyyymmdd.split("-")[2];
	var hour = hhmmss.split(":")[0];
	var minute = hhmmss.split(":")[1];
	var second = hhmmss.split(":")[2];
	
	// Compute most relevant two time steps
	var t0 = new String(yyyymmdd);
	var t1Date = Date.parse(t0).add(1).days();
	var t1 = new String(t1Date.getFullYear() + "-" + SOTE.util.zeroPad(t1Date.getMonth()+1,2) + "-" + SOTE.util.zeroPad(t1Date.getDate(), 2));
	
	// Compute the fractional time of day
	var fracTimeOfDay = hour/24.0 + minute/1440.0 + second/86400.0;
	
	// TODO: fix this
	// Hack to store current querystring
	this.terribleQsSaver = qs;

	
	// Determine transition type and manipulate layers appropriately
	if (activeTransition == "standard")
	{
		// Don't do any fancy opacity adjustments, just show the date that's closest to time slider position
		var selectedDate = null;
//		if (fracTimeOfDay < 0.50)
			selectedDate = new String(t0);
//		else
//			selectedDate = new String(t1);
			
		// Enable layers of selected Date, disable the rest
		var allLayers = this.getAllLayers();
		var nLayers = allLayers.length;
		
		// Outer loop through all OpenLayers layers
		for (var i=0; i<nLayers; i++)
		{
			var layerModified = false;
			
			// Inner loop through all selected layers
			for (var j=0; j<activeLayerNames.length; j++)
			{
				// Enable this layer if string matches zzz
				if ((allLayers[i].name == new String(activeLayerNames[j] + "__" + selectedDate)) ||
				    (allLayers[i].name == new String(activeLayerNames[j])))
				{
					// Enable the layer
					allLayers[i].setVisibility(true);
					
						
					// Assume base layer is first element of product list and force it to have the lowest z-index
					// (a z-index of 0 is lowest, higher numbers are drawn on top)
					// Also: Set opacity to 1.0 for base layer, a fraction of it for overlays (until controls can be made)
					if (j==0)
					{
						this.map.setLayerZIndex(allLayers[i], 0);
						allLayers[i].setOpacity(1.0);
					}
					else
					{
						// Set Z-layering
						if (this.checkWmsParam(allLayers[i].metadata.bringToFront) && allLayers[i].metadata.bringToFront)
							this.map.setLayerZIndex(allLayers[i], nLayers-1);						
						
						// Set opacity
						if (this.checkWmsParam(allLayers[i].metadata.preferredOpacity))
							allLayers[i].setOpacity(allLayers[i].metadata.preferredOpacity);
						else
							allLayers[i].setOpacity(this.DEFAULT_OVERLAY_OPACITY);
					}
					
					layerModified = true;
				}
			}
			
			// Disable the layer if it hasn't been selected
			if (!layerModified)
			{
				if (!this.isLayerCachingEnabled)
					allLayers[i].setVisibility(false);
				allLayers[i].setOpacity(0.0);
				
				// Reset z-index?  (assume it is an overlay)
				//this.map.setLayerZIndex(allLayers[i], 1); 	
			}
		}
		
	}
	else if (activeTransition == "crossfade")
	{
		// Adjust layer opacities relative to how close the selected time is to the layer dates 
		alert("crossfade transition not yet supported");
		return;
	}
	 
	
};


