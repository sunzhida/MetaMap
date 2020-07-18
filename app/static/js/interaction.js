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

// $("#submit").click(function () {
//     let text = $("#search").val();
//     console.log(text);
//     // $.ajax({
//     //     url: "/search",
//     //     type: "get",
//     //     data: {'data': text},
//     //     success: function (response) {
//     //         console.log(response);
//     //     },
//     //     error: function (xhr) {
//     //         //Do Something to handle error
//     //     }
//     // });
// });

function submit() {
    console.log('hello')
    let input = document.getElementById("search").value;
    console.log(input);
}


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
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('onclick', 'browseImage("' + input + '")')
        .attr("id", "boarding");
}

function browseImage(input) {
    console.log(input);

}