var timeline = document.getElementById("timeline");
var paragraphs = document.getElementById("paragraphs");
var buttons = document.getElementById("filterToggle");
import data from "./data/data.json" with {type: "json"};
console.log(data);

var timelineEntry = [];
var timelineCounter = 0;
function trace(data, template=undefined, knownProperties={}) {
    if(typeof data === "object") {
        var wildcard;
        var setArray = [];
        for(let i in template) {
            if(i[0] === "#") {
                console.assert(!wildcard, "wildcard already exists: ", data);
                wildcard = i;
            } else {
                setArray.push(i);
            }
        }
        for (let i in data) {
            if(i === "METADATA") {
                //console.log(i);
                console.assert(Object.hasOwn(data[i], "FORMAT"), "METADATA does not contain FORMAT: ", template);
                template = data.METADATA.FORMAT;
            } else {
                let innerTemplate = template;
                if(setArray.includes(i)) {
                    knownProperties[template[i]] = i;
                    innerTemplate = template[i];
                } else if(wildcard) {
                    knownProperties[wildcard.slice(1)] = i;
                    innerTemplate = template[wildcard.slice(1)];
                }
                trace(data[i], innerTemplate, knownProperties);
            }
        }
    } else {
        //timelineEntry[timelineCounter][template] = 1;
    }
}
trace(data);
console.log(timelineEntry);