const width = 1500;
const height = 750;


async function getData(n) {
    const url = `http://localhost:5000/train?numTrees=${n}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json = await response.json();
      console.log(json);
    } catch (error) {
      console.error(error.message);
    }
  }

function cleanName(str) {
    if (!str) return "";
    const index = str.indexOf('<');
    let cleaned = index === -1 ? str : str.slice(0, index);
    return (cleaned === "Home win" || cleaned === "Away win") ? "" : cleaned;
}

function init() {

    
    
    
    d3.json("random_forest.json")
        .then(data => {
            const trees = data[0].children;
            const numTrees = trees.length;
            const maxTreeWidth = width / numTrees - 50; // Give 50px margin
            const treeHeight = 600;

            const svg = d3.select("#vis").append("svg")
                .attr("width", width)
                .attr("height", height);

            // Tooltip
            const tooltip = d3.select("#vis")
                .append("div")
                .style("position", "absolute")
                .style("background", "#fff")
                .style("border", "1px solid #999")
                .style("padding", "5px 8px")
                .style("border-radius", "6px")
                .style("pointer-events", "none")
                .style("font-size", "12px")
                .style("opacity", 0);

            trees.forEach((treeData, index) => {
                const root = d3.hierarchy(treeData);
                const treeLayout = d3.tree().size([maxTreeWidth, treeHeight]);
                treeLayout(root);

                const xOffset = (index * width) / numTrees + 25; // 25 for side padding

                const g = svg.append("g")
                    .attr("transform", `translate(${xOffset}, 100)`);

                const link = g.selectAll(".link")
                    .data(root.links())
                    .enter().append("line")
                    .attr("class", "link")
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y)
                    .attr("stroke", "#ccc")
                    .attr("stroke-width", 2)
                    .style("opacity", 0);

                const node = g.selectAll(".node")
                    .data(root.descendants())
                    .enter().append("g")
                    .attr("class", "node")
                    .attr("transform", d => `translate(${d.x},${d.y})`)
                    .style("opacity", 0);

                node.append("circle")
                    .attr("r", 8)
                    .attr("fill", d => {
                        if (d.data.name === "Home win") return "#69b3a2";
                        else if (d.data.name === "Away win") return "#ff6347";
                        else return "#ADD8E6";
                    })
                    .on("mouseover", function (event, d) {
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip.html(d.data.name)
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 28}px`);
                    })
                    .on("mouseout", () => {
                        tooltip.transition().duration(300).style("opacity", 0);
                    });

                node.append("text")
                    .attr("dy", -10)
                    .attr("text-anchor", "middle")
                    .text(d => cleanName(d.data.name))
                    .style("font-size", "8px");

                // Animate depth-by-depth
                const maxDepth = d3.max(root.descendants(), d => d.depth);
                const timing = 1500;
                for (let depth = 0; depth <= maxDepth; depth++) {
                    setTimeout(() => {
                        node.filter(d => d.depth === depth)
                            .transition()
                            .duration(timing)
                            .style("opacity", 1);

                        link.filter(d => d.target.depth === depth)
                            .transition()
                            .duration(timing)
                            .style("opacity", 1);
                    }, depth * timing);
                }
            });

            // Add legend
            const legend = svg.append("g")
                .attr("transform", "translate(0, 0)");

            legend.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#69b3a2")
                .attr("stroke", "#000");

            legend.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .text("Home win")
                .style("font-size", "12px");

            legend.append("rect")
                .attr("x", 0)
                .attr("y", 30)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#ff6347")
                .attr("stroke", "#000");

            legend.append("text")
                .attr("x", 30)
                .attr("y", 45)
                .text("Away win")
                .style("font-size", "12px");
        })
        .catch(error => console.error('Error loading random_forest.json:', error));
}


window.addEventListener('load', init);

const treesBtn = document.getElementById('btn');
treesBtn.addEventListener('click', () => getData(1)); 


