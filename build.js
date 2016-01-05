var fs = require("fs");
var orientations = { "portrait": "p", "landscape": "l" };

var variableStartFormat = "$bp-{0}-start-{1}";
var variableEndFormat = "$bp-{0}-end-{1}";
var declarationFormat = "{0}: {1} !default;";
var variableCommentFormat = " //{0} size {1} in {2}";

var breakpointsVariableFormat = "$breakpoints: (\n{0}\n) !default;";
var breakpointsTupleFormat = "  ({0}, {1}, \"{2}\", {3}, {4}px, \"{5}\", {6})";

var mediaQueryOnlyFormat = "${0}-only: \"{1}\" !default;";
var mediaQueryAndUpFormat = "${0}-and-up: \"{1}\" !default;";
var mediaQueryAndDownFormat = "${0}-and-down: \"{1}\" !default;";

var mediaQueryMinFormat = "(min-width: #{{0}})";
var mediaQueryMaxFormat = "(max-width: #{{0}})";
var mediaQueryOrientationFormat = "(orientation: {0})";

module.exports = function (done) {
  fs.readFile("./gridconfig.json", function (err, file) {
    if (err) return done(err);

    var data = JSON.parse(file);

    var breakpointFileData = "";
    var startVariables = [];
    var endVariables = [];
    var mediaQueriesOnly = [];
    var mediaQueriesAndUp = [];
    var mediaQueriesAndDown = [];
    var breakpointTuples = [];

    var breakpoints = {};
    for (var orientation in data.breakpoints) {
      var sizes = data.breakpoints[orientation];
      var keys = Object.keys(sizes);
      for (var i = 0; i < keys.length; i++) {

        var size = keys[i];
        var sizedata = sizes[size];

        var previous = i > 0 ? sizes[keys[i - 1]].to : 0;
        if(previous == "next") previous = sizedata.from;
        var next = i + 1 < keys.length ? sizes[keys[i + 1]].from : -1;


        var from = sizedata.from === "prev" ? previous : sizedata.from;
        var to = sizedata.to === "next" ? next : sizedata.to;

        var startVariableName = variableStartFormat.format(size, orientations[orientation]);
        var endVariableName = variableEndFormat.format(size, orientations[orientation]);
        var endVariableValue = i + 1 < keys.length ? variableStartFormat.format(keys[i+1], orientations[orientation]) + " - 1px" : "-1px";
        startVariables.push(
          declarationFormat.format(
            startVariableName,
            from + "px"
          ) + variableCommentFormat.format(size, "start", orientation)
        );
        endVariables.push(
          declarationFormat.format(
            endVariableName,
            endVariableValue
          ) + variableCommentFormat.format(size, "start", orientation)
        );

        if (!breakpoints[size]) breakpoints[size] = {};
        breakpoints[size][orientation] = {
          fromValue: from,
          toValue: to,
          from: startVariableName,
          to: endVariableName,
          name: size,
          cols: sizedata.cols,
          gutter: sizedata.gutter
        };
      }
    }

    var previousGutters = {};
    for (var i in data.breakpointOrder) {
      var breakpointName = data.breakpointOrder[i];
      var breakpoint = breakpoints[breakpointName];
      if (!breakpoint) throw new Error("invalid breakpoint: " + breakpointName);

      for (var orientation in breakpoint) {
        var bp = breakpoint[orientation];

        var newgutter = false;
        if (!previousGutters[orientation]) {
          newgutter = true;
        } else {
          newgutter = previousGutters[orientation] < bp.gutter;
        }
        previousGutters[orientation] = bp.gutter;

        breakpointTuples.push(
          breakpointsTupleFormat.format(
            bp.from,
            bp.to,
            bp.name,
            bp.cols,
            bp.gutter,
            orientation,
            newgutter
          )
        );
      }

      var thisOnlyQuery = [];
      var thisAndUpQuery = [];
      var thisAndDownQuery = [];
      for (var orientation in breakpoint) {
        var bp = breakpoint[orientation];
        if (bp.fromValue === 0) {
          thisOnlyQuery.push([
            "screen",
            mediaQueryMaxFormat.format(bp.to),
            mediaQueryOrientationFormat.format(orientation)
          ].join(" and "));
        } else if (bp.toValue < 0) {
          thisOnlyQuery.push([
            "screen",
            mediaQueryMinFormat.format(bp.from),
            mediaQueryOrientationFormat.format(orientation)
          ].join(" and "));
        } else  {
          thisOnlyQuery.push([
            "screen",
            mediaQueryMinFormat.format(bp.from),
            mediaQueryMaxFormat.format(bp.to),
            mediaQueryOrientationFormat.format(orientation)
          ].join(" and "));
        }

        thisAndUpQuery.push([
            "screen",
            mediaQueryMinFormat.format(bp.from),
            mediaQueryOrientationFormat.format(orientation)
        ].join(" and "));
        thisAndDownQuery.push([
          "screen",
          mediaQueryMaxFormat.format(bp.to),
          mediaQueryOrientationFormat.format(orientation)
        ].join(" and "));
      }
      mediaQueriesOnly.push(mediaQueryOnlyFormat.format(breakpointName, thisOnlyQuery.join(", ")));
      mediaQueriesAndUp.push(mediaQueryAndUpFormat.format(breakpointName, thisAndUpQuery.join(", ")));
      mediaQueriesAndDown.push(mediaQueryAndDownFormat.format(breakpointName, thisAndDownQuery.join(", ")));

    }

    breakpointFileData += "//start variables\n";
    breakpointFileData += startVariables.join("\n");
    breakpointFileData += "\n\n//end variables\n";
    breakpointFileData += endVariables.join("\n");
    breakpointFileData += "\n\n//breakpoints\n";
    breakpointFileData += breakpointsVariableFormat.format(
      breakpointTuples.join(",\n")
    );
    breakpointFileData += "\n\n//media queries\n";
    breakpointFileData += mediaQueriesOnly.join("\n");
    breakpointFileData += "\n\n";
    breakpointFileData += mediaQueriesAndUp.join("\n");
    breakpointFileData += "\n\n";
    breakpointFileData += mediaQueriesAndDown.join("\n");

    fs.writeFile("./src/_breakpointsBuild.scss", breakpointFileData, function (err) {
      if (err) return done(err);

      done();
    })
  });
};

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}