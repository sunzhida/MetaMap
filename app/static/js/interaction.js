$().ready(function () {
    $('.toast').toast();
    $('#image-comments').submit(function (e) {
        e.preventDefault();
        _saveComment(e.target.content.value);
    })
});

// Set the dimensions and margins of the diagram
const w = window.innerWidth / 3 * 2 - 30;
const h = window.innerHeight - 100;
const margin = {top: 10, right: 20, bottom: 10, left: 20};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;

let imageTree = new ImageTree();
let MAX_ZOOM_IN = 10;
let MAX_ZOOM_OUT = 0.5;
let zoom = d3.behavior.zoom().scaleExtent([MAX_ZOOM_OUT, MAX_ZOOM_IN]).on('zoom', zoomed);

// 绑定在调色盘上的clipboardJS对象
let colorClipboard;

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
    .attr('id', 'container')
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
            let colors = re.colors;
            drawKeywords(keywords);
            drawImages(images);
            drawColors(colors);
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

////////////////////////////////////////////////////////////////////////
// The following functions are used for the left-side control bar

/* Search History */
let addHistory = (function () {
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
            `<span class="badge badge-info mr-1" type="button" onclick="fillInBadge(this)">${e}</span>`
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
        ihtml = ihtml + '<img src="../static/img/' + i[e] + '" alt="..." class="img-fluid img-thumbnail" onclick="_addImage(\'../static/img/' + i[e] + '\')">'
    }
    document.getElementById("images").innerHTML = ihtml;
}

function drawColors(colors) {
    colors.sort((a, b) => b.portion - a.portion);
    const ihtml = colors
        .map(c => `<div class="color-block"
            style="width:${(c.portion * 100).toFixed(2)}%; background:${c.color};"
            title="${c.color}"
            data-clipboard-text="${c.color}"
            data-toggle="tooltip"
            onclick="showColorToast()"></div>`)
        .join('');
    document.getElementById('colors').innerHTML = ihtml;
    // 挂载tooltip事件和clipboard事件
    // 必须等到HTML片段挂载到DOM之后，使用setTimeout在下一个event loop tick执行
    setTimeout(() => {
        if (colorClipboard) colorClipboard.destroy();
        colorClipboard = new ClipboardJS('.color-block');
        $('.color-block').tooltip({
            trigger: 'hover'
        });
        $('.color-block').tooltip({
            trigger: 'click',
            title: 'Color code coplied',
        });
    });
}

function showColorToast() {
    $('#color-clipboard-toast').toast('show');
}

//Function called on the zoom event. It translate the draw on the zoomed point and scale with a certain factor

function zoomed() {
    container.attr("transform", "translate(" + (d3.event.translate[0]) + "," + (d3.event.translate[1]) + ")scale(" + d3.event.scale + ")");
}

////////////////////////////////////////////////////////////////////////
// The following functions are used for manipulating the mood board area

function clearboard() {
    // console.log('clear');
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

////////////////////////////////////////////////////////////////////////
// The following functions are used for updating the data structure

function _addImage(input) {
    // console.log(input);
    let imageName = input.split('/')[3];
    $.ajax({
        type: "POST",
        url: "/plot/" + imageName,
        data: imageName,
        success: function (response) {
            let re = JSON.parse(response);
            drawTree(imageTree.initialize(re));
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
}

function _exploreImage(i) {
    let imgName = i.split(',')[0];
    let keyword = i.split(',')[1];
    let imgID = parseInt(i.split(',')[2]);
    // console.log(i);
    $.ajax({
        url: "/inquire/" + i,
        type: "get",
        data: i,
        success: function (response) {
            let re = JSON.parse(response);
            let currentTree = imageTree.explore(imgID, re);
            drawTree(currentTree);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
}

function _removeImage(input) {
    // console.log(input);
    let curTree = imageTree.remove(input);
    // console.log(curTree);
    drawTree(curTree);
}

// The interactive functions

/* click on the image and show the keywords and remove button */
function browseImage(input) {
    let res = input.split(',');
    let image_url = res[0];
    let image_name = res[0].split('/');
    let image_id = res[1];
    // console.log(image_id);

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

function browseImageList(input) {
    // console.log(input);
    let res = input.split(',');
    let image_url = res[0];
    let image_name = res[0].split('/');
    let window_id = res[1];
    let image_id = res[2];
    let rectWidth = 252, rectHeight = 40;

    let currentRoot = imageTree.get(parseInt(window_id));
    // console.log(currentRoot);
    // console.log();
    let currentImageList = imageTree.find(parseInt(window_id));
    // console.log(currentImageList);

    d3.select('#kwindow_' + window_id).remove();
    d3.select('#kbutton_' + window_id).remove();

    let keywords = d3.select('#image_' + currentRoot.id)
        .append("foreignObject")
        .attr('x', currentImageList.x)
        .attr('y', currentImageList.y - rectHeight)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('id', 'kwindow_' + window_id)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('id', 'keywords_' + window_id + '_' + image_id);
    for (let t in currentImageList['images'][image_id]['keywords']) {
        keywords.append('div')
            .attr('id', 'subkeywords_' + window_id + '_' + image_id)
            .append('span')
            .attr('class', 'badge badge-warning mr-1')
            .attr('type', 'button')
            .attr('onclick', '_exploreImage("' + currentImageList['images'][image_id]['name'] + ',' + currentImageList['images'][image_id]['keywords'][t] + ',' + window_id + '")')
            .html(currentImageList['images'][image_id]['keywords'][t]);
    }

    let buttons = d3.select('#image_' + currentRoot.id)
        .append("foreignObject")
        .attr('x', currentImageList.x + rectWidth - 60)
        .attr('y', currentImageList.y)
        .attr('width', 60)
        .attr('height', 30)
        .attr('id', 'kbutton_' + window_id)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('id', 'button_' + window_id);
    buttons.append('button')
        .attr('class', 'btn btn-dark btn-sm')
        .attr('type', 'button')
        .attr('id', 'collect_' + image_id)
        .attr('onclick', '_collectImage("' + image_name + '")')
        .append('i')
        .attr('class', 'fas fa-thumbtack');
    buttons.append('button')
        .attr('class', 'btn btn-danger btn-sm')
        .attr('type', 'button')
        .attr('id', 'remove_' + window_id)
        .attr('onclick', '_removeImage(' + window_id + ')')
        .append('i')
        .attr('class', 'fas fa-trash-alt');
}

function drawTree(d) {
    // console.log(d);
    // remove text
    canvas.select('text').remove();
    // remove the whole content
    container.select('g').remove();
    let imageWidth = 120, rectWidth = 252, rectHeight = 120;
    let group = container.append("g")
        .attr("transform", "translate(0," + (height / 2 - imageWidth / d['images'][0]['width'] * d['images'][0]['height'] / 2) + ")")
        .attr('id', 'image_' + d.id);
    // the root image
    group.append("image")
        .attr('href', '../static/img/' + d['images'][0]['name'])
        .attr('width', imageWidth)
        .attr('x', d.x)
        .attr('y', d.y)
        .attr('onmouseup', 'browseImage("../static/img/' + d['images'][0]['name'] + ',' + d.id + '")')
        .attr("id", "boarding_" + d.id);
    let buttons = group.append("foreignObject")
        .attr('x', d.x + imageWidth - 60)
        .attr('y', d.y)
        .attr('width', imageWidth - 60)
        .attr('height', 30)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'button_' + d.id);
    buttons.append('button')
        .attr('class', 'btn btn-dark btn-sm')
        .attr('type', 'button')
        .attr('id', 'collect_' + d.id)
        .attr('onclick', '_collectImage("' + d['images'][0]['name'] + '")')
        .append('i')
        .attr('class', 'fas fa-thumbtack');
    buttons.append('button')
        .attr('class', 'btn btn-danger btn-sm hide')
        .attr('type', 'button')
        .attr('id', 'remove_' + d.id)
        .attr('onclick', 'remove(' + d.id + ')')
        .append('i')
        .attr('class', 'fas fa-trash-alt');
    let keywords = group.append("foreignObject")
        .attr('x', d.x)
        .attr('y', d.y - 40)
        .attr('width', imageWidth)
        .attr('height', 40)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'keywords_' + d.id);
    for (let w in d['images'][0]['keywords']) {
        keywords.append('span')
            .attr('class', 'badge badge-warning mr-1 hide')
            .attr('type', 'button')
            .attr('onclick', '_exploreImage("' + d['images'][0]['name'] + ',' + d['images'][0]['keywords'][w] + ',' + d.id + '")')
            .html(d['images'][0]['keywords'][w]);
    }
    // the rest image
    if (d.color && d['color']['images'] === undefined && d['shape']['images'] === undefined && d['semantic']['images'] === undefined) {
        // console.log(d);
        // the first level
    } else {
        drawTreeNode(d, group, rectWidth, rectHeight, imageWidth);
    }
}

function drawTreeNode(d, group, rectWidth, rectHeight, imageWidth) {
    // console.log(d);
    if (d['shape']) {
        drawRect(group, d['shape']['x'], d['shape']['y'], d['shape']['id'], rectWidth, rectHeight);
        drawWin(group, d['shape']['x'], d['shape']['y'], d['shape']['id'], rectWidth, rectHeight, d['shape']['images']);
        drawLine(group, d.x, d.y, d['shape']['x'], d['shape']['y'], imageWidth, imageWidth / d['images'][0]['height'] * d['images'][0]['height'], 'shape');
        drawTreeNode(d['shape'], group, rectWidth, rectHeight);
    }
    if (d['semantic']) {
        drawRect(group, d['semantic']['x'], d['semantic']['y'], d['semantic']['id'], rectWidth, rectHeight);
        drawWin(group, d['semantic']['x'], d['semantic']['y'], d['semantic']['id'], rectWidth, rectHeight, d['semantic']['images']);
        drawLine(group, d.x, d.y, d['semantic']['x'], d['semantic']['y'], imageWidth, imageWidth / d['images'][0]['height'] * d['images'][0]['height'], 'semantic');
        drawTreeNode(d['semantic'], group, rectWidth, rectHeight);
    }
    if (d['color']) {
        drawRect(group, d['color']['x'], d['color']['y'], d['color']['id'], rectWidth, rectHeight);
        drawWin(group, d['color']['x'], d['color']['y'], d['color']['id'], rectWidth, rectHeight, d['color']['images']);
        drawLine(group, d.x, d.y, d['color']['x'], d['color']['y'], imageWidth, imageWidth / d['images'][0]['height'] * d['images'][0]['height'], 'color');
        drawTreeNode(d['color'], group, rectWidth, rectHeight);
    }
}

function drawRect(c, x, y, i, w, h) {
    c.append('rect')
        .attr("transform", "translate("
            + x + "," + y + ")")
        .attr('id', 'image_' + i)
        .style('fill', '#95a5a6')
        .style('fill-opacity', '0.2')
        .style('stroke', '#7f8c8d')
        .style('stroke-width', 3)
        .attr('width', w)
        .attr('height', h);
}

function drawWin(c, x, y, i, w, h, input) {
    // console.log(i);
    let window = c.append('foreignObject')
        .attr("transform", "translate("
            + x + "," + y + ")")
        .attr('width', w)
        .attr('height', h)
        .append('xhtml:div')
        .attr("id", "window_" + i)
        .attr('class', 'carousel slide')
        .attr('data-interval', 'false')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml');
    let subwindow = window.append('div')
        .attr('class', 'carousel-inner');
    for (let m in input) {
        if (m === '0') {
            subwindow.append('div')
                .attr('class', 'carousel-item active')
                .attr('data-interval', 'false')
                .append('img')
                .attr('src', '../static/img/' + input[m]['name'])
                .attr("id", "boarding_" + i + "_" + m)
                .attr('width', input[m]['width'] / input[m]['height'] * h)
                .attr('height', h)
                .attr('onmouseup', 'browseImageList("' + input[m]['name'] + ',' + i + ',' + m + '")');
        } else {
            subwindow.append('div')
                .attr('class', 'carousel-item')
                .attr('data-interval', 'false')
                .append('img')
                .attr('src', '../static/img/' + input[m]['name'])
                .attr("id", "boarding_" + i + "_" + m)
                .attr('width', input[m]['width'] / input[m]['height'] * h)
                .attr('height', h)
                .attr('onmouseup', 'browseImageList("' + input[m]['name'] + ',' + i + ',' + m + '")');
        }
    }
    let leftcon = window.append('a')
        .attr('class', 'carousel-control-prev')
        .attr('href', "#window_" + i)
        .attr('role', 'button')
        .attr('onclick', 'prevSlide(' + i + ')')
        .attr('data-slide', 'prev');
    leftcon.append('span')
        .attr('class', 'carousel-control-prev-icon')
        .attr('aria-hidden', 'true');
    leftcon.append('span')
        .attr('class', 'sr-only')
        .html('Previous');
    let rightcon = window.append('a')
        .attr('class', 'carousel-control-next')
        .attr('href', "#window_" + i)
        .attr('role', 'button')
        .attr('onclick', 'nextSlide(' + i + ')')
        .attr('data-slide', 'next');
    rightcon.append('span')
        .attr('class', 'carousel-control-next-icon')
        .attr('aria-hidden', 'true');
    rightcon.append('span')
        .attr('class', 'sr-only')
        .html('Next');
}

function drawLine(c, x1, y1, x2, y2, w, h, t) {
    // console.log(x1, y1, x2, y2, w, h);
    let path;
    if (!w || !h) {
        // console.log(w, h);
        w = 252;
        h = 120;
        path = [{'x': x1 + w, 'y': y1 + h / 2}, {
            'x': x2,
            'y': y1 + h / 2
        }, {'x': x1 + w, 'y': y2 + 60}, {
            'x': x2,
            'y': y2 + 60
        }];
    } else {
        path = [{'x': x1 + w, 'y': y1 + h / 2}, {
            'x': x2 - (x2 - x1) / 3,
            'y': y1 + h / 2
        }, {'x': x1 + w + (x2 - x1) / 3, 'y': y2 + 60}, {
            'x': x2,
            'y': y2 + 60
        }];
    }
    // line
    let lineGenerator = d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .interpolate('bundle');

    if (t === 'semantic') {
        c.append('path')
            .attr('d', lineGenerator(path))
            .style('fill', 'none')
            .style('stroke', '#e67e22')
            .style('stroke-width', '3');
        c.append('rect')
            .attr('width', '77')
            .attr('height', '30')
            .attr('rx', '8')
            .attr('transform', function () {
                return "translate(" + ((x1 + w + x2) / 2 - 35) + "," + ((y1 + h / 2 + y2) / 2 + 15) + ")"
            })
            .style('fill', '#d35400');
        c.append('text')
            .text('Semantic')
            .attr('transform', function () {
                return "translate(" + ((x1 + w + x2) / 2 - 30) + "," + ((y1 + h / 2 + y2) / 2 + 34) + ")"
            })
            .style('fill', 'white');
    } else if (t === 'color') {
        c.append('path')
            .attr('d', lineGenerator(path))
            .style('fill', 'none')
            .style('stroke', '#9b59b6')
            .style('stroke-width', '3');
        c.append('rect')
            .attr('width', '52')
            .attr('height', '30')
            .attr('rx', '8')
            .attr('transform', function () {
                return "translate(" + ((x1 + w + x2) / 2 - 20) + "," + ((y1 + h / 2 + y2) / 2 + 15) + ")"
            })
            .style('fill', '#8e44ad');
        c.append('text')
            .text('Color')
            .attr('transform', function () {
                return "translate(" + ((x1 + w + x2) / 2 - 15) + "," + ((y1 + h / 2 + y2) / 2 + 34) + ")"
            })
            .style('fill', 'white');
    } else if (t === 'shape') {
        c.append('path')
            .attr('d', lineGenerator(path))
            .style('fill', 'none')
            .style('stroke', '#2ecc71')
            .style('stroke-width', '3');
        c.append('rect')
            .attr('width', '58')
            .attr('height', '30')
            .attr('rx', '8')
            .attr('transform', function () {
                return "translate(" + ((x1 + w + x2) / 2 - 25) + "," + ((y1 + h / 2 + y2) / 2 + 15) + ")"
            })
            .style('fill', '#27ae60');
        c.append('text')
            .text('Shape')
            .attr('transform', function () {
                return "translate(" + ((x1 + w + x2) / 2 - 20) + "," + ((y1 + h / 2 + y2) / 2 + 34) + ")"
            })
            .style('fill', 'white');
    }
}

function prevSlide(e) {
    // console.log(e);
    d3.select('#kwindow_' + e).remove();
    d3.select('#kbutton_' + e).remove();
}

function nextSlide(e) {
    // console.log(e);
    d3.select('#kwindow_' + e).remove();
    d3.select('#kbutton_' + e).remove();
}

function inquire(i) {
    let imgName = i.split(',')[0];
    let keyword = i.split(',')[1];
    let imgID = i.split(',')[2];
    console.log(imgName, keyword, imgID);
    let img = document.getElementById("boarding_" + imgID).getBBox();
    // let img1 = document.getElementById("boarding_" + imgID).getBoundingClientRect();
    console.log(img);
    let recHeight = 220, sec = 80, imageHeight = 120, imageWidth = 252;

    let g_id = "#image_" + imgID;
    let x1 = img.x + img.width, y1 = img.y + img.height / 2;
    let x2 = img.x + img.width + sec / 2;
    let y_semantic = y1 - recHeight / 2 - sec;
    let y_color = y1;
    let y_shape = y1 + recHeight / 2 + sec;

    // image

    $.ajax({
        url: "/inquire/" + i,
        type: "get",
        data: i,
        success: function (response) {
            let re = JSON.parse(response);
            console.log(re);
            // console.log(currentTree);
            // console.log(x1, y_semantic, y_color, y_shape);
            imageID += 1;
            addSubImage(x1 + sec, y_semantic - imageHeight / 2, imageID, re['semantic']);
            imageID += 1;
            addSubImage(x1 + sec, y_color - imageHeight / 2, imageID, re['color']);
            imageID += 1;
            addSubImage(x1 + sec, y_shape - imageHeight / 2, imageID, re['shape']);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });

    // line
    let lineGenerator = d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .interpolate('bundle');

    console.log(x1, y_semantic, y_color, y_shape);

    let path1 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_semantic}, {'x': x2, 'y': y_semantic}];
    let path2 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_color}, {'x': x2, 'y': y_color}];
    let path3 = [{'x': x1, 'y': y1}, {'x': x2, 'y': y1}, {'x': x1, 'y': y_shape}, {'x': x2, 'y': y_shape}];
    let cen_x = (x1 + x2) / 2;
    let cen_1 = (y1 + y_semantic) / 2;
    let cen_2 = (y1 + y_color) / 2;
    let cen_3 = (y1 + y_shape) / 2;

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path1))
        .style('fill', 'none')
        .style('stroke', '#e67e22')
        .style('stroke-width', '3')
        .on('mouseover', function () {
            d3.select('#path_s_' + imgID)
                .style('visibility', 'visible');
        })
        .on('mouseout', function () {
            d3.select('#path_s_' + imgID)
                .style('visibility', 'hidden');
        });
    d3.select(g_id)
        .append('text')
        .text('Semantic')
        .attr('transform', function () {
            return "translate(" + (cen_x - 30) + "," + (cen_1 - 11) + ")"
        })
        .attr('id', 'path_s_' + imgID)
        .style('visibility', 'hidden')
        .style('fill', '#d35400');

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path2))
        .style('fill', 'none')
        .style('stroke', '#9b59b6')
        .style('stroke-width', '3')
        .on('mouseover', function () {
            d3.select('#path_c_' + imgID)
                .style('visibility', 'visible');
        })
        .on('mouseout', function () {
            d3.select('#path_c_' + imgID)
                .style('visibility', 'hidden');
        });
    d3.select(g_id)
        .append('text')
        .text('Color')
        .attr('transform', function () {
            return "translate(" + (cen_x - 15) + "," + (cen_2 - 11) + ")"
        })
        .attr('id', 'path_c_' + imgID)
        .style('visibility', 'hidden')
        .style('fill', '#8e44ad');

    d3.select(g_id)
        .append('path')
        .attr('d', lineGenerator(path3))
        .style('fill', 'none')
        .style('stroke', '#2ecc71')
        .style('stroke-width', '3')
        .on('mouseover', function (d) {
            d3.select('#path_sh_' + imgID)
                .style('visibility', 'visible');
        })
        .on('mouseout', function (d) {
            d3.select('#path_sh_' + imgID)
                .style('visibility', 'hidden');
        })
        .on('click', function (d) {
            console.log(d);
        });
    d3.select(g_id)
        .append('text')
        .text('Shape')
        .style('fill', '#27ae60')
        .attr('id', 'path_sh_' + imgID)
        .style('visibility', 'hidden')
        .attr('transform', function (d) {
            return "translate(" + (cen_x - 15) + "," + (cen_3 - 11) + ")"
        });
}

function remove(i) {
    let g_id = "#image_" + i;
    d3.select(g_id).remove();
}


// Image Collection
const collection = new Set();
function _collectImage(i) {
    if (collection.has(i)) return;
    collection.add(i);
    $('#starred').append(`<div class="item">
    <div class="btn-group mr-3" role="group">
        <button type="button" class="btn btn-secondary btn-sm" onclick="_setComment('${i}')"><i class="fas fa-comment-alt" /></button>
        <button type="button" class="btn btn-danger btn-sm" data-image="${i}" onclick="_decollectImage($(this))"><i class="fas fa-trash-alt" /></button>
    </div>
    <img class="img-thumbnail mr-3 pb-2" src="../static/img/${i}" alt="...">
    </div>`);
}
function _decollectImage(elem) {
    const image = elem.attr('data-image')
    collection.delete(image);
    elem.parent().parent().remove();
}

// Starred Image
var comments = {};
var curCommentKey = null;
var hasUnsavedComment = false;
function _saveComment(value) {
    hasUnsavedComment = false;
    $('#image-comments-btn').addClass('btn-outline-secondary').removeClass('btn-secondary');
    comments[curCommentKey] = value;
}
function _setComment(key) {
    if (hasUnsavedComment && !confirm('You have unsaved image comments. Discard and comment a new image?')) return;
    hasUnsavedComment = false;
    $('#image-comments-btn').addClass('btn-outline-secondary').removeClass('btn-secondary');
    $('#image-comments > fieldset').removeAttr('disabled');
    curCommentKey = key;
    document.forms['image-comments'].content.value = comments[key] || '';
}
function _inputComment() {
    if (hasUnsavedComment) return;
    hasUnsavedComment = true;
    $('#image-comments-btn').addClass('btn-secondary').removeClass('btn-outline-secondary');
}
