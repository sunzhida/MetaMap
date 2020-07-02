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


// Set the dimensions and margins of the diagram
const w = window.innerWidth - 30;
const h = window.innerHeight - 100;
const margin = {top: 10, right: 120, bottom: 10, left: 120};
let width = w - margin.right - margin.left;
let height = h - margin.top - margin.bottom;

let treeData = {
    "name": "Hope",
    "parent": "null",
    "weight": 4.5,
    "children": [{
        "name": "Window",
        "parent": "Hope",
        "weight": 2.2,
        "children": [{
            "name": "Open",
            "parent": "Window",
            "weight": 2.4,
            "children": [{
                "parent": "Open",
                "name": "Spread",
                "weight": 3.2
            },
                {
                    "parent": "Open",
                    "weight": 1.6,
                    "name": "Tap"
                },
                {
                    "parent": "Open",
                    "weight": 0.3,
                    "name": "Pinch"
                }
            ]
        },
            {
                "name": "Close",
                "parent": "Window",
                "weight": 1.6,
                "children": [{
                    "parent": "Close",
                    "weight": 2.9,
                    "name": "Pinch"
                },
                    {
                        "parent": "Close",
                        "weight": 1.2,
                        "name": "Fold"
                    }
                ]
            },
            {
                "name": "Display",
                "parent": "Window",
                "weight": 0.9,
                "children": [{
                    "parent": "Display",
                    "weight": 2.2,
                    "name": "Show"
                },
                    {
                        "parent": "Display",
                        "weight": 1.6,
                        "name": "Spread"
                    },
                    {
                        "parent": "Display",
                        "weight": 0.7,
                        "name": "Stretch"
                    }
                ]
            }
        ]
    },
        {
            "name": "Wing",
            "parent": "Hope",
            "weight": 1.4,
            "children": [{
                "name": "Raise",
                "parent": "Wing",
                "weight": 1.9,
                "children": [{
                    "parent": "Raise",
                    "weight": 3.6,
                    "name": "Lift"
                },
                    {
                        "parent": "Raise",
                        "weight": 2.3,
                        "name": "Push"
                    },
                    {
                        "parent": "Raise",
                        "weight": 1.4,
                        "name": "Pull"
                    }
                ]
            },
                {
                    "name": "Flap",
                    "parent": "Wing",
                    "weight": 1.2,
                    "children": [{
                        "parent": "Flap",
                        "weight": 2.9,
                        "name": "Beat"
                    },
                        {
                            "parent": "Flap",
                            "weight": 1.5,
                            "name": "Fold"
                        },
                        {
                            "parent": "Flap",
                            "weight": 0.7,
                            "name": "Wave"
                        }
                    ]
                },
                {
                    "name": "Spread",
                    "weight": 0.7,
                    "parent": "Wing",
                    "children": [{
                        "parent": "Spread",
                        "weight": 2.8,
                        "name": "Span"
                    },
                        {
                            "parent": "Spread",
                            "weight": 2.2,
                            "name": "Stretch"
                        }
                    ]
                }
            ]
        }
    ]
};



// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svg = d3.select("#vis").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate("
        + margin.left + "," + margin.top + ")");

let i = 0,
    duration = 250,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([height, width]);

// Assigns parent, children, height, depth
root = d3.hierarchy(treeData, function (d) {
    return d.children;
});
root.x0 = height / 2;
root.y0 = 0;

// Collapse after the second level
root.children.forEach(collapse);

update(root);

// Collapse the node and all it's children
function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function update(source) {

    // Assigns the x and y position for the nodes
    let treeData = treemap(root);

    // Compute the new tree layout.
    let nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
        console.log(d);
        d.y = d.depth * width / 3
    });

    // ****************** Nodes section ***************************

    // Update the nodes...
    let node = svg.selectAll('g.node')
        .data(nodes, function (d) {
            console.log(i);
            return d.id || (d.id = ++i);
        });

    // Enter any new modes at the parent's previous position.
    let nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            console.log(d);
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function (d) {
            return d._children ? "steelblue" : "#fff";
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", function (d) {
            return d.children || d._children ? -35 : 35;
        })
        .attr("text-anchor", function (d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function (d) {
            return d.data.name;
        });

    // UPDATE
    let nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', function (d) {
            return d['data']['weight']*10;
        })
        .style("fill", function (d) {
            console.log(d);
            return d._children ? "steelblue" : "#fff";
        })
        .attr('cursor', 'pointer');

    // Remove any exiting nodes
    let nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    let link = svg.selectAll('path.link')
        .data(links, function (d) {
            console.log(d);
            return d.id;
        });

    // Enter any new links at the parent's previous position.
    let linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function (d) {
            console.log(d);
            let o = {x: source.x0, y: source.y0}
            return diagonal(o, o)
        })
        .attr('stroke-width', function (d) {
            console.log(d);
            return d['data']['weight'];
        });

    // UPDATE
    let linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) {
            return diagonal(d, d.parent)
        })
        .attr('stroke-width', function (d) {
            console.log(d);
            return d['data']['weight'];
        });

    // Remove any exiting links
    let linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = {x: source.x, y: source.y};
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
        console.log(s, d);

        let path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;

        return path;
    }

    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
}
