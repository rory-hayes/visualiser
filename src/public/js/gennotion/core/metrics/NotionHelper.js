export class NotionHelper {
    constructor(calculator) {
        this.calculator = calculator;
    }

    async createNotionEntry(workspaceId, metrics) {
        try {
            console.log('DEBUG - createNotionEntry called with:', {
                workspaceId,
                metricsKeys: Object.keys(metrics)
            });
            
            if (!workspaceId) {
                throw new Error('Workspace ID is required');
            }

            // Format metrics for Notion blocks
            const blocks = [
                {
                    object: 'block',
                    type: 'heading_1',
                    heading_1: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'Workspace Analysis Report' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{
                            type: 'text',
                            text: { content: `Workspace ID: ${workspaceId}` }
                        }]
                    }
                }
            ];

            // Add metrics sections with actual values from metrics object
            const sections = {
                'Structure & Evolution Metrics': [
                    `Total Pages: ${metrics['[[total_pages]]']}`,
                    `Max Depth: ${metrics['[[max_depth]]']}`,
                    `Average Depth: ${metrics['[[avg_depth]]']}`,
                    `Root Pages: ${metrics['[[root_pages]]']}`,
                    `Deep Pages Count: ${metrics['[[deep_pages_count]]']}`,
                    `Orphaned Blocks: ${metrics['[[orphaned_blocks]]']}`,
                    `Collections Count: ${metrics['[[collections_count]]']}`,
                    `Collection Views: ${metrics['[[collection_views]]']}`,
                    `Template Count: ${metrics['[[template_count]]']}`,
                    `Content Maturity Score: ${metrics['[[content_maturity_score]]']}`,
                    `Growth Sustainability Index: ${metrics['[[growth_sustainability_index]]']}`,
                    `Workspace Complexity Score: ${metrics['[[workspace_complexity_score]]']}`,
                    `Knowledge Structure Score: ${metrics['[[knowledge_structure_score]]']}`
                ],
                'Collaboration & Content Quality': [
                    `Team Adoption Score: ${metrics['[[team_adoption_score]]']}`,
                    `Collaboration Density: ${metrics['[[collaboration_density]]']}`,
                    `Knowledge Sharing Index: ${metrics['[[knowledge_sharing_index]]']}`,
                    `Cross Team Collaboration Score: ${metrics['[[cross_team_collaboration_score]]']}`,
                    `Content Freshness Score: ${metrics['[[content_freshness_score]]']}`,
                    `Structure Quality Index: ${metrics['[[structure_quality_index]]']}`,
                    `Knowledge Base Health: ${metrics['[[knowledge_base_health]]']}`,
                    `Documentation Coverage: ${metrics['[[documentation_coverage]]']}%`
                ],
                'Usage & Predictive Metrics': [
                    `Automation Effectiveness: ${metrics['[[automation_effectiveness]]']}%`,
                    `Integration Impact Score: ${metrics['[[integration_impact_score]]']}`,
                    `Feature Utilization Index: ${metrics['[[feature_utilization_index]]']}`,
                    `Advanced Features Adoption: ${metrics['[[advanced_features_adoption]]']}`,
                    `Growth Trajectory: ${metrics['[[growth_trajectory]]']}`,
                    `Scaling Readiness Score: ${metrics['[[scaling_readiness_score]]']}`,
                    `Growth Potential Score: ${metrics['[[growth_potential_score]]']}`
                ],
                'Trends & Collections': [
                    `Monthly Growth Rates: ${metrics['[[monthly_growth_rates]]']}`,
                    `Creation Velocity: ${metrics['[[creation_velocity]]']}`,
                    `Blocks Created Last Month: ${metrics['[[blocks_created_last_month]]']}`,
                    `Blocks Created Last Year: ${metrics['[[blocks_created_last_year]]']}`,
                    `Total Collections: ${metrics['[[total_collections]]']}`,
                    `Linked Database Count: ${metrics['[[linked_database_count]]']}`,
                    `Collection Health Score: ${metrics['[[collection_health_score]]']}`,
                    `Collection Usage Ratio: ${metrics['[[collection_usage_ratio]]']}`
                ],
                'Key Insights': [
                    `Monthly Content Growth Rate: ${metrics['[[key_metrics_insight_1]]']}%`,
                    `Monthly Member Growth Rate: ${metrics['[[key_metrics_insight_2]]']}%`,
                    `Total Members and Guests: ${metrics['[[key_metrics_insight_4]]']}`,
                    `Average Members per Teamspace: ${metrics['[[key_metrics_insight_5]]']}`,
                    `Total Integrations: ${metrics['[[key_metrics_insight_12]]']}`,
                    `Active Pages Ratio: ${metrics['[[key_metrics_insight_13]]']}`
                ]
            };

            // Add optimization opportunities if available
            if (metrics['[[optimization_opportunities]]']) {
                sections['Optimization Opportunities'] = 
                    Array.isArray(metrics['[[optimization_opportunities]]']) ? 
                        metrics['[[optimization_opportunities]]'] : 
                        [metrics['[[optimization_opportunities]]']];
            }

            // Add each section to blocks
            for (const [title, items] of Object.entries(sections)) {
                // Add section heading
                blocks.push({
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{
                            type: 'text',
                            text: { content: title }
                        }]
                    }
                });

                // Add metrics as bullet points
                items.forEach(item => {
                    if (item) {  // Only add non-empty items
                        blocks.push({
                            object: 'block',
                            type: 'bulleted_list_item',
                            bulleted_list_item: {
                                rich_text: [{
                                    type: 'text',
                                    text: { content: item }
                                }]
                            }
                        });
                    }
                });
            }

            // Create the page in Notion
            const response = await this.calculator.notion.pages.create({
                parent: {
                    type: 'database_id',
                    database_id: this.calculator.NOTION_DATABASE_ID
                },
                properties: {
                    Title: {
                        title: [
                            {
                                text: {
                                    content: "Workspace Analysis Report"
                                }
                            }
                        ]
                    },
                    "Workspace ID": {
                        rich_text: [
                            {
                                text: {
                                    content: workspaceId
                                }
                            }
                        ]
                    }
                },
                children: blocks
            });

            console.log('Successfully created Notion page:', response.id);
            return response.id;

        } catch (error) {
            console.error('Error in createNotionEntry:', error);
            throw error;
        }
    }
} 