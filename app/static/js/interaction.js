// Set the dimensions and margins of the diagram
const w = window.innerWidth / 3 * 2 - 30;
const h = window.innerHeight - 100;
const margin = {top: 10, right: 20, bottom: 10, left: 20};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;

let imageID = 0;


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
        ihtml = ihtml + '<img src="../static/img/' + i[e] + '" alt="..." class="img-fluid img-thumbnail" onclick="addImage(\'../static/img/' + i[e] + '\')">'
    }
    document.getElementById("images").innerHTML = ihtml;
}


function addImage(input) {
    let imageWidth = 240;
    console.log(input);
    d3.select("#board").select("svg").remove();
    let bg = d3.select("#board").append("svg")
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        // .attr('xmlns:xhtml', 'http://www.w3.org/1999/xhtml')
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
    let buttons = bg.append("foreignObject")
        .attr('x', width / 2 - imageWidth / 2)
        .attr('y', height / 2 - imageWidth / 2 - 40)
        .attr('width', 240)
        .attr('height', 40)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'button_' + imageID);
    buttons.append('button')
        .attr('class', 'btn btn-outline-primary hide')
        .attr('type', 'button')
        .attr('id', 'refresh_' + imageID)
        .attr('onclick', 'refresh(' + imageID + ')')
        .html('refresh');
    buttons.append('button')
        .attr('class', 'btn btn-outline-success hide')
        .attr('type', 'button')
        .attr('id', 'explore_' + imageID)
        .attr('onclick', 'explore(' + imageID + ')')
        .html('explore');
    buttons.append('button')
        .attr('class', 'btn btn-outline-danger hide')
        .attr('type', 'button')
        .attr('id', 'remove_' + imageID)
        .attr('onclick', 'remove(' + imageID + ')')
        .html('remove');
    let group = bg.append("g")
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")")
        .attr('onclick', 'browseImage("' + input + ',' + imageID + '")')
        .attr('id', 'image_' + imageID);
    group.append("image")
        .attr('href', input)
        .attr('width', imageWidth)
        .attr('x', width / 2 - imageWidth / 2)
        .attr('y', height / 2 - imageWidth / 2)
        .attr("id", "boarding");
    imageID += 1;
}

let drag = d3.drag()
    .on("drag", function (d, i) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        d3.select(this).attr("transform", function (d, i) {
            return "translate(" + [d.x, d.y] + ")"
        })
    });

function dragstarted(d) {
    d3.select(this).raise().attr("stroke", "black");
}

function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
    d3.select(this).attr("stroke", null);
}

//
//   return d3.drag()
//       .on("start", dragstarted)
//       .on("drag", dragged)
//       .on("end", dragended);
// }

// click on the image
function browseImage(input) {
    console.log(input);
    let res = input.split(',');
    console.log(res);
    let image_url = res[0];
    let image_id = res[1];
    let popup = document.getElementById('button_' + image_id);
    if (popup.style.display === "none") {
        popup.style.display = "block";
    } else {
        popup.style.display = "none";
    }
}

function refresh(i) {
    console.log(i);
}

function explore(i) {
    console.log(i);
}

function remove(i) {
    console.log(i);
}

