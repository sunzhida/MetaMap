// The main content

// Get the data
// function readJSON(file) {
//     var request = new XMLHttpRequest();
//     request.open('GET', file, false);
//     request.send(null);
//     if (request.status == 200)
//         return request.responseText;
// };
// var myObject = JSON.parse(readJSON('http://127.0.0.1:5000/data/TabletSales'));
// console.log(myObject);

//slide the bar
$(function () {
    let slide = $("#slider");
    let handle = $("#custom-handle");
    slide.slider({
        create: function () {
            // handle.text($(this).slider("value")+ '%');
            handle.text('Top 50');
        },
        slide: function (event, ui) {
            // console.log(erows);
            let starter = parseInt((erows - 50) * ui.value / 100)
            handle.text(starter + '-' + (starter + 50));
            handle.css('margin-left', -1 * handle.width() * (slide.slider('value') / slide.slider('option', 'max')));
        },
        stop: function (event, ui) {
            $.ajax({
                type: 'POST',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ui.value),
                dataType: 'json',
                url: "/update",
                success: function (d) {
                    data = d;
                    svg.selectAll("*").remove();
                    sankey
                        .nodes(d.nodes)
                        .links(d.links)
                        .layout(32);
                    drawSankey(d);
                },
                error: function (error) {
                    console.log(error.responseText);
                }
            });
        }
    });
    handle.css('margin-left', -1 * handle.width() * (slide.slider('value') / slide.slider('option', 'max')));
});

d3.sankey = function () {
    var sankey = {},
        nodeWidth = 24,
        nodePadding = 8,
        size = [1, 1],
        nodes = [],
        links = [];

    sankey.nodeWidth = function (_) {
        if (!arguments.length) return nodeWidth;
        nodeWidth = +_;
        return sankey;
    };

    sankey.nodePadding = function (_) {
        if (!arguments.length) return nodePadding;
        nodePadding = +_;
        return sankey;
    };

    sankey.nodes = function (_) {
        if (!arguments.length) return nodes;
        nodes = _;
        return sankey;
    };

    sankey.links = function (_) {
        if (!arguments.length) return links;
        links = _;
        return sankey;
    };

    sankey.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        return sankey;
    };

    sankey.layout = function (iterations) {
        computeNodeLinks();
        computeNodeValues();
        computeNodeBreadths();
        computeNodeDepths(iterations);
        computeLinkDepths();
        return sankey;
    };

    sankey.relayout = function () {
        computeLinkDepths();
        return sankey;
    };

    sankey.link = function () {
        var curvature = .5;

        function link(d) {
            var x0 = d.source.x + d.source.dx,
                x1 = d.target.x,
                xi = d3.interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature),
                y0 = d.source.y + d.sy + d.dy / 2,
                y1 = d.target.y + d.ty + d.dy / 2;
            return "M" + x0 + "," + y0
                + "C" + x2 + "," + y0
                + " " + x3 + "," + y1
                + " " + x1 + "," + y1;
        }

        link.curvature = function (_) {
            if (!arguments.length) return curvature;
            curvature = +_;
            return link;
        };

        return link;
    };

    // Populate the sourceLinks and targetLinks for each node.
    // Also, if the source and target are not objects, assume they are indices.
    function computeNodeLinks() {
        nodes.forEach(function (node) {
            node.sourceLinks = [];
            node.targetLinks = [];
        });
        links.forEach(function (link) {
            var source = link.source,
                target = link.target;
            if (typeof source === "number") source = link.source = nodes[link.source];
            if (typeof target === "number") target = link.target = nodes[link.target];
            source.sourceLinks.push(link);
            target.targetLinks.push(link);
        });
    }

    // Compute the value (size) of each node by summing the associated links.
    function computeNodeValues() {
        nodes.forEach(function (node) {
            node.value = Math.max(
                d3.sum(node.sourceLinks, value),
                d3.sum(node.targetLinks, value)
            );
        });
    }

    // Iteratively assign the breadth (x-position) for each node.
    // Nodes are assigned the maximum breadth of incoming neighbors plus one;
    // nodes with no incoming links are assigned breadth zero, while
    // nodes with no outgoing links are assigned the maximum breadth.
    function computeNodeBreadths() {
        var remainingNodes = nodes,
            nextNodes,
            x = 0;

        while (remainingNodes.length) {
            nextNodes = [];
            remainingNodes.forEach(function (node) {
                node.x = x;
                node.dx = nodeWidth;
                node.sourceLinks.forEach(function (link) {
                    nextNodes.push(link.target);
                });
            });
            remainingNodes = nextNodes;
            ++x;
        }

        //
        moveSinksRight(x);
        scaleNodeBreadths((width - nodeWidth) / (x - 1));
    }

    function moveSourcesRight() {
        nodes.forEach(function (node) {
            if (!node.targetLinks.length) {
                node.x = d3.min(node.sourceLinks, function (d) {
                    return d.target.x;
                }) - 1;
            }
        });
    }

    function moveSinksRight(x) {
        nodes.forEach(function (node) {
            if (!node.sourceLinks.length) {
                node.x = x - 1;
            }
        });
    }

    function scaleNodeBreadths(kx) {
        nodes.forEach(function (node) {
            node.x *= kx;
        });
    }

    function computeNodeDepths(iterations) {
        var nodesByBreadth = d3.nest()
            .key(function (d) {
                return d.x;
            })
            .sortKeys(d3.ascending)
            .entries(nodes)
            .map(function (d) {
                return d.values;
            });

        //
        initializeNodeDepth();
        resolveCollisions();
        for (var alpha = 1; iterations > 0; --iterations) {
            relaxRightToLeft(alpha *= .99);
            resolveCollisions();
            relaxLeftToRight(alpha);
            resolveCollisions();
        }

        function initializeNodeDepth() {
            var ky = d3.min(nodesByBreadth, function (nodes) {
                return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
            });

            nodesByBreadth.forEach(function (nodes) {
                nodes.forEach(function (node, i) {
                    node.y = i;
                    node.dy = node.value * ky;
                });
            });

            links.forEach(function (link) {
                link.dy = link.value * ky;
            });
        }

        function relaxLeftToRight(alpha) {
            nodesByBreadth.forEach(function (nodes, breadth) {
                nodes.forEach(function (node) {
                    if (node.targetLinks.length) {
                        var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
                        node.y += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedSource(link) {
                return center(link.source) * link.value;
            }
        }

        function relaxRightToLeft(alpha) {
            nodesByBreadth.slice().reverse().forEach(function (nodes) {
                nodes.forEach(function (node) {
                    if (node.sourceLinks.length) {
                        var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
                        node.y += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedTarget(link) {
                return center(link.target) * link.value;
            }
        }

        function resolveCollisions() {
            nodesByBreadth.forEach(function (nodes) {
                var node,
                    dy,
                    y0 = 0,
                    n = nodes.length,
                    i;

                // Push any overlapping nodes down.
                nodes.sort(ascendingDepth);
                for (i = 0; i < n; ++i) {
                    node = nodes[i];
                    dy = y0 - node.y;
                    if (dy > 0) node.y += dy;
                    y0 = node.y + node.dy + nodePadding;
                }

                // If the bottommost node goes outside the bounds, push it back up.
                dy = y0 - nodePadding - size[1];
                if (dy > 0) {
                    y0 = node.y -= dy;

                    // Push any overlapping nodes back up.
                    for (i = n - 2; i >= 0; --i) {
                        node = nodes[i];
                        dy = node.y + node.dy + nodePadding - y0;
                        if (dy > 0) node.y -= dy;
                        y0 = node.y;
                    }
                }
            });
        }

        function ascendingDepth(a, b) {
            return a.y - b.y;
        }
    }

    function computeLinkDepths() {
        nodes.forEach(function (node) {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
        });
        nodes.forEach(function (node) {
            var sy = 0, ty = 0;
            node.sourceLinks.forEach(function (link) {
                link.sy = sy;
                sy += link.dy;
            });
            node.targetLinks.forEach(function (link) {
                link.ty = ty;
                ty += link.dy;
            });
        });

        function ascendingSourceDepth(a, b) {
            return a.source.y - b.source.y;
        }

        function ascendingTargetDepth(a, b) {
            return a.target.y - b.target.y;
        }
    }

    function center(node) {
        return node.y + node.dy / 2;
    }

    function value(link) {
        return link.value;
    }

    return sankey;
};

///////////////////////////////
// for the sankey diagram view
///////////////////////////////

// Set the dimensions and margins of the diagram
// Currently set the visualization to the full width page, otherwise the w = width * 2 / 3
const w = (window.innerWidth - 62) * 2 / 3 - 30;
const h = window.innerHeight - 258;
// $("#down_card .card-body").css({"maxHeight": h - 170});
// set teh height of the accordian
// $(".collapse .card-body").css({"maxHeight": h - 170});
const margin = {top: 30, right: 55, bottom: 30, left: 100};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svg = d3.select("#vis").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate("
        + margin.left + "," + margin.top + ")");

let formatNumber = d3.format(",.0f"),
    format = function (d) {
        return formatNumber(d) + " case(s)";
    };

let currentNode;
let editList = [];
editList.push(...editHistory);

let sankey = d3.sankey()
    .nodeWidth(23)
    .nodePadding(10)
    .size([width, height]);
// .extent([[1, 1], [width - 1, height - 6]]);

let path = sankey.link();

sankey
    .nodes(data.nodes)
    .links(data.links)
    .layout(32);
drawSankey(data);

let historyData = data;
let historyLen;
if (erows > 50) {
    historyLen = 50;
} else {
    historyLen = erows;
    drawNumber(erows, 1);
}
// console.log(historyLen);

let hoverCondition = 1;
let totalNumClick = 0;

let igroup = d3.select("#i_group");
igroup.selectAll("*").remove();
let agroup = d3.select("#a_group");
agroup.selectAll("*").remove();
let egroup = d3.select("#e_group");
egroup.selectAll("*").remove();
let mgroup = d3.select("#m_group");
mgroup.selectAll("*").remove();
igroup.append("small").html("Gesture" + ":&nbsp;");
agroup.append("small").html("Action" + ":&nbsp;");
egroup.append("small").html("Entity" + ":&nbsp;");
mgroup.append("small").html("Meaning" + ":&nbsp;");

drawBadges(editList, igroup, agroup, egroup, mgroup);

function drawSankey(data) {

    let pinnedNode = [];
    for (let e in data['nodes']) {
        for (let i in editList) {
            // console.log(i);
            if (editList[i][0] === "add") {
                if ((data['nodes'][e]['iden'] === editList[i][2]) && (data['nodes'][e]['type'] === editList[i][1])) {
                    data['nodes'][e]['pinned'] = 1;
                    pinnedNode.push(data['nodes'][e]['nodes']);
                } else {
                    data['nodes'][e]['pinned'] = 0;
                }
            }
        }
    }

    let i_texture = textures.lines().thicker().stroke("#5d9a6f").background("rgba(115,171,132,.5)");
    let a_texture = textures.lines().thicker().stroke("#70bf75").background("rgba(153,209,156,.5)");
    let e_texture = textures.lines().thicker().stroke("#4fb6b3").background("rgba(121,199,197,.5)");
    let m_texture = textures.lines().thicker().stroke("#80d1d7").background("rgba(173,225,229,.5)");

    let link = svg.append("g").selectAll(".link")
        .data(data.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .attr("id", function (d, i) {
            d.id = i;
            return "link-" + i;
        })
        .style("stroke-width", function (d) {
            return Math.max(1, d.dy);
        })
        .sort(function (a, b) {
            return b.dy - a.dy;
        });

    link.append("title")
        .text(function (d) {
            return d.source.name + " → " + d.target.name + "\n" + format(d.value);
        });

    let node = svg.append("g").selectAll(".node")
        .data(data.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("id", function (d, i) {
            d.id = i;
            return "node-" + i;
        })
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .on("click", handleMouseClick)
        .on("mouseover", handleMouseHover)
        // .on("mouseout", handleMouseOut)
        .call(d3.drag()
            .subject(function (d) {
                return d
            })
            // .on('start', function () {
            //     this.parentNode.appendChild(this);
            // })
            // .origin(function (d) {
            //     return d;
            // })
            // interfering with click .on("dragstart", function() { this.parentNode.appendChild(this); })
            .on("drag", dragmove));

    node.call(i_texture);
    node.call(a_texture);
    node.call(e_texture);
    node.call(m_texture);

    node.append("rect")
        .attr("height", function (d) {
            return d.dy;
        })
        .attr("width", sankey.nodeWidth())
        .attr("id", function (d, i) {
            d.id = i;
            return "rect-" + i;
        })
        .attr("class", "rect")
        // .style("fill", function (d) {
        //     return d.color = color(d.name.replace(/ .*/, ""));
        // })
        // .style("stroke", function (d) {
        //     return d3.rgb(d.color).darker(2);
        // })
        .attr("fill", function (d) {
            switch (d['type']) {
                case "interaction":
                    return "rgba(115,171,132,.5)";
                    // return "#73AB84";
                    break;
                case "action":
                    return "rgba(153,209,156,.5)";
                    // return "#99D19C";
                    break;
                case "entity":
                    return "rgba(121,199,197,.5)";
                    // return "#79C7C5";
                    break;
                case "meaning":
                    return "rgba(173,225,229,.5)";
                    // return "#ADE1E5";
                    break;
                default:
                    console.log("There is no suitable node condition.");
            }
        })
        .style("fill", function (d) {
            for (let u in pinnedNode) {
                if (pinnedNode[u] === d['nodes']) {
                    switch (d['type']) {
                        case "interaction":
                            return i_texture.url();
                            break;
                        case "action":
                            return a_texture.url();
                            break;
                        case "entity":
                            return e_texture.url();
                            break;
                        case "meaning":
                            return m_texture.url();
                            break;
                        default:
                            console.log("There is no suitable stroke condition.");
                    }
                }
            }
        })
        .attr("stroke", function (d) {
            switch (d['type']) {
                case "interaction":
                    return "#73AB84";
                    break;
                case "action":
                    return "#99D19C";
                    break;
                case "entity":
                    return "#79C7C5";
                    break;
                case "meaning":
                    return "#ADE1E5";
                    break;
                default:
                    console.log("There is no suitable stroke condition.");
            }
        })
        // .attr("stroke-width", function (d) {
        //     for (let u in pinnedNode) {
        //         if (pinnedNode[u] === d['nodes']) {
        //             return 6.8;
        //         }
        //     }
        // })
        .append("title")
        .text(function (d) {
            return d.name + "\n" + format(d.value);
        });

    node.append("text")
        .attr("x", -6)
        .attr("y", function (d) {
            // console.log(d);
            return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) {
            let nameArr = d.name.split(',');
            return nameArr[0];
        })
        .filter(function (d) {
            return d.x < width / 2;
        })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    node.append("svg:image")
        .attr("xlink:href", function (d) {
            if (d.type === "interaction") {
                let nameArr = d.name.split(',');
                if (nameArr[2] === " Single hand") {
                    return "/static/img/icon_grey/single.svg";
                } else {
                    return "/static/img/icon_grey/double.svg";
                }
                console.log(nameArr);
                // return "/static/img/device.svg";
            }
        })
        .attr("width", 16)
        .attr("height", 16)
        .attr("x", -16)
        .attr("y", function (d) {
            return d.dy / 2 - 8;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .attr("transform", null);

    node.append("svg:image")
        .attr("xlink:href", function (d) {
            if (d.type === "interaction") {
                let nameArr = d.name.split(',');
                if (nameArr[1] === " D") {
                    return "/static/img/icon_grey/device.svg";
                } else if (nameArr[1] === " V") {
                    return "/static/img/icon_grey/gesture.svg";
                } else if (nameArr[1] === " T") {
                    return "/static/img/icon_grey/touch.svg";
                } else if (nameArr[1] === " D/V") {
                    return "/static/img/icon_grey/device.svg";
                } else if (nameArr[1] === " T/V") {
                    return "/static/img/icon_grey/touch.svg";
                } else if (nameArr[1] === " D/T/V") {
                    return "/static/img/icon_grey/device.svg";
                }
                console.log(nameArr);
                // return "/static/img/device.svg";
            }
        })
        .attr("width", 16)
        .attr("height", 16)
        .attr("x", -32)
        .attr("y", function (d) {
            return d.dy / 2 - 8;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .attr("transform", null);

    node.append("svg:image")
        .attr("xlink:href", function (d) {
            if (d.type === "interaction") {
                let nameArr = d.name.split(',');
                if (nameArr[1] === " D/V") {
                    return "/static/img/icon_grey/gesture.svg";
                } else if (nameArr[1] === " T/V") {
                    return "/static/img/icon_grey/gesture.svg";
                } else if (nameArr[1] === " D/T/V") {
                    return "/static/img/icon_grey/touch.svg";
                }
                console.log(nameArr);
                // return "/static/img/device.svg";
            }
        })
        .attr("width", 16)
        .attr("height", 16)
        .attr("x", -48)
        .attr("y", function (d) {
            return d.dy / 2 - 8;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .attr("transform", null);

    node.append("svg:image")
        .attr("xlink:href", function (d) {
            if (d.type === "interaction") {
                let nameArr = d.name.split(',');
                if (nameArr[1] === " D/T/V") {
                    return "/static/img/icon_grey/gesture.svg";
                }
                console.log(nameArr);
                // return "/static/img/device.svg";
            }
        })
        .attr("width", 16)
        .attr("height", 16)
        .attr("x", -64)
        .attr("y", function (d) {
            return d.dy / 2 - 8;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .attr("transform", null);

    function dragmove(d) {
        d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
        sankey.relayout();
        link.attr("d", path);
    }
}

function highlight_link(id, opacity) {
    d3.select("#link-" + id).style("stroke-opacity", opacity);
}

function highlight_rect(node, id) {
    // console.log(node, id);
    d3.select("#rect-" + id)
        .style("fill", "rgba(241, 196, 15, 0.5)")
        .style("stroke", "#f1c40f");
}

function recover_rect(node, id) {
    // console.log(node, id);
    // console.log(node.type);
    if (node.type === "interaction") {
        d3.select("#rect-" + id)
            .style("fill", "rgba(115,171,132,.5)")
            .style("stroke", "#73AB84");
    } else if (node.type === "action") {
        d3.select("#rect-" + id)
            .style("fill", "rgba(153,209,156,.5)")
            .style("stroke", "#99D19C");
    } else if (node.type === "entity") {
        d3.select("#rect-" + id)
            .style("fill", "rgba(121,199,197,.5)")
            .style("stroke", "#79C7C5");
    } else if (node.type === "meaning") {
        d3.select("#rect-" + id)
            .style("fill", "rgba(173,225,229,.5)")
            .style("stroke", "#ADE1E5");
    }
}

// Create Event Handlers for mouse
function handleMouseHover(d, i) {  // Add interactivity

    // console.log(hoverCondition);

    if (hoverCondition) {
        // console.log(this.id);
        // console.log(d, i);
        // console.log(d.name, d.type);
        let expstr;
        if (d.type === "action") {
            expstr = 'Description: <b>' + d.iden + '</b> (<i>verb</i>), ' + d.type.toUpperCase();
        } else if (d.type === "interaction") {
            expstr = 'Description: <b>' + d.iden + '</b> (<i>verb</i>), GESTURE';
        } else {
            expstr = 'Description: <b>' + d.iden + '</b> (<i>noun</i>), ' + d.type.toUpperCase();
        }
        let exp = d3.select('#explore');
        exp.selectAll('*').remove();
        exp.html(expstr);

        if (d.type === "interaction") {
            let link = './table/' + d['orid'];
            let table_content = '<table class="table table-striped table-hover table-sm">\n' + '<tbody>';
            $.ajax({
                url: link,   // This is just an example domain
                method: "GET",
                success: function (datum) {
                    let target = JSON.parse(datum)
                    for (let e in target) {
                        table_content = table_content + '<tr>\n' +
                            '<th>Sensor</th>\n' +
                            '<td>' + target[e][5] + '</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<th>Device</th>\n' +
                            '<td>' + target[e][4] + '</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<th>Type</th>\n' +
                            '<td>' + target[e][3] + '</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<th>Algorithm</th>\n' +
                            '<td>' + target[e][6] + '</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<th>Domain</th>\n' +
                            '<td>' + target[e][1] + '</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<th>Year</th>\n' +
                            '<td>' + target[e][2] + '</td>\n' +
                            '</tr>\n' +
                            '<tr>\n' +
                            '<th>Link</th>\n' +
                            '<td><a class="btn btn-outline-info btn-sm" role="button" href="' + target[e][0] + '">Click here</a></td>\n' +
                            '</tr><tr><td colspan="2"></td></tr>';
                    }
                    table_content = table_content + '</tbody>\n' + '</table>';
                    layoutMeta(d, i, table_content);
                }
            });

        } else {
            let w_list = d['iden'].split(" ");
            let target;

            if (d['type'] === 'action') {
                target = w_list[w_list.length - 1] + '_v';
            } else {
                target = w_list[w_list.length - 1] + '_n';
            }

            let link = './syn/' + target;
            $.ajax({
                url: link,   // This is just an example domain
                method: "GET",
                success: function (datum) {
                    // console.log(datum);
                    drawWordCloud(datum['wordlist'], datum['legend'], d.type);
                }
            });
        }
    }
}

// function handleMouseOut(d, i) {
//     // console.log(d, i);
//     // Use D3 to select element, change color back to normal
//     // d3.select(this).attr({
//     //     fill: "black",
//     //     r: radius
//     // });
//
//     // let stroke_opacity = 0, fill_opacity = 0;
//     // if (d3.select(this).attr("data-hovered") === "1") {
//     //     d3.select(this).attr("data-hovered", "0");
//     //     stroke_opacity = 0.2;
//     //     fill_opacity = 1;
//     // } else {
//     //     d3.select(this).attr("data-hovered", "1");
//     //     stroke_opacity = 0.42;
//     //     fill_opacity = 0.5;
//     // }
//
//     // Select text by id and then remove
//     // d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();  // Remove text location
// }

function handleMouseClick(node, i) {
    totalNumClick += 1;
    currentNode = node;
    // console.log(currentNode);
    hoverCondition = 1;

    let selected = document.querySelectorAll("[data-clicked='1']");
    // console.log(selected);
    let passList = [];

    for (let e = 0; e < selected.length; e++) {
        let str = selected[e].id;
        let selectedNode = str.split('-')[1];
        d3.select("#rect-" + selectedNode)
            .style("fill", function (d) {
                if (d.type === "interaction") {
                    return "#73AB84";
                } else if (d.type === "action") {
                    return "#99D19C";
                } else if (d.type === "entity") {
                    return "#79C7C5";
                } else if (d.type === "meaning") {
                    return "#ADE1E5";
                }
            })
            .style("stroke", function (d) {
                if (d.type === "interaction") {
                    return "rgba(115,171,132,.5)";
                } else if (d.type === "action") {
                    return "rgba(153,209,156,.5)";
                } else if (d.type === "entity") {
                    return "rgba(121,199,197,.5)";
                } else if (d.type === "meaning") {
                    return "rgba(173,225,229,.5)";
                }
            });
        // add it here
        // console.log(parseInt(selectedNode));
        // console.log(currentNode['id']);
        if (parseInt(selectedNode) === currentNode['id']) {
            // for (let ix in passList) {
            //     console.log(passList[ix]);
            // }
            passList.push(['remove', data['nodes'][selectedNode]['type'], data['nodes'][selectedNode]['iden'], data['nodes'][selectedNode]['orid'], 2]);
        } else {
            passList.push(['add', data['nodes'][selectedNode]['type'], data['nodes'][selectedNode]['iden'], data['nodes'][selectedNode]['orid'], 2]);
        }
    }

    let remainingNodes = [],
        nextNodes = [];

    let stroke_opacity = 0;
    if (d3.select(this).attr("data-clicked") === "1") {
        d3.select(this).attr("data-clicked", "0");
        stroke_opacity = 0.2;
        recover_rect(node, i);
    } else {
        d3.select(this).attr("data-clicked", "1");
        stroke_opacity = 0.42;
        highlight_rect(node, i);
    }

    // Update the selected links
    let traverse = [{
        linkType: "sourceLinks",
        nodeType: "target"
    }, {
        linkType: "targetLinks",
        nodeType: "source"
    }];

    traverse.forEach(function (step) {
        node[step.linkType].forEach(function (link) {
            remainingNodes.push(link[step.nodeType]);
            highlight_link(link.id, stroke_opacity);
        });

        while (remainingNodes.length) {
            nextNodes = [];
            remainingNodes.forEach(function (node) {
                node[step.linkType].forEach(function (link) {
                    nextNodes.push(link[step.nodeType]);
                    highlight_link(link.id, stroke_opacity);
                });
            });
            remainingNodes = nextNodes;
        }
    });

    // console.log(editList);

    igroup.selectAll("*").remove();
    agroup.selectAll("*").remove();
    egroup.selectAll("*").remove();
    mgroup.selectAll("*").remove();
    igroup.append("small").html("Gesture" + ":&nbsp;");
    agroup.append("small").html("Action" + ":&nbsp;");
    egroup.append("small").html("Entity" + ":&nbsp;");
    mgroup.append("small").html("Meaning" + ":&nbsp;");

    let combineList = [];
    combineList.push(...editList);
    let teller = 0;
    // console.log(combineList.length);
    // console.log(passList.length);
    for (let pl in passList) {
        // console.log(passList[pl]);
        for (let cl in combineList) {
            if ((combineList[cl][1] === passList[pl][1]) && (combineList[cl][2] === passList[pl][2])) {
                // console.log('chucianguo');
                teller = 0;
            } else {
                teller = 1;
            }
        }
        if (teller) {
            combineList.push(passList[pl]);
        }
    }
    drawBadges(combineList, igroup, agroup, egroup, mgroup);

    let flag = 1;
    for (let ie in editList) {
        if (editList[ie][2] === node.iden) {
            flag = 0;
        }
    }
    for (let ip in passList) {
        if (passList[ip][0] === 'remove') {
            flag = 0;
        }
    }
    // console.log(flag);
    if (flag) {
        if (node.type === "interaction") {
            igroup.append("span")
                .attr("class", "badge badge-pill badge-warning")
                .html(node.iden);
        } else if (node.type === "action") {
            agroup.append("span")
                .attr("class", "badge badge-pill badge-warning")
                .html(node.name);
        } else if (node.type === "entity") {
            egroup.append("span")
                .attr("class", "badge badge-pill badge-warning")
                .html(node.name);
        } else if (node.type === "meaning") {
            mgroup.append("span")
                .attr("class", "badge badge-pill badge-warning")
                .html(node.name);
        }
        // console.log(node.type);
        hoverCondition = 0;
    }
    // console.log(hoverCondition);

    // the button mute function can be here

    // let fgroup = d3.select("#filter");
    // fgroup.selectAll("*").remove();
    //
    // let bgroup = fgroup.append("div")
    //     .attr("class", "btn-group")
    //     .attr("role", "group");
    //
    // //add select button
    // bgroup.append("button")
    //     .attr("type", "button")
    //     .attr("class", "btn btn-outline-secondary")
    //     .attr("onclick", "pinNode()")
    //     .html("<i class=\"fas fa-thumbtack\"></i> Pin");

    //add stick button
    // bgroup.append("button")
    //     .attr("type", "button")
    //     .attr("class", "btn btn-outline-secondary")
    //     .attr("onclick", "pinNode()")
    //     .html("<i class=\"fas fa-filter\"></i> Filter");

    // fgroup.append('span')
    //     .html("&nbsp;");

    // //add remove button
    // bgroup.append("button")
    //     .attr("type", "button")
    //     .attr("class", "btn btn-outline-secondary")
    //     .attr("onclick", "removeNode()")
    //     .html("<i class=\"fas fa-trash-alt\"></i> Remove");

    // fgroup.append('span')
    //     .html("&nbsp;");
    //
    // fgroup.append("button")
    //     .attr("type", "button")
    //     .attr("class", "btn btn-outline-secondary")
    //     .attr("onclick", "clearNode()")
    //     .html("<i class=\"fas fa-eraser\"></i> Clear Path Marks");

    let record = {
        'no_click': totalNumClick,
        'node_id': node['id'],
        'node_name': node['name'],
        'time': new Date()
    };
    // for recording
    // $.ajax({
    //     type: 'POST',
    //     contentType: "application/json; charset=utf-8",
    //     data: JSON.stringify(record),
    //     dataType: 'json',
    //     url: "/writeclick",
    //     success: function (d) {
    //         if (d) {
    //             console.log('write to the node file successfully.');
    //         }
    //     },
    //     error: function (error) {
    //         console.log(error.responseText);
    //     }
    // });
}


///////////////////////////////
// for the word cloud view
///////////////////////////////
// -----------------------------------------------
//The following part is for drawing the word cloud
// -----------------------------------------------
//draw the word cloud

const cloudw = (window.innerWidth - 62) / 3 - 72;
const cloudh = window.innerHeight - 680;

let cloud_margin = {top: 0, right: 0, bottom: 0, left: 0};
let cloud_width = cloudw - cloud_margin.left - cloud_margin.right;
let cloud_height = cloudh - cloud_margin.top - cloud_margin.bottom;

let cloudg = d3.select("#meta");

cloudg.append("div")
    .attr("class", "init-text")
    .attr("style", "min-height: 264px") //maybe 320px
    .text("Hover the node to check the metadata");

function layoutMeta(data, i, t) {
    // console.log(data, i, t);

    cloudg.selectAll("*").remove();

    let display = cloudg
        .append("ul")
        .attr("class", "nav nav-tabs nav-justified")
        .attr("role", "tablist");

    display.append("li")
        .attr("class", "nav-item")
        .append("a")
        .attr("class", "nav-link active")
        .attr("id", "info-tab")
        .attr("data-toggle", "tab")
        .attr("href", "#info")
        .attr("role", "tab")
        .attr("aria-controls", "info")
        .attr("aria-selected", "false")
        .html("Metadata");

    display.append("li")
        .attr("class", "nav-item")
        .append("a")
        .attr("class", "nav-link")
        .attr("id", "front-tab")
        .attr("data-toggle", "tab")
        .attr("href", "#front")
        .attr("role", "tab")
        .attr("aria-controls", "front")
        .attr("aria-selected", "true")
        .html("Front View");

    display.append("li")
        .attr("class", "nav-item")
        .append("a")
        .attr("class", "nav-link")
        .attr("id", "back-tab")
        .attr("data-toggle", "tab")
        .attr("href", "#back")
        .attr("role", "tab")
        .attr("aria-controls", "back")
        .attr("aria-selected", "false")
        .html("Side View");

    let content = cloudg.append("div")
        .attr("class", "tab-content")
        .attr("id", "meta-info");

    content.append("div")
        .attr("class", "overflow-auto tab-pane fade active show")
        .attr("id", "info")
        .attr("role", "tabpanel")
        .attr("aria-labelledby", "info-tab")
        .html(t);

    let front_url = '<img src="/static/gesture/' + data.orid + '_f.gif" class="img-thumbnail" alt="Responsive image">';

    content.append("div")
        .attr("class", "tab-pane fade")
        .attr("id", "front")
        .attr("role", "tabpanel")
        .attr("aria-labelledby", "front-tab")
        .html(front_url);

    let back_url = '<img src="/static/gesture/' + data.orid + '_s.gif" class="img-thumbnail" alt="Responsive image">';

    content.append("div")
        .attr("class", "tab-pane fade")
        .attr("id", "back")
        .attr("role", "tabpanel")
        .attr("aria-labelledby", "back-tab")
        .html(back_url);
}

function drawWordCloud(data, l, type) {

    // var step = d3.scaleLinear()
    //     .domain([1, 8])
    //     .range([1, 30]);
    // var color = d3.scaleLinear()
    //     .domain([1, step(2), step(3), step(4), step(5), step(6), step(7), 30])
    //     .range(['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'])
    //     .interpolate(d3.interpolateHcl);

    // var color = d3.scaleLinear()
    //     .domain([1, parseInt(l.length / 2), l.length])
    //     .range(['#FF6F61', '#FC9E21', '#263056'])
    //     .interpolate(d3.interpolateHcl);
    // let categories = d3.keys(d3.nest().key(function (d) {
    //     return d.State;
    // }).map(data));
    // let fontSize = d3.scalePow().exponent(.5).domain([0, 1]).range([16, 40]);

    cloudg.selectAll("*").remove();

    // let display = cloudg
    //     .append("ul")
    //     .attr("class", "nav nav-tabs nav-justified")
    //     .attr("role", "tablist");
    //
    // display.append("li")
    //     .attr("class", "nav-item")
    //     .append("a")
    //     .attr("class", "nav-link active")
    //     .attr("id", "cloud-tab")
    //     .attr("data-toggle", "tab")
    //     .attr("href", "#cloud")
    //     .attr("role", "tab")
    //     .attr("aria-controls", "cloud")
    //     .attr("aria-selected", "false")
    //     .html("Synonym");
    //
    // display.append("li")
    //     .attr("class", "nav-item")
    //     .append("a")
    //     .attr("class", "nav-link")
    //     .attr("id", "legend-tab")
    //     .attr("data-toggle", "tab")
    //     .attr("href", "#legend")
    //     .attr("role", "tab")
    //     .attr("aria-controls", "legend")
    //     .attr("aria-selected", "true")
    //     .html("Legend");

    // let content = cloudg.append("div")
    // .attr("class", "tab-content")
    // .attr("id", "meta-data");
    //
    // content.append("div")
    //     .attr("class", "tab-pane fade active show")
    //     .attr("id", "cloud")
    //     .attr("role", "tabpanel")
    //     .attr("aria-labelledby", "cloud-tab");

    let legend = cloudg.append("div")
    // .attr("class", "overflow-auto tab-pane fade")
        .attr("class", "overflow-auto")
        .attr("id", "legend");
    // .attr("role", "tabpanel")
    // .attr("aria-labelledby", "legend-tab");

    let lo = legend.append('ol');
    for (let le in l) {
        // console.log(l[le]['def']);
        // console.log(l[le]['value']);
        // let ld = legend.append('div');
        // ld.append('span')
        //     .style('background-color', color(l[le]['value']))
        //     .attr('class', 'dot');
        lo.append('li')
        // .append('small')
            .html(l[le]['def']);
    }

    // let layout = d3.layout.cloud()
    //     .size([cloud_width, cloud_height])
    //     // .timeInterval(20)
    //     .words(data)
    //     .rotate(function (d) {
    //         return 0;
    //     })
    //     // .fontSize(function (d, i) {
    //     //     return fontSize(parseFloat(d.value));
    //     // })
    //     .fontSize(22)
    //     .text(function (d) {
    //         return d.syn;
    //     })
    //     .spiral("rectangular") // "archimedean" or "rectangular"
    //     .on("end", draw)
    //     .start();

    function draw(words) {
        // console.log(words);
        let wordcloud = d3.select("#cloud");
        let cg = wordcloud.append("svg")
            .attr("width", cloud_width + cloud_margin.right + cloud_margin.left)
            .attr("height", cloud_height + cloud_margin.top + cloud_margin.bottom);
        if (words.length != 0) {
            // cg.append("g")
            //     .attr('class', 'wordcloud')
            //     .attr("transform", "translate(" + cloud_width / 2 + "," + cloud_height / 2 + ")")
            //     .selectAll("text")
            //     .data(words)
            //     .enter().append("text")
            //     .attr('class', 'word')
            //     .style("fill", function (d, i) {
            //         // console.log(d);
            //         // console.log(color(i));
            //         return color(d.value);
            //     })
            //     .style("font-size", function (d) {
            //         return d.size + "px";
            //     })
            //     //.style("fill", function(d) {
            //     //var paringObject = data.filter(function(obj) { return obj.syn === d.text});
            //     // return color(paringObject[0].category);
            //     //})
            //     .attr("text-anchor", "middle")
            //     .attr("transform", function (d) {
            //         return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            //     })
            //     .text(function (d) {
            //         // console.log(d);
            //         return d.text;
            //     });
        } else {
            cg.append("g")
                .attr("transform", "translate(" + cloud_margin.left + "," + cloud_margin.top + ")")
                .append("foreignObject")
                .attr("x", 0)
                .attr("y", cloud_height / 2 - 50)
                .attr("width", cloud_width + cloud_margin.right + cloud_margin.left)
                .attr("height", cloud_height + cloud_margin.top + cloud_margin.bottom)
                .append("xhtml:div")
                .attr("class", "init-text")
                .text("Sorry. We could not find the synonym for this word/phrase.");
        }
    }
}

// function selectNode() {
//     editList.push(['add', currentNode['type'], currentNode['iden'], currentNode['orid']]);
//
//     let igroup = d3.select("#i_group");
//     igroup.selectAll("*").remove();
//     let agroup = d3.select("#a_group");
//     agroup.selectAll("*").remove();
//     let egroup = d3.select("#e_group");
//     egroup.selectAll("*").remove();
//     let mgroup = d3.select("#m_group");
//     mgroup.selectAll("*").remove();
//     igroup.append("small").html("Interaction" + ":&nbsp;");
//     agroup.append("small").html("Action" + ":&nbsp;");
//     egroup.append("small").html("Entity" + ":&nbsp;");
//     mgroup.append("small").html("Meaning" + ":&nbsp;");
//
//     drawBadges(editList, igroup, agroup, egroup, mgroup);
// }

function pinNode() {
    // console.log(currentNode);
    let localT = 0;
    for (let item in editList) {
        // console.log(editList[item]);
        if (editList[item][0] === 'add' && editList[item][1] === currentNode['type'] && editList[item][2] === currentNode['name']) {
            //pass
            localT = 0;
        } else {
            localT = 1;
        }
    }
    if (localT) {
        editList.push(['add', currentNode['type'], currentNode['iden'], currentNode['orid'], 1]);
    }
    // console.log(editList);

    historyData = data;
    historyLen = (erows > 50) ? 50 : erows;

    //update the data structure
    $.ajax({
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(editList),
        dataType: 'json',
        url: "/revise",
        success: function (d) {
            // window.location.href = "{{ url_for( 'revise' ) }}";
            data = d['data'];
            erows = d['length'];
            // console.log(d);
            svg.selectAll("*").remove();
            sankey
                .nodes(d['data'].nodes)
                .links(d['data'].links)
                .layout(32);
            drawSankey(d['data']);
            drawNumber(d['length'], 0);
        },
        error: function (error) {
            console.log(error.responseText);
        }
    });

    igroup.selectAll("*").remove();
    agroup.selectAll("*").remove();
    egroup.selectAll("*").remove();
    mgroup.selectAll("*").remove();
    igroup.append("small").html("Gesture" + ":&nbsp;");
    agroup.append("small").html("Action" + ":&nbsp;");
    egroup.append("small").html("Entity" + ":&nbsp;");
    mgroup.append("small").html("Meaning" + ":&nbsp;");
    drawBadges(editList, igroup, agroup, egroup, mgroup);

    hoverCondition = 1;

    let record = {
        'data': editList,
        'time': new Date()
    };

    // for recording
    // $.ajax({
    //     type: 'POST',
    //     contentType: "application/json; charset=utf-8",
    //     data: JSON.stringify(record),
    //     dataType: 'json',
    //     url: "/writepin",
    //     success: function (d) {
    //         if (d) {
    //             console.log('write to the path file successfully.');
    //         }
    //     },
    //     error: function (error) {
    //         console.log(error.responseText);
    //     }
    // });
}

function removeNode() {
    // console.log(currentNode);
    let localT = 0;
    for (let item in editList) {
        // console.log(editList[item]);
        if (editList[item][0] === 'remove' && editList[item][1] === currentNode['type'] && editList[item][2] === currentNode['name']) {
            //pass
            localT = 0;
        } else {
            localT = 1;
        }
    }
    if (localT) {
        editList.push(['remove', currentNode['type'], currentNode['iden'], currentNode['orid'], 1]);
    }

    historyData = data;
    historyLen = (erows > 50) ? 50 : erows;

    //update the data structure
    $.ajax({
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(editList),
        dataType: 'json',
        url: "/revise",
        success: function (d) {
            data = d['data'];
            erows = d['length'];
            svg.selectAll("*").remove();
            sankey
                .nodes(d['data'].nodes)
                .links(d['data'].links)
                .layout(32);
            drawSankey(d['data']);
            drawNumber(d['length'], 0);
        },
        error: function (error) {
            console.log(error.responseText);
        }
    });

    igroup.selectAll("*").remove();
    agroup.selectAll("*").remove();
    egroup.selectAll("*").remove();
    mgroup.selectAll("*").remove();
    igroup.append("small").html("Gesture" + ":&nbsp;");
    agroup.append("small").html("Action" + ":&nbsp;");
    egroup.append("small").html("Entity" + ":&nbsp;");
    mgroup.append("small").html("Meaning" + ":&nbsp;");
    drawBadges(editList, igroup, agroup, egroup, mgroup);

    hoverCondition = 1;

    let record = {
        'data': editList,
        'time': new Date()
    };

    // for recording
    // $.ajax({
    //     type: 'POST',
    //     contentType: "application/json; charset=utf-8",
    //     data: JSON.stringify(record),
    //     dataType: 'json',
    //     url: "/writepin",
    //     success: function (d) {
    //         if (d) {
    //             console.log('write to the path file successfully.');
    //         }
    //     },
    //     error: function (error) {
    //         console.log(error.responseText);
    //     }
    // });
}

function clearNode() {
    // console.log(currentNode);

    svg.selectAll("*").remove();

    sankey
        .nodes(data.nodes)
        .links(data.links)
        .layout(32);

    drawSankey(data);

    cloudg.selectAll("*").remove();
    cloudg.append("div")
        .attr("class", "init-text")
        .attr("style", "min-height: 264px") //maybe 320px
        .text("Hover the node to check the metadata");

    igroup.selectAll("*").remove();
    agroup.selectAll("*").remove();
    egroup.selectAll("*").remove();
    mgroup.selectAll("*").remove();
    igroup.append("small").html("Gesture" + ":&nbsp;");
    agroup.append("small").html("Action" + ":&nbsp;");
    egroup.append("small").html("Entity" + ":&nbsp;");
    mgroup.append("small").html("Meaning" + ":&nbsp;");
    drawBadges(editList, igroup, agroup, egroup, mgroup);

    let exp = d3.select('#explore');
    exp.selectAll('*').remove();
    exp.html('Description');

    hoverCondition = 1;
}

function redoNode() {
    svg.selectAll("*").remove();
    editList.pop();
    data = historyData;

    sankey
        .nodes(historyData.nodes)
        .links(historyData.links)
        .layout(32);

    drawSankey(historyData);
    drawNumber(historyLen, 0);

    cloudg.selectAll("*").remove();
    cloudg.append("div")
        .attr("class", "init-text")
        .attr("style", "min-height: 264px") //maybe 320px
        .text("Hover the node to check the metadata");


    igroup.selectAll("*").remove();
    agroup.selectAll("*").remove();
    egroup.selectAll("*").remove();
    mgroup.selectAll("*").remove();
    igroup.append("small").html("Gesture" + ":&nbsp;");
    agroup.append("small").html("Action" + ":&nbsp;");
    egroup.append("small").html("Entity" + ":&nbsp;");
    mgroup.append("small").html("Meaning" + ":&nbsp;");
    drawBadges(editList, igroup, agroup, egroup, mgroup);

    let exp = d3.select('#explore');
    exp.selectAll('*').remove();
    exp.html('Description');
}

function drawBadges(editList, igroup, agroup, egroup, mgroup) {

    // console.log(editList);

    for (let elem in editList) {
        // console.log(elem);
        if ((editList[elem][0] === "add") && (editList[elem][4] === 2)) {
            if (editList[elem][1] === "interaction") {
                igroup.append("span")
                    .attr("class", "badge badge-pill badge-secondary")
                    .html(editList[elem][2]);
            } else if (editList[elem][1] === "action") {
                agroup.append("span")
                    .attr("class", "badge badge-pill badge-secondary")
                    .html(editList[elem][2]);
            } else if (editList[elem][1] === "entity") {
                egroup.append("span")
                    .attr("class", "badge badge-pill badge-secondary")
                    .html(editList[elem][2]);
            } else if (editList[elem][1] === "meaning") {
                mgroup.append("span")
                    .attr("class", "badge badge-pill badge-secondary")
                    .html(editList[elem][2]);
            }
        } else if ((editList[elem][0] === "remove") && (editList[elem][4] === 2)) {
            // pass
            // if (editList[elem][1] === "interaction") {
            //     igroup.selectAll("*").remove();
            // } else if (editList[elem][1] === "action") {
            //     agroup.selectAll("*").remove();
            // } else if (editList[elem][1] === "entity") {
            //     egroup.selectAll("*").remove();
            // } else if (editList[elem][1] === "meaning") {
            //     mgroup.selectAll("*").remove();
            // }
        } else if ((editList[elem][0] === "remove") && (editList[elem][4] === 1)) {
            // pass
        } else {
            // console.log(editList[elem]);
            // console.log(data);
            if (editList[elem][1] === "interaction") {
                igroup.append("span")
                    .attr("class", "badge badge-pill badge-interaction")
                    .html(editList[elem][2]);
                d3.select("#interaction")
                    .attr('placeholder', editList[elem][2]);
            } else if (editList[elem][1] === "action") {
                agroup.append("span")
                    .attr("class", "badge badge-pill badge-action")
                    .html(editList[elem][2]);
                d3.select("#action")
                    .attr('placeholder', editList[elem][2]);
            } else if (editList[elem][1] === "entity") {
                egroup.append("span")
                    .attr("class", "badge badge-pill badge-entity")
                    .html(editList[elem][2]);
                d3.select("#entity")
                    .attr('placeholder', editList[elem][2]);
            } else if (editList[elem][1] === "meaning") {
                mgroup.append("span")
                    .attr("class", "badge badge-pill badge-meaning")
                    .html(editList[elem][2]);
                d3.select("#mean")
                    .attr('placeholder', editList[elem][2]);
            }
        }
    }
}

function drawNumber(d, t) {
    let narea = d3.select("#number");
    let numstr;
    // console.log(searchingQ);
    if (d === 1) {
        numstr = "This is the last filtered candidate.";
    } else if (t === 0) {
        numstr = "There are total " + d + " candidates";
    } else {
        let substr = '';
        if (searchingQ['interaction'] !== '') {
            substr = substr + ' "' + searchingQ['interaction'] + '"';
        }
        if (searchingQ['action'] !== '') {
            substr = substr + ' "' + searchingQ['action'] + '"';
        }
        if (searchingQ['entity'] !== '') {
            substr = substr + ' "' + searchingQ['entity'] + '"';
        }
        if (searchingQ['mean'] !== '') {
            substr = substr + ' "' + searchingQ['mean'] + '"';
        }
        numstr = "There are total " + d + " candidates by searching" + substr;
    }
    narea.selectAll("*").remove();
    narea.append("p")
        .append("small")
        // .attr("class", "lead")
        .html(numstr);
}
