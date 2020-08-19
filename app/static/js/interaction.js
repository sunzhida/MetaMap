$().ready(function () {
    $('.toast').toast();
    $('#image-comments').submit(function (e) {
        e.preventDefault();
        _saveComment(e.target.content.value);
    })
});

// Set the dimensions and margins of the diagram
const w = window.innerWidth / 3 * 2 - 30;
const h = window.innerHeight - 470;
const margin = {top: 10, right: 20, bottom: 10, left: 20};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;

let tapID = 0;
let tapCount = 0;
let _imageTrees = {};

function imageTree() {
    if (!_imageTrees[tapID]) _imageTrees[tapID] = new ImageTree();
    return _imageTrees[tapID];
}

let MAX_ZOOM_IN = 10;
let MAX_ZOOM_OUT = 0.1;
let zoom = d3.behavior.zoom().scaleExtent([MAX_ZOOM_OUT, MAX_ZOOM_IN]).on('zoom', zoomed);

// 绑定在调色盘上的clipboardJS对象
let colorClipboard;

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
            console.log(xhr);
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

////////////////////////////////////////////////////////////////////////
// The following functions are used for the left-side control bar

/* Search History */
let addHistory = (function () {
    const MAXLEN = 10;
    let history = [];

    function _addHistory(value) {
        const idx = history.indexOf(value);
        // // console.log(idx);
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
    // // console.log(i);
    let khtml = '';
    for (let e in i) {
        khtml = khtml + '<span class="badge badge-primary" type="button" onclick="fillInBadge(this)">' + i[e] + '</span> '
    }
    document.getElementById("keywords").innerHTML = khtml;
}

function drawImages(i) {
    // // console.log(i);
    let ihtml = '';
    for (let e in i) {
        ihtml = ihtml + '<img src="../static/img/' + i[e] + '" alt="..." class="img-fluid img-thumbnail" onclick="_addImage(\'../static/img/' + i[e] + '\')">'
    }
    document.getElementById("images").innerHTML = ihtml;
}

function drawColors(colors) {
    colors.sort((a, b) => b.portion - a.portion);
    colors.forEach(c => c.portion = (c.portion * 100).toFixed(2));
    colors[colors.length - 1].portion = 100.0 - colors.slice(0, -1).reduce((acc, {portion}) => acc + Number(portion), 0.0);
    const ihtml = colors
        .map(c => `<div class="color-block"
            style="width:${c.portion}%; background:${c.color};"
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
    d3.selectAll('.zoomable').attr("transform", "translate(" + (d3.event.translate[0]) + "," + (d3.event.translate[1]) + ")scale(" + d3.event.scale + ")");
}

////////////////////////////////////////////////////////////////////////
// The following functions are used for manipulating the mood board area

function clearboard() {
    // console.log('clear');
}

function screenshot() {
    // console.log('screenshot');
}

function printout() {
    // console.log('print out');
}

function shareto() {
    // console.log('share to');
}

////////////////////////////////////////////////////////////////////////
// The following functions are used for updating the data structure

function _addImage(input) {
    // console.log(input);
    let imageName = input.split('/')[3];
    tapCount = parseInt(tapCount) + 1;
    $.ajax({
        type: "POST",
        url: "/plot/" + imageName,
        data: imageName,
        success: function (response) {
            // if (tapCount === 0) {
            //     tapCount++;
            //     tapID = 0;
            // } else {
            //     tapID = tapCount;
            //     tapCount++;
            // }
            let re = JSON.parse(response);
            createTree(imageTree().initialize(re), tapID);
            // console.log('created and selected tab', tapID);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
    tapID = parseInt(tapID) + 1;
    // console.log(_imageTrees);
}

function _exploreImage(i) {
    let imgName = i.split(',')[0];
    let keyword = i.split(',')[1];
    let imgID = parseInt(i.split(',')[2]);
    let treeID = parseInt(i.split(',')[3]);
    // // console.log(i);
    $.ajax({
        url: "/inquire/" + i,
        type: "get",
        data: i,
        success: function (response) {
            let re = JSON.parse(response);
            let currentTree = imageTree().explore(imgID, re);
            drawTree(currentTree, treeID);
        },
        error: function (xhr) {
            //Do Something to handle error
        }
    });
}

function _enlargeImage(input) {
    let res = input.split(',');
    let image_name = res[0].split('/');
    let image_width = res[1];
    let image_height = res[2];
    let tree_id = res[3];
    console.log(input);
    let target_height = 480;
    let target_width = target_height / image_height * image_width;
    let x = width / 2 - target_width / 2;
    let y = height / 2 - target_height / 2;
    d3.select("#nav_" + tree_id)
        .append('div')
        .attr('id', 'demo_' + tree_id)
        .attr('class', 'img-wrap')
        .attr('width', target_width)
        .attr('height', target_height)
        .append('img')
        .attr('class', 'image-demo')
        .attr('src', '../static/img_large/' + image_name);
    d3.select("#demo_" + tree_id)
        .append('button')
        .attr('class', 'btn btn-light btn-sm button-demo')
        .attr('type', 'button')
        .attr('id', 'close_' + tree_id)
        .attr('onclick', '_closeImage("' + tree_id + '")')
        .append('i')
        .attr('class', 'fas fa-times');

    // d3.select("#canvas_" + tree_id)
    //     .append('g')
    //     .attr('id', 'demo_' + tree_id)
    //     .append('image')
    //     .attr('x', x)
    //     .attr('y', y)
    //     .attr('width', target_width)
    //     .attr('height', target_height)
    //     .attr('xlink:href', '../static/img/' + image_name);
    // d3.select("#demo_" + tree_id)
    //     .append("foreignObject")
    //     .attr('x', x + target_width - 30)
    //     .attr('y', y)
    //     .attr('width', 30)
    //     .attr('height', 36)
    //     .append('xhtml:div')
    //     .attr('xmlns', 'http://www.w3.org/1999/xhtml')
    //     .attr('id', 'dbutton_' + tree_id)
    //     .append('button')
    //     .attr('class', 'btn btn-light btn-sm')
    //     .attr('type', 'button')
    //     .attr('id', 'close_' + tree_id)
    //     .attr('onclick', '_closeImage("' + tree_id + '")')
    //     .append('i')
    //     .attr('class', 'fas fa-times');
}

function _closeImage(i) {
    console.log(i);
    d3.select("#demo_" + i).remove();
}

// The interactive functions

/* click on the image and show the keywords and remove button */
function browseImage(input) {
    let res = input.split(',');
    let image_url = res[0];
    let image_name = res[0].split('/');
    let image_id = res[1];
    let tree_id = res[2];
    // // console.log(image_id);

    let popup_kw = document.getElementById('keywords_' + image_id + '_' + tree_id);
    if (popup_kw.style.display === "none") {
        popup_kw.style.display = "block";
    } else {
        popup_kw.style.display = "none";
    }

    let popup = document.getElementById('button_' + image_id + '_' + tree_id);
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
    let tree_id = res[3];
    let rectWidth = 252, rectHeight = 32;

    let currentRoot = imageTree().get(parseInt(window_id));
    // // console.log(currentRoot);
    let currentImageList = imageTree().find(parseInt(window_id));
    // console.log(currentImageList);

    $(`img.boarding_${window_id}_${tree_id}`).removeClass('boarding-selected');
    $(`img#boarding_${window_id}_${image_id}_${tree_id}`).addClass('boarding-selected');
    d3.select('#kwindow_' + window_id + '_' + tree_id).remove();
    d3.select('#kbutton_' + window_id + '_' + tree_id).remove();

    let keywords = d3.select('#image_' + currentRoot.id + '_' + tree_id)
        .append("foreignObject")
        .attr('x', currentImageList.x)
        .attr('y', currentImageList.y - rectHeight)
        .attr('width', rectWidth + 40)
        .attr('height', rectHeight)
        .attr('id', 'kwindow_' + window_id + '_' + tree_id)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('id', 'keywords_' + window_id + '_' + image_id)
        .append('div')
        .attr('id', 'subkeywords_' + window_id + '_' + image_id + '_' + tree_id);
    for (let t in currentImageList['images'][image_id]['keywords']) {
        keywords.append('span')
            .attr('class', 'badge badge-warning mr-1')
            .attr('type', 'button')
            .attr('onclick', '_exploreImage("' + currentImageList['images'][image_id]['name'] + ',' + currentImageList['images'][image_id]['keywords'][t] + ',' + window_id + ',' + tree_id + '")')
            .html(currentImageList['images'][image_id]['keywords'][t]);
    }

    let buttons = d3.select('#image_' + currentRoot.id + '_' + tree_id)
        .append("foreignObject")
        .attr('x', currentImageList.x + rectWidth + 10)
        .attr('y', currentImageList.y)
        .attr('width', 50)
        .attr('height', 82)
        .attr('id', 'kbutton_' + window_id + '_' + tree_id)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('id', 'button_' + window_id + '_' + tree_id);
    buttons.append('button')
        .attr('class', 'btn btn-dark btn-sm')
        .attr('type', 'button')
        .attr('id', 'collect_' + image_id + '_' + tree_id)
        .attr('onclick', '_collectImage("' + image_name + '")')
        .append('i')
        .attr('class', 'fas fa-thumbtack');
    buttons.append('button')
        .attr('class', 'btn btn-light btn-sm')
        .attr('type', 'button')
        .attr('id', 'large_' + image_id + '_' + tree_id)
        .attr('onclick', '_enlargeImage("' + image_name + ',' + currentImageList['images'][image_id]['width'] + ',' + currentImageList['images'][image_id]['height'] + ',' + tree_id + '")')
        .append('i')
        .attr('class', 'fas fa-search-plus');
    // console.log(currentImageList['images'][image_id]);
}

function createTree(d, t) {
    // console.log(d, t);
    // remove text
    d3.select('#intro').remove();
    // remove the whole content
    // d3.select('#nav_tab_' + t).remove();
    // d3.select('#nav_' + t).remove();
    $('div.tab-pane').removeClass('active').removeClass('show');
    $('a.active').removeClass('active');

    // create the tab to hold the image
    d3.select('#nav_tab')
        .append('a')
        .attr('class', 'nav-item nav-link active')
        .attr('id', 'nav_tab_' + t)
        // 去掉这里可以禁用bootstrap自带的JS控制tab功能，然后我们写自己的onclick
        // .attr('data-toggle', 'tab')
        .attr('href', '#nav_' + t)
        .attr('role', 'tab')
        .attr('aria-controls', 'nav_' + t)
        .attr('aria-selected', 'true')
        .on('click', function () {
            const elem = $(this);
            elem.tab('show');
            tapID = elem.attr('id').replace('nav_tab_', '');
            // console.log('switch to tab', tapID);
        })
        .append('img')
        .attr('width', '16px')
        .attr('src', '../static/img/' + d['images'][0]['name']);
    d3.select('#nav_tabContent')
        .append('div')
        .attr('class', 'tab-pane fade show active')
        .attr('id', 'nav_' + t)
        .attr('role', 'tappanel')
        .attr('aria-labelledby', 'nav_tab_' + t);
    drawTree(d, t);
}

function drawTree(d, t) {
    // // console.log(d);
    // remove the whole content
    d3.select('#canvas_' + t).remove();

    let imageWidth = 120, rectWidth = 252, rectHeight = 120;
    let container = d3.select('#nav_' + t)
        .append("svg")
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr("width", width + margin.right + margin.left)
        .attr("height", height - 112)
        .attr('id', 'canvas_' + t)
        .call(zoom)
        .on('dblclick.zoom', null);
    let group = container.append("g")
        .attr('class', 'zoomable')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr("transform", "translate(0," + (height / 2 - imageWidth / d['images'][0]['width'] * d['images'][0]['height'] / 2) + ")")
        .attr('id', 'image_' + d.id + '_' + t);
    // the root image
    group.append("image")
        .attr('href', '../static/img/' + d['images'][0]['name'])
        .attr('width', imageWidth)
        .attr('x', d.x)
        .attr('y', d.y)
        .attr('onmouseup', 'browseImage("../static/img/' + d['images'][0]['name'] + ',' + d.id + ',' + t + '")')
        .attr("id", "boarding_" + d.id + '_' + t);
    let buttons = group.append("foreignObject")
        .attr('x', d.x + imageWidth + 10)
        .attr('y', d.y)
        .attr('width', 50)
        .attr('height', 82)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'button_' + d.id + '_' + t);
    buttons.append('button')
        .attr('class', 'btn btn-dark btn-sm')
        .attr('type', 'button')
        .attr('id', 'collect_' + d.id + '_' + t)
        .attr('onclick', '_collectImage("' + d['images'][0]['name'] + '")')
        .append('i')
        .attr('class', 'fas fa-thumbtack');
    buttons.append('button')
        .attr('class', 'btn btn-light btn-sm')
        .attr('type', 'button')
        .attr('id', 'large_' + d.id + '_' + t)
        .attr('onclick', '_enlargeImage("' + d['images'][0]['name'] + ',' + d['images'][0]['width'] + ',' + d['images'][0]['height'] + ',' + t + '")')
        .append('i')
        .attr('class', 'fas fa-search-plus');
    let keywords = group.append("foreignObject")
        .attr('x', d.x)
        .attr('y', d.y - 60)
        .attr('width', imageWidth + 60)
        .attr('height', 60)
        .append('xhtml:div')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('style', 'display: none;')
        .attr('id', 'keywords_' + d.id + '_' + t);
    for (let w in d['images'][0]['keywords']) {
        keywords.append('span')
            .attr('class', 'badge badge-warning mr-1 hide')
            .attr('type', 'button')
            .attr('onclick', '_exploreImage("' + d['images'][0]['name'] + ',' + d['images'][0]['keywords'][w] + ',' + d.id + ',' + t + '")')
            .html(d['images'][0]['keywords'][w]);
    }
    // the rest image
    if (d.color && d['color']['images'] === undefined && d['shape']['images'] === undefined && d['semantic']['images'] === undefined) {
        // // console.log(d);
        // the first level
    } else {
        drawTreeNode(d, group, rectWidth, rectHeight, imageWidth, t);
    }
}

function drawTreeNode(d, group, rectWidth, rectHeight, imageWidth, t) {
    // // console.log(d);
    if (d['shape']) {
        drawRect(group, d['shape']['x'], d['shape']['y'], d['shape']['id'], rectWidth, rectHeight, t);
        drawWin(group, d['shape']['x'], d['shape']['y'], d['shape']['id'], rectWidth, rectHeight, d['shape']['images'], t);
        drawLine(group, d.x, d.y, d['shape']['x'], d['shape']['y'], imageWidth, imageWidth / d['images'][0]['height'] * d['images'][0]['height'], 'shape');
        drawTreeNode(d['shape'], group, rectWidth, rectHeight, undefined, t);
    }
    if (d['semantic']) {
        drawRect(group, d['semantic']['x'], d['semantic']['y'], d['semantic']['id'], rectWidth, rectHeight, t);
        drawWin(group, d['semantic']['x'], d['semantic']['y'], d['semantic']['id'], rectWidth, rectHeight, d['semantic']['images'], t);
        drawLine(group, d.x, d.y, d['semantic']['x'], d['semantic']['y'], imageWidth, imageWidth / d['images'][0]['height'] * d['images'][0]['height'], 'semantic');
        drawTreeNode(d['semantic'], group, rectWidth, rectHeight, undefined, t);
    }
    if (d['color']) {
        drawRect(group, d['color']['x'], d['color']['y'], d['color']['id'], rectWidth, rectHeight, t);
        drawWin(group, d['color']['x'], d['color']['y'], d['color']['id'], rectWidth, rectHeight, d['color']['images'], t);
        drawLine(group, d.x, d.y, d['color']['x'], d['color']['y'], imageWidth, imageWidth / d['images'][0]['height'] * d['images'][0]['height'], 'color');
        drawTreeNode(d['color'], group, rectWidth, rectHeight, undefined, t);
    }
}

function drawRect(c, x, y, i, w, h, t) {
    c.append('rect')
        .attr("transform", "translate("
            + x + "," + y + ")")
        .attr('id', 'image_' + i + '_' + t)
        .style('fill', '#95a5a6')
        .style('fill-opacity', '0.2')
        .style('stroke', '#7f8c8d')
        .style('stroke-width', 3)
        .attr('width', w)
        .attr('height', h);
}

function drawWin(c, x, y, i, w, h, input, t) {
    // // console.log(t);
    let window = c.append('foreignObject')
        .attr("transform", "translate("
            + x + "," + y + ")")
        .attr('width', w)
        .attr('height', h)
        .append('xhtml:div')
        .attr("id", "window_" + i + '_' + t)
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .attr('class', 'image-window')
    let subwindow = window.append('div')
        .attr('class', 'image-subwindow')
    for (let m in input) {
        if (m === '0') {
            subwindow.append('img')
                .attr('class', `boarding_${i}_${t} mr-2`)
                .attr('src', '../static/img/' + input[m]['name'])
                .attr("id", "boarding_" + i + "_" + m + "_" + t)
                .attr('width', input[m]['width'] / input[m]['height'] * h)
                .attr('height', h)
                .attr('onmouseup', 'browseImageList("' + input[m]['name'] + ',' + i + ',' + m + ',' + t + '")');
        } else {
            subwindow.append('img')
                .attr('class', `boarding_${i}_${t} mr-2`)
                .attr('src', '../static/img/' + input[m]['name'])
                .attr("id", "boarding_" + i + "_" + m + "_" + t)
                .attr('width', input[m]['width'] / input[m]['height'] * h)
                .attr('height', h)
                .attr('onmouseup', 'browseImageList("' + input[m]['name'] + ',' + i + ',' + m + ',' + t + '")');
        }
    }
    let leftcon = window.append('a')
        // 虽然父组件没有用carousel，但是这里借用了carousel-control-*类，本质上就是放在两边的按钮
        // 希望bootstrap不要偷偷绑定一些乱七八糟的事件在这些类上面
        .attr('class', 'carousel-control-prev')
        .attr('href', '#')
        .attr('role', 'button')
        .attr('onclick', 'prevSlide("' + i + '_' + t + '")')
    leftcon.append('span')
        .attr('class', 'carousel-control-prev-icon')
        .attr('aria-hidden', 'true');
    leftcon.append('span')
        .attr('class', 'sr-only')
        .html('Previous');
    let rightcon = window.append('a')
        .attr('class', 'carousel-control-next')
        .attr('href', '#')
        .attr('role', 'button')
        .attr('onclick', 'nextSlide("' + i + '_' + t + '")')
    rightcon.append('span')
        .attr('class', 'carousel-control-next-icon')
        .attr('aria-hidden', 'true');
    rightcon.append('span')
        .attr('class', 'sr-only')
        .html('Next');
}

function drawLine(c, x1, y1, x2, y2, w, h, t) {
    // // console.log(x1, y1, x2, y2, w, h);
    let path;
    if (!w || !h) {
        // // console.log(w, h);
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
    // // console.log(e);
    // d3.select('#kwindow_' + e).remove();
    // d3.select('#kbutton_' + e).remove();
    const elem = $(`#window_${e} .image-subwindow`).first();
    elem.animate({scrollLeft: '-=100'}, 300);
}

function nextSlide(e) {
    // // console.log(e);
    // d3.select('#kwindow_' + e).remove();
    // d3.select('#kbutton_' + e).remove();
    const elem = $(`#window_${e} .image-subwindow`).first();
    elem.animate({scrollLeft: '+=100'}, 300);
}


// Image Collection
const collection = new Set();

function _collectImage(i) {
    if (collection.has(i)) return;
    collection.add(i);
    $('#starred').append(`<div class="item mr-3 mb-2 border border-light" data-image="${i}">
    <div class="btn-group" role="group">
        <button type="button" class="btn btn-secondary btn-sm" onclick="_setComment('${i}')"><i class="fas fa-comment-alt" /></button>
        <button type="button" class="btn btn-danger btn-sm" onclick="_decollectImage($(this))"><i class="fas fa-trash-alt" /></button>
    </div>
    <img class="img-thumbnail" src="../static/img/${i}" alt="...">
    </div>`);
}

function _decollectImage(elem) {
    const item = elem.parent().parent();
    const image = item.attr('data-image')
    collection.delete(image);
    item.remove();
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
    $('#starred .item').removeClass('border-secondary').addClass('border-light');
    $(`#starred .item[data-image="${key}"]`).addClass('border-secondary').removeClass('border-light');
    $('#image-comments > fieldset').removeAttr('disabled');
    curCommentKey = key;
    document.forms['image-comments'].content.value = comments[key] || '';
}

function _inputComment() {
    if (hasUnsavedComment) return;
    hasUnsavedComment = true;
    $('#image-comments-btn').addClass('btn-secondary').removeClass('btn-outline-secondary');
}
