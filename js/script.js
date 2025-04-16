const width = 2000;
const height = 750;

function removeAfterEqual(str) {
    const index = str.indexOf('<');
    return index === -1 ? str : str.slice(0, index);
}

function removeHomeOrAwayWin(str) {
    if (str === "Home win" || str === "Away win") {
        return "";
    }
    return str;
}

function init() {
    d3.json("random_forest.json")
        .then(data => {
            const firstChild = data[0].children[0];  // "tree_0"
            const root = d3.hierarchy(firstChild);

            // Make the tree smaller inside the large canvas
            const treeLayout = d3.tree().size([700, 600]); // Smaller tree layout

            treeLayout(root);

            const svg = d3.select("#vis").append("svg")
                .attr("width", width)
                .attr("height", height);

            const g = svg.append("g")
                .attr("transform", "translate(100,100)"); // Center the smaller tree a bit

            // Draw links
            g.selectAll(".link")
                .data(root.links())
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)
                .attr("stroke", "#ccc")
                .attr("stroke-width", 2);

            // Draw nodes
            const nodes = g.selectAll(".node")
                .data(root.descendants())
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${d.x},${d.y})`);

            nodes.append("circle")
                .attr("r", 8)
                .attr("fill", d => {
                    if (d.data.name === "Home win") return "#69b3a2";
                    else if (d.data.name === "Away win") return "#ff6347";
                    else return "#ADD8E6"; // default
                });

            nodes.append("text")
                .attr("dy", -10)
                .attr("text-anchor", "middle")
                .text(d => removeHomeOrAwayWin(removeAfterEqual(d.data.name)))
                .style("font-size", "8px");

            // Add Legend
            const legend = svg.append("g")
                .attr("transform", "translate(35, 50)"); // Position the legend

            // Home win legend
            legend.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#69b3a2")
                .attr("stroke", "#000") // Add border for visibility
                .attr("stroke-width", 1); // Border width

            legend.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .text("Home win")
                .style("font-size", "12px");

            // Away win legend
            legend.append("rect")
                .attr("x", 0)
                .attr("y", 30)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#ff6347")
                .attr("stroke", "#000") // Add border for visibility
                .attr("stroke-width", 1); // Border width

            legend.append("text")
                .attr("x", 30)
                .attr("y", 45)
                .text("Away win")
                .style("font-size", "12px");
        })
        .catch(error => console.error('Error loading random_forest.json:', error));
}

window.addEventListener('load', init);
