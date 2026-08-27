var timeline = document.getElementById("timeline");
var paragraphs = document.getElementById("paragraphs");
var buttons = document.getElementById("filterToggle");
import data from "../data/data.json" with {type: "json"};
import { preprocess } from "./preprocess.js";
import {collectUnits} from "./timeline.js";

const cleaned = preprocess(data);
console.log(cleaned);

const timelineUnits = collectUnits(cleaned);
console.log(timelineUnits);