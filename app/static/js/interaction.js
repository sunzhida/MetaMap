// Set the dimensions and margins of the diagram
const w = window.innerWidth / 3 * 2 - 30;
const h = window.innerHeight - 100;
const margin = {top: 10, right: 20, bottom: 10, left: 20};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;


// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
// let svg = d3.select("#board").append("svg")
//     .attr("width", width + margin.right + margin.left)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate("
//         + margin.left + "," + margin.top + ")");


function addImage(input) {
    console.log(input);
    d3.select("#board").select("svg").remove();
    d3.select("#board").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")")
        .append("image")
        .attr('href', input)
        .attr('width', 120)
        .attr('x', width/2)
        .attr('y', height/2)
        .attr('onclick', 'browseImage("'+input+'")')
        .attr("id", "boarding");
}

function browseImage(input) {
    console.log(input);

}