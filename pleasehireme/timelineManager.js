var timeline = document.getElementById("timeline");
var paragraphs = document.getElementById("paragraphs");
var buttons = document.getElementById("filterToggle");
import data from "./data.json" with {type: "json"};
console.log(data);

function makeButton(text, location, paragraph, paragraphs) {
    const button = document.createElement("button");
    button.textContent = text;
    button.paragraph = paragraph;
    button.setAttribute("button", "active");
    button.setAttribute("button", "inactive");
    button.classList.toggle("active", true);
    button.classList.toggle("inactive", false);
    button.addEventListener("click", () => {
        button.classList.toggle( "active");
        button.classList.toggle( "inactive");
    })
    location.appendChild(button);
    paragraphs.appendChild(paragraph);
}

function metaCrawler(meta) {

}
function dataSolver(obj) {
    if(Object.keys("METADATA")) {

    }
}

for(const filter of Object.keys(data)) {
    const paragraph = document.createElement("p");
        paragraph.innerHTML += "<h1>" + filter + "</h1>";
        //const metaInstructions = data[filter].metadata.style;
        //var steps = metaInstructions.split("-");


        //traversePattern(metaInstructions, filter, paragraph);

        console.log(filter);
        for(const subfilter of Object.keys(data[filter])) {
            if(subfilter !== "METADATA") {
                paragraph.innerHTML += "<h2>" + subfilter + "</h2>";
            }
        }
        //console.log(data[filter]);
    const button = document.createElement("button");

    buttons.appendChild(button);
    paragraphs.appendChild(paragraph);
}