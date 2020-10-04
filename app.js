// when document loads make call to make markers async
$(document).ready(function () {
  "use strict";

  // On document load, make the markers (async function that queries for the coordinates from the API)
  makeMarkers();

  /**
   * The Globe encapsulates the WorldWindow object (wwd) and provides application
   * specific logic for interacting with layers.
   * @param {String} canvasId The ID of the canvas element that will host the globe
   * @returns {Globe}
   */
  class Globe {
    constructor(canvasId) {
      // Create a WorldWindow globe on the specified HTML5 canvas
      this.wwd = new WorldWind.WorldWindow(canvasId);

      // Holds the next unique id to be assigned to a layer
      this.nextLayerId = 1;

      // Add a BMNGOneImageLayer background layer. We're overriding the default
      // minimum altitude of the BMNGOneImageLayer so this layer always available.
      this.addLayer(new WorldWind.BMNGOneImageLayer(), {
        category: "background",
        minActiveAltitude: 0,
      });
    }

    /**
     * Adds a layer to the globe. Applies the optional options' properties to the
     * layer, and assigns the layer a unique ID and category.
     * @param {WorldWind.Layer} layer
     * @param {Object|null} options E.g., {category: "base", enabled: true}
     */
    addLayer(layer, options) {
      // Copy all properties defined on the options object to the layer
      if (options) {
        for (let prop in options) {
          if (!options.hasOwnProperty(prop)) {
            continue; // skip inherited props
          }
          layer[prop] = options[prop];
        }
      }
      // Assign a default category property if not already assigned
      if (typeof layer.category === "undefined") {
        layer.category = "overlay"; // the default category
      }

      // Assign a unique layer ID to ease layer management
      layer.uniqueId = this.nextLayerId++;

      // Add the layer to the globe
      this.wwd.addLayer(layer);
    }

    /**
     * Returns a new array of layers in the given category.
     * @param {String} category E.g., "base", "overlay" or "setting".
     * @returns {Array}
     */
    getLayers(category) {
      return this.wwd.layers.filter((layer) => layer.category === category);
    }
  }

  // Create a globe
  let globe = new Globe("globe-canvas");

  // Add layers to the globe
  globe.addLayer(new WorldWind.BMNGLayer(), {
    category: "base",
  });
  globe.addLayer(new WorldWind.CoordinatesDisplayLayer(globe.wwd), {
    category: "setting",
  });
  globe.addLayer(new WorldWind.ViewControlsLayer(globe.wwd), {
    category: "setting",
  });
  globe.addLayer(new WorldWind.CompassLayer(), {
    category: "setting",
    enabled: false,
  });
  globe.addLayer(new WorldWind.StarFieldLayer());

  globe.addLayer(new WorldWind.AtmosphereLayer());

  //create satellite layer

  /* var layer = new WorldWind.RenderableLayer("placeMarks");
  var placemark = new WorldWind.Placemark(
    new WorldWind.Position(100, 100, 300)
  );
  layer.addRenderable(placemark);
  globe.addRenderable(layer); */

  for (var l = 0; l < layers.length; l++) {
    layers[l].layer.enabled = layers[l].enabled;
    wwd.addLayer(layers[l].layer);
  }
  // Create the custom image for the placemark with a 2D canvas.
  var canvas = document.createElement("canvas"),
    ctx2d = canvas.getContext("2d"),
    size = 64,
    c = size / 2 - 0.5,
    innerRadius = 5,
    outerRadius = 20;

  canvas.width = size;
  canvas.height = size;

  var gradient = ctx2d.createRadialGradient(
    c,
    c,
    innerRadius,
    c,
    c,
    outerRadius
  );
  gradient.addColorStop(0, "rgb(255, 0, 0)");
  gradient.addColorStop(0.5, "rgb(0, 255, 0)");
  gradient.addColorStop(1, "rgb(255, 0, 0)");

  ctx2d.fillStyle = gradient;
  ctx2d.arc(c, c, outerRadius, 0, 2 * Math.PI, false);
  ctx2d.fill();

  // Set placemark attributes.
  var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
  // Wrap the canvas created above in an ImageSource object to specify it as the placemarkAttributes image source.
  placemarkAttributes.imageSource = new WorldWind.ImageSource(canvas);
  // Define the pivot point for the placemark at the center of its image source.
  placemarkAttributes.imageOffset = new WorldWind.Offset(
    WorldWind.OFFSET_FRACTION,
    0.5,
    WorldWind.OFFSET_FRACTION,
    0.5
  );
  placemarkAttributes.imageScale = 1;
  placemarkAttributes.imageColor = WorldWind.Color.WHITE;

  // Set placemark highlight attributes.
  // Note that the normal attributes are specified as the default highlight attributes so that all properties
  // are identical except the image scale. You could instead vary the color, image, or other property
  // to control the highlight representation.
  var highlightAttributes = new WorldWind.PlacemarkAttributes(
    placemarkAttributes
  );
  highlightAttributes.imageScale = 1.2;

  function queryCoords() {
    console.log("Querying coordinates...")
    return new Promise((resolve) => [
      setTimeout(() => {
        // TODO: Update the time parameters in this query
        // TODO: Allow for querying of EVERY satellite
        axios
          .get(
            `https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace/20200101T000000Z,20200102T001000Z/gse/`
          )
          .then(function (response) {
            console.log("Coords Response", response);                        
            resolve(response);
          })
          .catch(function (error) {
            console.log("error", error);
            return error;
          });
      }, 100),
    ]);
  }

  //! Dynamically assign placemarkers
  async function makeMarkers() {
    const coordsArray = await queryCoords(); //coordinate array
    console.log("Coords array:", coordsArray);
    for (let i = 0; i < coordsArray?.data?.Result?.Data[1].length; i++) {
      let lat = coordsArray.data?.Result?.Data[1][i]?.Coordinates[1][0].Latitude[1][0];
      let long = coordsArray.data?.Result?.Data[1][i]?.Coordinates[1][0].Longitude[1][0];
      console.log("Placing coordinates:", lat, long)
      var placemarkPosition = new WorldWind.Position(
        lat,
        long,
        1e2
      );
      var placemark = new WorldWind.Placemark(
        placemarkPosition,
        false,
        placemarkAttributes
      );

      // Draw placemark at altitude defined above, relative to the terrain.
      placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
      // Assign highlight attributes for the placemark.
      placemark.highlightAttributes = highlightAttributes;

      // Create the renderable layer for placemarks.
      var placemarkLayer = new WorldWind.RenderableLayer("Custom Placemark");

      // Add the placemark to the layer.
      placemarkLayer.addRenderable(placemark);

      // Add the placemarks layer to the WorldWindow's layer list.
      globe.wwd.addLayer(placemarkLayer);
    }
  }

  // Now set up to handle highlighting.
  var highlightController = new WorldWind.HighlightController(globe.wwd);

  // Auto-collapse the main menu when its button items are clicked
  $('.navbar-collapse a[role="button"]').click(function () {
    $(".navbar-collapse").collapse("hide");
  });

  // Collapse card ancestors when the close icon is clicked
  $(".collapse .close").on("click", function () {
    $(this).closest(".collapse").collapse("hide");
  });
});
