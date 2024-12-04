export function calculateWorkspaceScore({ nodes }) {
    let score = 100;

    nodes.forEach((node) => {
        if (!node.name || node.name.startsWith('Unnamed')) score -= 5;
    });

    return Math.max(0, score);
}