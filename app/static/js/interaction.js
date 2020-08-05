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
    .attr("height", height - 112)
    .attr('id', 'canvas')
    .call(zoom);
let container = canvas.append('g')
    .attr('id', '')
    .attr('width', '100%')
    .attr('height', '100%');
canvas.append('text')
    .attr('x', width / 2 - 50)
    .attr('y', 100)
    .text('Please click a image for boarding.');

function submit() {
    let input = document.getElementById("search").value;
    addAndDrawHistory(input);
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

/* Search History */
var addHistory = (function () {
    const MAXLEN = 10;
    let history = [];

    function _addHistory(value) {
        const idx = history.indexOf(value);
        // console.log(idx);
        if (idx < 0) {
            // 未找到，新插入，删掉旧的
            history = [value].concat(history.slice(0, MAXLEN - 1));
            return history;
        }
        if (idx === 0) {
            // 已找到，就是第一个，直接return
            return history;
        }

        // 已找到，在后面，挪到前面
        history = [value].concat(history.slice(0, idx), history.slice(idx + 1))
        return history;
    }

    return _addHistory;
})();

function addAndDrawHistory(value) {
    const history = addHistory(value);
    const ihtml = history
        .map(e =>
            `<span class="badge badge-primary mr-1" type="button" onclick="fillInBadge(this)">${e}</span>`
        )
        .join('')
    document.getElementById("history").innerHTML = ihtml;
}

function fillInBadge(i) {
    const value = i.textContent;
    const input = document.getElementById('search');
    if (input.value === value) return;
    input.value = value;
    addAndDrawHistory(value);
    resubmit(i);
}

function drawKeywords(i) {
    // console.log(i);
    let khtml = '';
    for (let e in i) {
        khtml = khtml + '<span class="badge badge-primary" type="button" onclick="fillInBadge(this)">' + i[e] + '</span> '
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
    let imageWidth = 120;
    let imagePlace = 0;
    // console.log(input);
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
        .attr('y', (height - 112) / 2 - imageWidth / 2)
        .attr('onmouseup', 'browseImage("' + input + ',' + imageID + '")')
        .attr("id", "boarding_" + imageID);
    let buttons = group.append("foreignObject")
        .attr('x', imagePlace + imageWidth - 61)
        .attr('y', (height - 112) / 2 - imageWidth / 2)
        .attr('width', imageWidth)
        .attr('height', 30)
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
    let keywords = group.append("foreignObject")
        .attr('x', imagePlace)
        .attr('y', (height - 112) / 2 - imageWidth / 2 - 80)
        .attr('width', imageWidth)
        .attr('height', 80)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'keywords_' + imageID);
    let kw = ["xxx", "health", "health", "health"];
    for (let w in kw) {
        keywords.append('button')
            .attr('class', 'btn btn-warning btn-sm hide')
            .attr('type', 'button')
            .attr('onclick', 'inquire(' + kw[w] + ')')
            .html(kw[w]);
    }
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
    let image_name = res[0].split('/');
    let image_id = res[1];

    let d = {
        "input": "01.jpg",
        "semantic": [{
            "name": "000e74ea347f08c0cae2b3cfc4f612cf.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 276,
            "height": 180
        }, {
            "name": "00a8885948a4a3abed0a27480c9f3fa6.png",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 240,
            "height": 180
        }, {
            "name": "00a5155ce76792c8aaef4bd67e2d4f44.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 232,
            "height": 180
        }],
        "color": [{
            "name": "00ab0fe3d1d76da690d7438117eeea49.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 270,
            "height": 180
        }, {
            "name": "00e43e295097e2580d0178cb3cadd04b.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 131,
            "height": 180
        }],
        "shape": [{
            "name": "00daeeb00b31e6f7fd9bf103a1733560.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 131,
            "height": 180
        }, {
            "name": "00dddfdfe4ad349925af78c3d04533f9.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 116,
            "height": 180
        }],
        "status": "xxx"
    };

    let popup_kw = document.getElementById('keywords_' + image_id);
    if (popup_kw.style.display === "none") {
        popup_kw.style.display = "block";
    } else {
        popup_kw.style.display = "none";
    }

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

function addSubImage(x, y, i, input) {
    let group = container.append("g")
        .attr("transform", "translate("
            + x + "," + y + ")")
        .attr('id', 'image_' + i)
        .classed('draggable', true);
    group.append("image")
        .attr('href', '../static/img/' + input['name'])
        .attr('height', input['height'])
        .attr('onmouseup', 'browseImage("' + input['name'] + ',' + i + '")')
        .attr("id", "boarding_" + i);
    let buttons = group.append("foreignObject")
        .attr('x', input['width'] - 61)
        .attr('y', 0)
        .attr('width', 62)
        .attr('height', 30)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'button_' + i);
    buttons.append('button')
        .attr('class', 'btn btn-info btn-sm hide')
        .attr('type', 'button')
        .attr('id', 'explore_' + i)
        .attr('onclick', 'explore(' + i + ')')
        .append('i')
        .attr('class', 'fas fa-arrow-right');
    buttons.append('button')
        .attr('class', 'btn btn-danger btn-sm hide')
        .attr('type', 'button')
        .attr('id', 'remove_' + i)
        .attr('onclick', 'remove(' + i + ')')
        .append('i')
        .attr('class', 'fas fa-trash-alt');
    let keywords = group.append("foreignObject")
        .attr('x', 0)
        .attr('y', -40)
        .attr('width', input['width'])
        .attr('height', 40)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'keywords_' + i);
    let kw = ["xxx", "health", "health", "health"];
    for (let w in kw) {
        keywords.append('button')
            .attr('class', 'btn btn-warning btn-sm hide')
            .attr('type', 'button')
            .attr('onclick', 'inquire(' + kw[w] + ')')
            .html(kw[w]);
    }
}

// should give input data
function explore(i) {
    console.log(i);
    let img = document.getElementById("boarding_" + i).getBBox();
    let imageWidth = img.width;
    let imageHeight = img.height;
    let imageX = img.x;
    let imageY = img.y;
    console.log(img);
    let recHeight = 220, sec = 80;
    let d = {
        "input": "01.jpg",
        "semantic": [{
            "name": "000e74ea347f08c0cae2b3cfc4f612cf.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 276,
            "height": 180
        }, {
            "name": "00a8885948a4a3abed0a27480c9f3fa6.png",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 240,
            "height": 180
        }, {
            "name": "00a5155ce76792c8aaef4bd67e2d4f44.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 232,
            "height": 180
        }],
        "color": [{
            "name": "00ab0fe3d1d76da690d7438117eeea49.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 270,
            "height": 180
        }, {
            "name": "00e43e295097e2580d0178cb3cadd04b.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 131,
            "height": 180
        }],
        "shape": [{
            "name": "00daeeb00b31e6f7fd9bf103a1733560.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 131,
            "height": 180
        }, {
            "name": "00dddfdfe4ad349925af78c3d04533f9.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 116,
            "height": 180
        }],
        "status": "xxx"
    };
    // console.log(d);

    let g_id = "#image_" + i;
    let x1 = imageX + imageWidth, y1 = imageY + imageHeight / 2;
    let x2 = imageX + imageWidth + sec / 2;
    let y_semantic = y1 - recHeight / 2 - sec;
    let y_color = y1;
    let y_shape = y1 + recHeight / 2 + sec;

    // image
    addSubImage(imageX + imageWidth + sec, y_semantic - recHeight / 2, imageID, d['semantic'][0]);
    imageID += 1;
    addSubImage(imageX + imageWidth + sec, y_color - recHeight / 2, imageID, d['color'][0]);
    imageID += 1;
    addSubImage(imageX + imageWidth + sec, y_shape - recHeight / 2, imageID, d['shape'][0]);
    imageID += 1;

    // line
    let lineGenerator = d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .interpolate('bundle');

    let path1 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_semantic}, {'x': x2, 'y': y_semantic}];
    let path2 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_color}, {'x': x2, 'y': y_color}];
    let path3 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_shape}, {'x': x2, 'y': y_shape}];

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path1))
        .style('fill', 'none')
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

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path2))
        .style('fill', 'none')
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

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path3))
        .style('fill', 'none')
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

