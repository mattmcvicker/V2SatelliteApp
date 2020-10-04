// when document loads make call to make markers async
$(document).ready(function () {
  "use strict";

  // On document load, make the markers (async function that queries for the coordinates from the API)
  makeMarkers();
  var satelliteData = null
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
      // this.wwd.addEventListener("mousemove", function() {
      //   console.log("FUCK YEAH ITS FUCKING WORKING FUCKIGN BITCH LEGTS")
      // });
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
  console.log(globe.wwd)
  var storeMarkers = []
  var clickRecognizer = new WorldWind.ClickRecognizer(globe.wwd, function (recognizer) {
    handleClick(recognizer, storeMarkers);
  });
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
  gradient.addColorStop(1, "rgb(255, 213, 0)");
  gradient.addColorStop(1, "rgb(255, 0, 0)");

  ctx2d.fillStyle = gradient;
  ctx2d.arc(c, c, outerRadius, 0, 2 * Math.PI, false);
  ctx2d.fill();





  function querySatellites() {
    console.log("Querying satellite names...")
    return new Promise((resolve) => [
      setTimeout(() => {
        axios
          .get("https://sscweb.gsfc.nasa.gov/WS/sscr/2/observatories")
          .then(function (response) {
            console.log("Satellite Names Response:", response);
            let formattedIds = [];
            let formattedNames = [];
            for (let i = 0; i < response?.data?.Observatory[1].length; i++) {
              formattedIds.push(response?.data?.Observatory[1][i]?.Id);
              formattedNames.push(response?.data?.Observatory[1][i]?.Name);
            }
            if (formattedNames.length !== 0 && formattedIds.length !== 0) {
              let Ids_and_Names_Response = ["", ""];
              Ids_and_Names_Response[0] = formattedIds;
              Ids_and_Names_Response[1] = formattedNames;
              resolve(Ids_and_Names_Response);
            } else {
              resolve("Error getting names")
            }
          })
          .catch(function (error) {
            console.log("error", error);
            resolve(error);
          });
      }, 100),
    ]);
  }


  function queryCoords(Ids) {
    console.log("Querying coordinates...", Ids);
    return new Promise((resolve) => [
      setTimeout(() => {
        // TODO: Update the time parameters in this query
        // TODO: Allow for querying of EVERY satellite        
        axios
          .get(
            `https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/${Ids}/20190101T000000Z,20190102T001000Z/gse/`
          )
          .then(function (response) {
            console.log("Coords Response", response);
            resolve(response);
          })
          .catch(function (error) {
            console.log("error", error);
            resolve(error);
          });
      }, 100),
    ]);
  }

  /* function getAltitude() {
    console.log("getting altitude...")
    return new Promise((resolve) => [
      setTimeout(() => {
        var xobj = new XMLHttpRequest();
        console.log(xobj)
        xobj.overrideMimeType("application/json");
        xobj.open('GET', './assets/officialNAME.json', true);
        console.log("open sesame")
        console.log("in function", xobj.readyState, xobj.status)

        console.log("Parsing JSON...")
        resolve(JSON.parse(xobj.responseText));


      }, 100)]);

  } */

  function getAltitude() {
    return new Promise((resolve) => [
      setTimeout(() => {
        let data = $.getJSON("./assets/officialNAME.json");
        console.log(data);
        resolve(data);
      }, 100)
    ])

  }

  function processAltitudes(altitudes) {
    return new Promise((resolve) => [
      setTimeout(() => {
        console.log("Altitudes:", altitudes ? altitudes["UCS-Satellite-Database-4-1-2020"] : "null");
        resolve(altitudes);
      }, 100)
    ])
  }

  function cleanData(namesArray, JSONData) {
    console.log("JSON DATA:", JSONData)
    return new Promise((resolve) => [
      setTimeout(() => {
        var set = new Set();
        let formattedJSON = [];
        let formattedNamesArray = [];
        let data = [];
        let Ids = [];
        // purge data and delete unused JSON entries
        // to lowercase everything and remove spaces and dashes

        for (let i = 0; i < namesArray[1].length; i++) {
          let lowercase = namesArray[1][i].toLowerCase();
          let removeDashes = lowercase.replace(/-|\s/g, "");
          let removeUnderscore = removeDashes.replace(/_/g, "");
          formattedNamesArray.push(removeUnderscore);
          set.add(removeUnderscore, namesArray[0][i]);
        }

        for (let i = 0; i < JSONData["UCS-Satellite-Database-4-1-2020"].length; i++) {
          if (JSONData["UCS-Satellite-Database-4-1-2020"][i]["Current Official Name of Satellite"]) {
            let lowercase = JSONData["UCS-Satellite-Database-4-1-2020"][i]["Current Official Name of Satellite"].toLowerCase();
            let removeDashes = lowercase.replace(/-|\s/g, "");
            let removeUnderscore = removeDashes.replace(/_/g, "");
            formattedJSON.push(removeUnderscore);
            // TODO: Find a better way to have proper IDs and time codes for the queries
            if (set.has(removeUnderscore) && removeUnderscore !== "xmmnewton") {
              data.push(JSONData["UCS-Satellite-Database-4-1-2020"][i]);
              if (set.has(removeUnderscore)) {
                Ids.push(removeUnderscore);
              }
            }
          }
        }

        console.log(data, Ids);
        let formattedData = [data, Ids];

        resolve(formattedData);
      }, 100)
    ])
  }

  //! Dynamically assign placemarkers
  async function makeMarkers() {
    const altitudes = await getAltitude();
    const altitudeValues = await processAltitudes(altitudes);
    const satelliteNames = await querySatellites();
    const purgeData = await cleanData(satelliteNames, altitudeValues);
    satelliteData = purgeData;
    console.log("PURGE DATA:", purgeData);
    //! purgeData[0] has all the JSON objects with needed info
    //! purgeData[1] has all the Ids of those satellites so we can query them in coordinates
    // satelliteNames returns a nested array with the ids and names for all of the satellites
    console.log("SATELLITE NAMES:", satelliteNames);
    //* @param satelliteNames[0] is an array with all satellite Ids (need these to query coordinates)
    const coordsArray = await queryCoords(purgeData[1]); //coordinate array
    console.log("Coords array:", coordsArray);
    for (let i = 0; i < coordsArray?.data?.Result?.Data[1].length; i++) {
      //! Set placemark attributes. Declared inside for loop so each satellite can have unique properties
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
      placemarkAttributes.imageScale = 15;
      placemarkAttributes.imageColor = WorldWind.Color.YELLOW;
      //* @param satelliteNames[1] is an array with all satellite names
      placemarkAttributes.label = purgeData[0][i]["Current Official Name of Satellite"];

      //! Set placemark highlight attributes. Done inside for loop so each satellite can have unique highlight properties
      // Note that the normal attributes are specified as the default highlight attributes so that all properties
      // are identical except the image scale. You could instead vary the color, image, or other property
      // to control the highlight representation.
      var highlightAttributes = new WorldWind.PlacemarkAttributes(
        placemarkAttributes
      );

      highlightAttributes.imageScale = 20;
      highlightAttributes.imageColor = WorldWind.Color.RED;


      let lat = coordsArray.data?.Result?.Data[1][i]?.Coordinates[1][0]?.Latitude[1][0];
      let long = coordsArray.data?.Result?.Data[1][i]?.Coordinates[1][0]?.Longitude[1][0];
      let name = coordsArray.data?.Result?.Data[1][i]?.Id;

      console.log("Placemark attributes;", placemarkAttributes);

      // console.log("Placing coordinates:", lat, long)
      var placemarkPosition = new WorldWind.Position(
        lat,
        long,
        1000000
      );
      var placemark = new WorldWind.Placemark(
        placemarkPosition,
        true,
        placemarkAttributes
      );

      // console.log("Place mark", i, ":", placemark);

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

  function handleClick(recognizer, markers) {
    // Obtain the event location.
    var x = recognizer.clientX,
      y = recognizer.clientY;

    // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
    // relative to the upper left corner of the canvas rather than the upper left corner of the page.
    var pickList = globe.wwd.pick(globe.wwd.canvasCoordinates(x, y)); //canvas coordinates    
    console.log(pickList.objects[0])
    if (markers.length != 0) {
      markers[0].userObject.label = null;
      markers.pop()
    }
    if (pickList?.objects[0] != undefined) {
      if (!pickList?.objects[0]?.isTerrain) {
        console.log("PICK LIST:", pickList.objects);
        pickList.objects[0].userObject.label = pickList?.objects[0]?.userObject.attributes?.label;
        markers.push(pickList?.objects[0]);

        //! Display the modal card with information
        // Get the modal
        var modal = document.getElementById("satelliteModal");
        var title = document.getElementsByClassName("modalTitle")[0];
        modal.style.display = "block";
        var position = pickList.objects[0]?.position;
        console.log("ANIMATING", position);
        globe.wwd.goToAnimator.goTo(new WorldWind.Location(position?.latitude, position?.longitude));
        console.log("testing + " + " " + title);
        title.innerHTML = pickList.objects[0].userObject.label;
        console.log(pickList.objects[0])
        console.log(satelliteData[0])
        var newData = satelliteData[0]
        for (var i = 0; i < newData.length; i++) {
          if (title.innerHTML == newData[i]["Current Official Name of Satellite"]) {
            var purpose = document.getElementById("purpose");
            var type = document.getElementById("type");
            var period = document.getElementById("period");
            var launch = document.getElementById("launch");
            var site = document.getElementById("site");
            var moreinfo = document.getElementById("moreinfo");
            var url = document.getElementById("url");
            purpose.innerHTML = "Purpose " + newData[i]["Purpose"]
            type.innerHTML = "Type of Orbit: " + newData[i]["Type of Orbit"]
            period.innerHTML = "Period: " + newData[i]["Period (minutes)"]
            launch.innerHTML = "Launch Date: " + newData[i]["Date of Launch"]
            site.innerHTML = "Launch Site: " + newData[i]["Launch Site"]
            moreinfo.innerHTML = "More information: ";
            url.setAttribute("href", newData[i]["Source"])
            url.innerHTML = newData[i]["Source"]
          }
        }
      }
    }
    console.log("MARKERS:", markers);
    
  };



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

  $("#closeModal").on("click", function () {
    $("#satelliteModal").css('display', 'none');
  })
  /* // Get the <span> element that closes the modal
  var span = document.getElementById("close");

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  }
 
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  } */


  // function handleClick(recognizer) {
  //   // // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
  //   // // relative to the upper left corner of the canvas rather than the upper left corner of the page.
  //   // var pickList = wwd.pick(wwd.canvasCoordinates(x, y));

  //   // // If only one thing is picked and it is the terrain, use a go-to animator to go to the picked location.
  //   // if (pickList.objects.length == 1 && pickList.objects[0].isTerrain) {
  //   //   var position = pickList.objects[0].position;
  //   //   goToAnimator.goTo(new WorldWind.Location(position.latitude, position.longitude));
  //   // }
  // };
});
