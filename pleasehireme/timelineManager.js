var timeline = document.getElementById("timeline");
var paragraphs = document.getElementById("paragraphs");
var buttons = document.getElementById("filterToggle");
import data from "./data/data.json" with {type: "json"};
console.log(data);

var timelineEntry = [];


// phase 1: walk data.json + FORMAT, produce flat entries
function buildEntries(data, formatNode = null) {
    console.log(data);
    if(Object.hasOwn(data, "METADATA")) {
        formatNode = data.METADATA.FORMAT;
    }
    if(formatNode) { // format driven mode
        
    } else { // search until we find METADATA
        if(Array.isArray(data)) {
            for(let thing of data) {
                buildEntries(thing, formatNode);
            }
        } else if(typeof data == "object" && data !== null) {
            for(let key of Object.keys(data)) {
                buildEntries(data[key], formatNode);
            }
        }
    }
    if(Array.isArray(data)) {
        for(let thing in data) {
            buildEntries(thing);
        }
    } else if(typeof data === "object") {
        for(let key of Object.keys(data)) {
            buildEntries(data[key]);
        }
    }
}

// phase 2: group/sort entries for lookup
function indexEntries(entries) {
    
}

// phase 3: render timeline, paragraphs, and buttons from indexed entries
function render(indexed) {
    
}


function inferType(string, parentDataType) {
    if(string.includes(":")) {
        var type;
        [string, type] = string.split(":")
        return type;
    } else {
        return parentDataType;
    }
}
buildEntries(data);