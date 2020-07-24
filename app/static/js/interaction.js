// Set the dimensions and margins of the diagram
const w = window.innerWidth / 3 * 2 - 30;
const h = window.innerHeight - 100;
const margin = {top: 10, right: 20, bottom: 10, left: 20};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;


let canvas = d3.select("#board")
    .attr('width', width)
    .attr('height', height)
    .append("svg")
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);
let container = canvas.append('g');
canvas.append('text')
    .attr('x', width/2-50)
    .attr('y', 100)
    .text('Please click a image for boarding.');

let imageID = 0;
let MAX_ZOOM_IN = 2.0;
let MAX_ZOOM_OUT = 0.2;
let zoomStep = 0.2;
let actualZoomLevel = 1.0;
let MOVE_STEP = 10;
//Create the zoom behavior to set for the draw
let zoom = d3.behavior.zoom().scaleExtent([MAX_ZOOM_OUT, MAX_ZOOM_IN]).on('zoom', zoomed);
//Create the drag and drop behavior to set for the objects crated
let drag = d3.behavior.drag()
    .origin(function (d) {
        console.log(d);
        return d;
    })
    .on("dragstart", dragstarted)
    .on("drag", dragged);
//Set the zoom behavior on the container variable (the draw), disable mousedown event for the zoom and set the function to call on the double click	event
container.call(zoom);
container.selectAll(".draggable").call(drag);

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
    // console.log(d3.select('#init'));
    canvas.select('text').remove();
    // let bg = canvas.append("svg")
    //     .attr('viewBox', '0 0 ' + width + ' ' + height)
    //     .attr('xmlns', 'http://www.w3.org/2000/svg')
    //     .attr("width", width + margin.right + margin.left)
    //     .attr("height", height + margin.top + margin.bottom);
    let group = container.append("g")
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")")
        .attr('id', 'image_' + imageID)
        .classed('draggable', true);
    let buttons = group.append("foreignObject")
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
    group.append("image")
        .attr('href', input)
        .attr('width', imageWidth)
        .attr('x', width / 2 - imageWidth / 2)
        .attr('y', height / 2 - imageWidth / 2)
        .attr('onmouseup', 'browseImage("' + input + ',' + imageID + '")')
        .attr("id", "boarding");
    imageID += 1;
}

//Function called on the zoom event. It translate the draw on the zoommed point and scale with a certain factor
function zoomed() {
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

//Called when drag event starts. It stop the propagation of the click event
function dragstarted(d) {
    console.log(d);
    d3.event.sourceEvent.stopPropagation();
}

//Called when the drag event occurs (object should be moved)
function dragged(d) {
    d.x = d3.event.x;
    d.y = d3.event.y;
    console.log(d);
    console.log(this);
    //Translate the object on the actual moved point
    d3.select(this).attr({
        transform: "translate(" + d.x + "," + d.y + ")"
    });
}

// click on the image
function browseImage(input) {
    // console.log(input);
    let res = input.split(',');
    // console.log(res);
    let image_url = res[0];
    let image_id = res[1];
    let popup = document.getElementById('button_' + image_id);
    if (popup.style.display === "none") {
        popup.style.display = "block";
    } else {
        popup.style.display = "none";
    }
}

function clear() {
    canvas.select('svg').remove();
}

function zoomIn() {
    //Calculate and set the new zoom level
    actualZoomLevel = roundFloat(parseFloat(actualZoomLevel) + parseFloat(zoomStep));
    zoom.scale(actualZoomLevel);
    //Get the actual position of the container
    let xPosition = d3.transform(container.attr("transform")).translate[0];
    let yPosition = d3.transform(container.attr("transform")).translate[1];
    //Esecute the transformation setting the actual position and the new zoom level
    container.attr("transform", "translate(" + xPosition + ", " + yPosition + ")scale(" + zoom.scale() + ")");
}

function zoomOut() {
    actualZoomLevel = roundFloat(parseFloat(actualZoomLevel) - parseFloat(zoomStep));
    zoom.scale(actualZoomLevel);
    let xPosition = d3.transform(container.attr("transform")).translate[0];
    let yPosition = d3.transform(container.attr("transform")).translate[1];
    container.attr("transform", "translate(" + xPosition + ", " + yPosition + ")scale(" + zoom.scale() + ")");
}

function moveDrawLeft() {
    let xPosition = d3.transform(container.attr("transform")).translate[0];
    let yPosition = d3.transform(container.attr("transform")).translate[1];
    container.attr("transform", "translate(" + (xPosition - MOVE_STEP) + ", " + yPosition + ")scale(" + zoom.scale() + ")");
}

function moveDrawRight() {
    let xPosition = d3.transform(container.attr("transform")).translate[0];
    let yPosition = d3.transform(container.attr("transform")).translate[1];
    container.attr("transform", "translate(" + (xPosition + MOVE_STEP) + ", " + yPosition + ")scale(" + zoom.scale() + ")");
}

function moveDrawTop() {
    let xPosition = d3.transform(container.attr("transform")).translate[0];
    let yPosition = d3.transform(container.attr("transform")).translate[1];
    container.attr("transform", "translate(" + xPosition + ", " + (yPosition - MOVE_STEP) + ")scale(" + zoom.scale() + ")");
}

function moveDrawBottom() {
    let xPosition = d3.transform(container.attr("transform")).translate[0];
    let yPosition = d3.transform(container.attr("transform")).translate[1];
    container.attr("transform", "translate(" + xPosition + ", " + (yPosition + MOVE_STEP) + ")scale(" + zoom.scale() + ")");
}

function roundFloat(value) {
    return value.toFixed(2);
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

