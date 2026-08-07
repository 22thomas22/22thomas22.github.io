var timeline = document.getElementById("timeline");
var paragraphs = document.getElementById("paragraphs");
var buttons = document.getElementById("filterToggle");
import data from "./data/data.json" with {type: "json"};
console.log(data);

var timelineEntry = [];


// phase 1: walk data.json + FORMAT, produce flat entries
var globalData = [];
/*function walker(data, format = null, collectedData = {}) {
    if(Object.hasOwn(data, "METADATA")) {
        console.assert(data.METADATA.FORMAT !== null);
        format = data.METADATA.FORMAT;
    }
    if(format !== null) {
        if(typeof data == "object") {
            for (let subfield of Object.keys(data)) {
                if(Object.hasOwn(format, subfield)) { // use this metadata entry to define the object, not a wildcard
                    if(typeof format[subfield] === "string") {
                        collectedData[format[subfield]] = data[subfield];
                    } else if(Array.isArray(data[subfield])) {
                        for(let arrayData of data[subfield]) {
                            // walker(data[subfield][arrayData], format[subfield])
                        }
                    } else if(typeof data[subfield] === "object") {
                        walker(data[subfield], format[subfield], collectedData);
                    }
                }
            }
        } else if(Array.isArray(data)) {

        }

    }
}*/

function execute(formatNode, dataNode, data= []) {
    let formatExpander = {};
    for(let i in formatNode) { // preformatting to determine if we have a predefined type for our data or not
        formatExpander[i] = [];
        for(let j in formatNode[i]) {
            formatExpander[i][j] = {};
            let formatKey = formatNode[i][j];
            if(formatKey.includes(":")) {
                let name, id;
                [name,id] = formatKey.split(":");
                formatExpander[i][j][name] = id;
            } else {
                formatExpander[i][j][formatKey] = null;
            }
        }
    }
    formatExpander = Object.values(formatExpander)[0]; // recurse inwards by one step
    let scopedFormat = {};
    for(let i of formatExpander) {
        scopedFormat[Object.keys(i)[0]] = Object.values(i)[0];
    }
    for(let i in dataNode) {
        data[i] = {};
        for(let j in dataNode[i]) {
            if(Object.hasOwn(scopedFormat, j) && scopedFormat[j]/*is not null*/) {
                data[i][scopedFormat[j]] = dataNode[i][j];
            } else {
                data[i][j] = dataNode[i][j];
            }
        }
    }
    return data;
}
var collected = {};
Object.assign(collected,
    execute(
    {
        "#grades<-UNIT": [
            "grade:GRADE",
            "phone:PHONE",
            "email:EMAIL",
            "name",
            "location:LOCATION"
        ]
    },
    [
        {
            "grade": "A",
            "phone": "123",
            "email": "e@ecom",
            "name": "person",
            "human": "true"
        },
        {
            "grade": "C",
            "phone": "456",
            "email": "mail",
            "name": "bill nye"
        }
    ])
);
console.log(collected);
