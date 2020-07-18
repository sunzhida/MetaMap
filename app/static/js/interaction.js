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

function submit() {
    let input = document.getElementById("search").value;
    $.ajax({
        url: "/search/" + input,
        type: "get",
        data: input,
        success: function (response) {
            let re = JSON.parse(response);
            let keywords = re['keywords'];
            let images = re['images'];
            drawKeywords(keywords);
            drawImages(images);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
}

function resubmit(i) {
    let input = i.innerHTML;
    $.ajax({
        url: "/search/" + input,
        type: "get",
        data: input,
        success: function (response) {
            let re = JSON.parse(response);
            let keywords = re['keywords'];
            let images = re['images'];
            drawKeywords(keywords);
            drawImages(images);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
}

function drawKeywords(i) {
    // console.log(i);
    let khtml = '';
    for (let e in i) {
        khtml = khtml + '<span class="badge badge-primary" type="button" onclick="resubmit(this)">' + i[e] + '</span> '
    }
    document.getElementById("keywords").innerHTML = khtml;
}

function drawImages(i) {
    // console.log(i);
    let ihtml = '';
    for (let e in i) {
        ihtml = ihtml + '<img src="../static/img/' + i[e] + '" alt="..." class="img-fluid img-thumbnail item" onclick="addImage(\'../static/img/' + i[e] + '\')">'
    }
    document.getElementById("images").innerHTML = ihtml;
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