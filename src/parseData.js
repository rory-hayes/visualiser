export function parseDataToGraph(data) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();

    data.forEach((item) => {
        const title = item.properties?.title?.[0]?.text?.content || `Unnamed ${item.object}`;
        nodes.push({
            id: item.id,
            name: title,
            type: item.object,
        });
        nodeIds.add(item.id);
    });

    data.forEach((item) => {
        if (item.parent?.database_id) {
            links.push({ source: item.parent.database_id, target: item.id });
        }
    });

    return { nodes, links };
}