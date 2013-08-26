/*
 * NASA Worldview
 * 
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project. 
 *
 * Copyright (C) 2013 United States Government as represented by the 
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */
Worldview.namespace("DataDownload");

Worldview.DataDownload.MapController = function(model, maps, config) {
    
    var ns = Worldview.DataDownload;
    var log = Logging.getLogger("Worldview.DataDownload");
    
    var self = {};
    var results = [];

    var selectionLayers = ns.Layers.Selection(model, maps, config);
    var swathLayers = ns.Layers.Swath(model, maps, config);
    var gridLayers = ns.Layers.Grid(model, maps, config);
    var hoverLayers = ns.Layers.Hover(model, maps, config);        
    var buttonLayers = ns.Layers.Button(model, maps, config);
    var maskLayers = ns.Layers.QueryMask(model, maps, config);
                   
    var init = function() {        
        model.events
            .on("query", clear)
            .on("queryResults", onQueryResults)
            .on("projectionUpdate", onProjectionUpdate)
            .on("deactivate", onDeactivate)    
            .on("activate", update);  
            
        buttonLayers.events
            .on("hoverover", function(event) {
                hoverLayers.hoverOver(event.feature);
            })
            .on("hoverout", function() {
                hoverLayers.hoverOut();
            });
    };
    
    var onQueryResults = function(newResults) {
        update(newResults);
    };
    
    var update = function(newResults) {
        if ( newResults ) {
            results = newResults;
        }
        swathLayers.update(results);
        gridLayers.update(results);
        buttonLayers.update(results);  
        maskLayers.update(results);
    }
                
    var onProjectionUpdate = function() {
        update();
    };
    
    var onDeactivate = function() {
        selectionLayers.dispose();
        swathLayers.dispose();
        gridLayers.dispose();
        hoverLayers.dispose();
        buttonLayers.dispose();
        maskLayers.dispose();
    };
        
    var clear = function() {
        selectionLayers.clear();
        swathLayers.clear();
        gridLayers.clear();
        hoverLayers.clear();
        buttonLayers.clear();
        maskLayers.clear();
    };
    
    init();
    return self;
}