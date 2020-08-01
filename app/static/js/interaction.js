// Set the dimensions and margins of the diagram
const w = window.innerWidth / 3 * 2 - 30;
const h = window.innerHeight - 100;
const margin = {top: 10, right: 20, bottom: 10, left: 20};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;

let imageID = 0;
let MAX_ZOOM_IN = 10;
let MAX_ZOOM_OUT = 0.5;
let zoom = d3.behavior.zoom().scaleExtent([MAX_ZOOM_OUT, MAX_ZOOM_IN]).on('zoom', zoomed);

let canvas = d3.select("#board")
    .attr('width', width)
    .attr('height', height)
    .append("svg")
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .call(zoom);
let container = canvas.append('g')
    .attr('width', '100%')
    .attr('height', '100%');
canvas.append('text')
    .attr('x', width / 2 - 50)
    .attr('y', 100)
    .text('Please click a image for boarding.');

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
    let imageWidth = 180;
    let imagePlace = 20;
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
    group.append("image")
        .attr('href', input)
        .attr('width', imageWidth)
        .attr('x', imagePlace)
        .attr('y', height / 2 - imageWidth / 2)
        .attr('onmouseup', 'browseImage("' + input + ',' + imageID + '")')
        .attr("id", "boarding");
    let buttons = group.append("foreignObject")
        .attr('x', imagePlace + imageWidth - 62)
        .attr('y', height / 2 - imageWidth / 2)
        .attr('width', 240)
        .attr('height', 40)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'button_' + imageID);
    buttons.append('button')
        .attr('class', 'btn btn-info btn-sm hide')
        .attr('type', 'button')
        .attr('id', 'explore_' + imageID)
        .attr('onclick', 'explore(' + imageID + ')')
        .append('i')
        .attr('class', 'fas fa-arrow-right');
    buttons.append('button')
        .attr('class', 'btn btn-danger btn-sm hide')
        .attr('type', 'button')
        .attr('id', 'remove_' + imageID)
        .attr('onclick', 'remove(' + imageID + ')')
        .append('i')
        .attr('class', 'fas fa-trash-alt');
    imageID += 1;
}

//Function called on the zoom event. It translate the draw on the zoommed point and scale with a certain factor
function zoomed() {
    container.attr("transform", "translate(" + (d3.event.translate[0]) + "," + (d3.event.translate[1]) + ")scale(" + d3.event.scale + ")");
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

function clearboard() {
    console.log('clear');
    container.selectAll('*').remove();
}

function screenshot() {
    console.log('screenshot');
}

function printout() {
    console.log('print out');
}

function shareto() {
    console.log('share to');
}

function refresh(i) {
    console.log(i);
}

// should give input data
function explore(i) {
    let imageWidth = 180;

    console.log(i);
    let d = {
        'input': '',
        'semantic': ['000e74ea347f08c0cae2b3cfc4f612cf.jpg', '00a5155ce76792c8aaef4bd67e2d4f44.jpg', '00a8885948a4a3abed0a27480c9f3fa6.png'],
        'color': ['00ab0fe3d1d76da690d7438117eeea49.jpg', '00e43e295097e2580d0178cb3cadd04b.jpg'],
        'status': ['00daeeb00b31e6f7fd9bf103a1733560.jpg', '00dddfdfe4ad349925af78c3d04533f9.jpg']
    };
    console.log(d);
    let g_id = "#image_" + i;
    let x1 = 20, y1 = 10, x2 = 40, y2 = 20;
    d3.select(g_id)
        .append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .style('stroke', 'gray')
        .style('stroke-width', '8')
        .on('mouseover', function (d) {
            console.log(d);
        })
        .on('mouseout', function (d) {
            console.log(d);
        })
        .on('click', function (d) {
            console.log(d);
        });
}

function remove(i) {
    let g_id = "#image_" + i;
    d3.select(g_id).remove();
}

