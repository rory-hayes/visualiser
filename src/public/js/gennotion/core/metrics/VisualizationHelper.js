export class VisualizationHelper {
    constructor(calculator) {
        this.calculator = calculator;
    }

    createSnapshotSection(snapshot, title) {
        return [
            this.createSubheading(title),
            this.createBulletedList([
                `Total Nodes: ${snapshot.metrics.totalNodes}`,
                `Active Members: ${snapshot.metrics.totalMembers}`,
                `Total Connections: ${snapshot.metrics.totalConnections}`,
                `Connection Density: ${(snapshot.metrics.connectionDensity * 100).toFixed(1)}%`,
                `Collaboration Score: ${snapshot.metrics.collaborationScore.toFixed(1)}`,
                `Active Nodes: ${snapshot.metrics.activeNodes}`,
                `Identified Silos: ${snapshot.metrics.silos}`
            ]),
            this.createDivider()
        ];
    }

    createVisualizationBlocks(visualizationData) {
        const blocks = [];
        
        // Add visualization description
        blocks.push(
            this.createParagraph("Workspace Structure Visualization:"),
            this.createBulletedList([
                "Node size represents the number of pages/documents",
                "Connections show collaboration patterns",
                "Colors indicate different page types/departments"
            ])
        );

        // Add visualization data as a code block for potential future rendering
        blocks.push({
            type: "code",
            code: {
                language: "json",
                content: JSON.stringify(visualizationData, null, 2)
            }
        });

        return blocks;
    }

    createDivider() {
        return {
            type: "divider"
        };
    }

    createSubheading(title) {
        return {
            object: 'block',
            type: 'heading_2',
            heading_2: {
                rich_text: [{
                    type: 'text',
                    text: { content: title }
                }]
            }
        };
    }

    createParagraph(text) {
        return {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [{
                    type: 'text',
                    text: { content: text }
                }]
            }
        };
    }

    createBulletedList(items) {
        return items.map(item => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
                rich_text: [{
                    type: 'text',
                    text: { content: item }
                }]
            }
        }));
    }
} 