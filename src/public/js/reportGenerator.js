// reportGenerator.js

export function calculateMetrics(dataframe_2, dataframe_3) {
    try {
        // Validate input data early
        if (!Array.isArray(dataframe_2) || !dataframe_3) {
            console.error('Invalid input data');
            return {};
        }

        // Process data in chunks to prevent memory issues
        const CHUNK_SIZE = 100;
        const metrics = {};
        
        // Process graph data in chunks
        for (let i = 0; i < dataframe_2.length; i += CHUNK_SIZE) {
            const chunk = dataframe_2.slice(i, i + CHUNK_SIZE);
            const chunkMetrics = processGraphChunk(chunk);
            Object.assign(metrics, chunkMetrics);
            
            // Clear chunk from memory
            chunk.length = 0;
        }

        // Clear original array
        dataframe_2.length = 0;

        // Process SQL data
        const sqlMetrics = calculateSQLMetrics(dataframe_3);
        Object.assign(metrics, sqlMetrics);

        // Calculate derived metrics
        const derivedMetrics = calculateDerivedMetrics(metrics);
        Object.assign(metrics, derivedMetrics);

        // Clear references
        dataframe_3 = null;

        return metrics;
    } catch (error) {
        console.error('Error in calculateMetrics:', error);
        return {};
    }
}

function processGraphChunk(chunk) {
    const metrics = {
        max_depth: 0,
        total_nodes: 0,
        root_nodes: 0,
        leaf_nodes: 0
    };

    try {
        chunk.forEach(node => {
            metrics.total_nodes++;
            
            // Calculate depth
            const depth = node.DEPTH || 0;
            metrics.max_depth = Math.max(metrics.max_depth, depth);
            
            // Count root and leaf nodes
            if (!node.PARENT_ID) {
                metrics.root_nodes++;
            }
            
            if (node.TYPE === 'page' && !hasChildren(node, chunk)) {
                metrics.leaf_nodes++;
            }
        });
    } catch (error) {
        console.error('Error processing graph chunk:', error);
    }

    return metrics;
}

function hasChildren(node, nodes) {
    return nodes.some(n => n.PARENT_ID === node.ID);
}

function calculateDerivedMetrics(metrics) {
    return {
        avg_depth: metrics.total_nodes ? metrics.max_depth / metrics.total_nodes : 0,
        branching_factor: metrics.root_nodes ? (metrics.total_nodes - metrics.root_nodes) / metrics.root_nodes : 0,
        leaf_ratio: metrics.total_nodes ? metrics.leaf_nodes / metrics.total_nodes : 0
    };
}

function calculateSQLMetrics(data) {
    try {
        // Validate required fields
        const requiredFields = [
            'num_total_pages',
            'num_pages',
            'num_collections',
            'total_num_collection_views',
            'num_public_pages',
            'total_num_integrations',
            'total_num_members',
            'total_num_guests',
            'total_num_teamspaces',
            'num_alive_pages',
            'num_private_pages',
            'num_alive_blocks',
            'num_blocks',
            'num_alive_collections',
            'total_arr',
            'total_paid_seats'
        ];

        const missingFields = requiredFields.filter(field => data[field] === undefined);
        if (missingFields.length > 0) {
            console.warn('Missing required fields in SQL data:', missingFields);
        }

        // Log input data for debugging
        console.log('SQL Metrics Input:', {
            pages: {
                total: data.num_total_pages,
                alive: data.num_alive_pages,
                public: data.num_public_pages,
                private: data.num_private_pages
            },
            blocks: {
                total: data.num_blocks,
                alive: data.num_alive_blocks
            },
            collections: {
                total: data.num_collections,
                alive: data.num_alive_collections,
                views: data.total_num_collection_views
            },
            users: {
                members: data.total_num_members,
                guests: data.total_num_guests,
                teamspaces: data.total_num_teamspaces
            }
        });

        const metrics = {
            // Page metrics
            total_pages: data.num_total_pages || 0,
            page_count: data.num_pages || 0,
            collections_count: data.num_collections || 0,
            collection_views: data.total_num_collection_views || 0,
            public_pages_count: data.num_public_pages || 0,
            num_alive_pages: data.num_alive_pages || 0,
            num_private_pages: data.num_private_pages || 0,

            // Block metrics
            num_alive_blocks: data.num_alive_blocks || 0,
            num_blocks: data.num_blocks || 0,
            num_alive_collections: data.num_alive_collections || 0,

            // User metrics
            total_num_members: data.total_num_members || 0,
            total_num_guests: data.total_num_guests || 0,
            total_num_teamspaces: data.total_num_teamspaces || 0,

            // Integration metrics
            connected_tool_count: data.total_num_integrations || 0,
            total_num_bots: data.total_num_bots || 0,
            total_num_internal_bots: data.total_num_internal_bots || 0,
            total_num_public_bots: data.total_num_public_bots || 0,
            total_num_link_preview_integrations: data.total_num_link_preview_integrations || 0,
            total_num_public_integrations: data.total_num_public_integrations || 0,

            // Historical metrics
            current_month_blocks: data.current_month_blocks || 0,
            previous_month_blocks: data.previous_month_blocks || 0,
            current_year_blocks: data.current_year_blocks || 0,
            previous_year_blocks: data.previous_year_blocks || 0,
            current_month_pages: data.current_month_pages || 0,
            previous_month_pages: data.previous_month_pages || 0,
            current_month_members: data.current_month_members || 0,
            previous_month_members: data.previous_month_members || 0,

            // Collaboration metrics
            collaborative_pages: data.collaborative_pages || 0,
            num_permission_groups: data.num_permission_groups || 0,

            // Business metrics
            total_arr: data.total_arr || 0,
            total_paid_seats: data.total_paid_seats || 0
        };

        // Log calculated metrics for debugging
        console.log('Calculated SQL Metrics:', metrics);

        return metrics;
    } catch (error) {
        console.error('Error in calculateSQLMetrics:', error);
        return {};
    }
}

function calculateGraphMetrics(graph) {
    const metrics = {
        max_depth: 0,
        avg_depth: 0,
        avg_nav_depth: 0,
        nav_depth_score: 0,
        root_pages: 0,
        deep_pages_count: 0,
        template_count: 0,
        linked_database_count: 0,
        orphaned_blocks: 0,
        scatter_index: 0,
        unfindable_pages: 0,
        duplicate_count: 0,
        duplicate_content_rate: 0,
        bottleneck_count: 0,
        nav_complexity: 0
    };
    
    try {
        // Validate input
        if (!Array.isArray(graph)) {
            console.warn('Invalid graph data: not an array');
            return metrics;
        }

        const validNodes = graph.filter(node => node && typeof node === 'object');
        if (validNodes.length === 0) {
            console.warn('No valid nodes found in graph data');
            return metrics;
        }

        // Log sample of input data
        console.log('Graph Metrics Input:', {
            totalNodes: graph.length,
            validNodes: validNodes.length,
            sampleNode: validNodes[0],
            nodeFields: validNodes[0] ? Object.keys(validNodes[0]) : []
        });

        // Calculate depth metrics
        const depths = validNodes.map(node => getNodeDepth(node, validNodes));
        const validDepths = depths.filter(d => typeof d === 'number' && isFinite(d));
        
        if (validDepths.length > 0) {
            metrics.max_depth = Math.max(...validDepths);
            metrics.avg_depth = validDepths.reduce((sum, depth) => sum + depth, 0) / validDepths.length;
            metrics.avg_nav_depth = metrics.avg_depth;
            metrics.nav_depth_score = (metrics.avg_depth * 0.4) + (metrics.max_depth * 0.6);
        }

        // Calculate page counts
        metrics.root_pages = validNodes.filter(node => !node.parent).length;
        metrics.deep_pages_count = validNodes.filter(node => getNodeDepth(node, validNodes) > 5).length;
        metrics.template_count = validNodes.filter(node => node.type === 'template').length;
        metrics.linked_database_count = validNodes.filter(node => node.type === 'collection' && node.parent).length;

        // Calculate organization metrics
        metrics.orphaned_blocks = validNodes.filter(node => !node.parent && !isRootNode(node)).length;
        metrics.scatter_index = validNodes.length > 0 ? (metrics.orphaned_blocks / validNodes.length) * 100 : 0;
        metrics.unfindable_pages = metrics.orphaned_blocks + metrics.deep_pages_count;

        // Calculate content quality metrics
        const duplicates = findDuplicateTitles(validNodes);
        metrics.duplicate_count = duplicates.length;
        metrics.duplicate_content_rate = validNodes.length > 0 ? (metrics.duplicate_count / validNodes.length) * 100 : 0;

        // Calculate navigation metrics
        metrics.bottleneck_count = validNodes.filter(node => getChildCount(node, validNodes) > 20).length;
        metrics.nav_complexity = calculateNavComplexity(metrics);

        // Log calculated metrics
        console.log('Calculated Graph Metrics:', {
            depthMetrics: {
                max: metrics.max_depth,
                avg: metrics.avg_depth,
                navScore: metrics.nav_depth_score
            },
            organizationMetrics: {
                rootPages: metrics.root_pages,
                deepPages: metrics.deep_pages_count,
                orphanedBlocks: metrics.orphaned_blocks,
                scatterIndex: metrics.scatter_index
            },
            contentMetrics: {
                duplicates: metrics.duplicate_count,
                duplicateRate: metrics.duplicate_content_rate,
                bottlenecks: metrics.bottleneck_count
            }
        });

        return metrics;
    } catch (error) {
        console.error('Error in calculateGraphMetrics:', error);
        return metrics;
    }
}

function calculateGrowthMetrics(data) {
    try {
        return {
            growth_rate: calculateRate(data?.current_month_blocks || 0, data?.previous_month_blocks || 1),
            blocks_created_last_month: Math.max((data?.current_month_blocks || 0) - (data?.previous_month_blocks || 0), 0),
            blocks_created_last_year: Math.max((data?.current_year_blocks || 0) - (data?.previous_year_blocks || 0), 0),
            pages_created_last_month: Math.max((data?.current_month_pages || 0) - (data?.previous_month_pages || 0), 0),
            monthly_member_growth_rate: calculateRate(data?.current_month_members || 0, data?.previous_month_members || 1),
            expected_members_in_next_year: Math.ceil((data?.total_num_members || 0) * (1 + (calculateRate(data?.current_month_members || 0, data?.previous_month_members || 1) / 100))),
            monthly_content_growth_rate: calculateRate(data?.current_month_blocks || 0, data?.previous_month_blocks || 1)
        };
    } catch (error) {
        console.error('Error calculating growth metrics:', error);
        return {};
    }
}

function calculateUsageMetrics(data) {
    try {
        const totalUsers = (data?.total_num_members || 0) + (data?.total_num_guests || 0);
        return {
            active_users: data?.active_users || 0,
            daily_active_users: Math.round((data?.active_users || 0) * 0.3),
            weekly_active_users: Math.round((data?.active_users || 0) * 0.7),
            monthly_active_users: data?.active_users || 0,
            average_daily_edits: Math.round((data?.current_month_blocks || 0) / 30),
            pages_per_user: totalUsers > 0 ? Math.round((data?.num_alive_pages || 0) / totalUsers) : 0,
            engagement_score: calculateScore(data?.active_users || 0, totalUsers),
            collaboration_rate: calculateScore(data?.collaborative_pages || 0, data?.num_alive_pages || 1)
        };
    } catch (error) {
        console.error('Error calculating usage metrics:', error);
        return {};
    }
}

function calculateKeyInsights(data) {
    try {
        // Log input data for debugging
        console.log('Calculating Key Insights from:', {
            blocks: {
                current: data.current_month_blocks,
                previous: data.previous_month_blocks
            },
            members: {
                current: data.current_month_members,
                previous: data.previous_month_members,
                total: data.total_num_members
            },
            pages: {
                total: data.num_total_pages,
                alive: data.num_alive_pages,
                private: data.num_private_pages
            },
            collections: {
                total: data.num_collections,
                alive: data.num_alive_collections,
                views: data.total_num_collection_views
            }
        });

        const insights = {
            // Monthly block growth rate
            key_metrics_insight_1: calculateRate(data.current_month_blocks, data.previous_month_blocks),
            
            // User growth rate
            key_metrics_insight_2: calculateRate(data.current_month_members, data.previous_month_members),
            
            // Content per user
            key_metrics_insight_3: data.num_alive_blocks / data.total_num_members || 0,
            
            // Total user base
            key_metrics_insight_4: (data.total_num_members + data.total_num_guests) || 0,
            
            // Team density
            key_metrics_insight_5: data.total_num_members / data.total_num_teamspaces || 0,
            
            // Pages per user
            key_metrics_insight_6: data.num_alive_pages / data.total_num_members || 0,
            
            // Content health
            key_metrics_insight_7: (data.num_alive_blocks / data.num_blocks * 100) || 0,
            
            // Database health
            key_metrics_insight_8: (data.num_alive_collections / data.num_collections * 100) || 0,
            
            // Team content density
            key_metrics_insight_9: data.num_blocks / data.total_num_teamspaces || 0,
            
            // Integration adoption
            key_metrics_insight_10: data.total_num_integrations || 0,
            
            // Automation adoption
            key_metrics_insight_11: calculateTotalBots(data),
            
            // Integration diversity
            key_metrics_insight_12: calculateTotalIntegrations(data),
            
            // Page utilization
            key_metrics_insight_13: (data.num_alive_pages / data.num_total_pages * 100) || 0,
            
            // Privacy ratio
            key_metrics_insight_14: (data.num_private_pages / data.num_total_pages * 100) || 0,
            
            // Database usage
            key_metrics_insight_15: (data.total_num_collection_views / data.num_total_pages * 100) || 0,
            
            // Block utilization
            key_metrics_insight_16: (data.num_alive_blocks / data.num_blocks * 100) || 0,
            
            // Content per user
            key_metrics_insight_17: data.num_alive_blocks / data.total_num_members || 0,
            
            // Content growth rate
            key_metrics_insight_18: calculateRate(data.current_month_blocks, data.previous_month_blocks)
        };

        // Log calculated insights for debugging
        console.log('Calculated Key Insights:', insights);

        return insights;
    } catch (error) {
        console.error('Error in calculateKeyInsights:', error);
        return {};
    }
}

function calculateCombinedMetrics(metrics) {
    try {
        // Log input metrics
        console.log('Combined Metrics Input:', {
            navMetrics: {
                maxDepth: metrics.max_depth,
                avgDepth: metrics.avg_depth,
                orphanedBlocks: metrics.orphaned_blocks,
                totalPages: metrics.total_pages
            },
            contentMetrics: {
                duplicateCount: metrics.duplicate_count,
                totalPages: metrics.total_pages
            },
            collaborationMetrics: {
                teamspacesWithGuests: metrics.teamspaces_with_guests,
                totalTeamspaces: metrics.total_num_teamspaces,
                avgTeamspaceMembers: metrics.average_teamspace_members
            }
        });

        const combinedMetrics = {
            // Navigation metrics
            nav_complexity: calculateNavComplexity(metrics),
            duplicate_content_rate: safeDivide(metrics.duplicate_count, metrics.total_pages) * 100,
            percentage_unlinked: safeDivide(metrics.orphaned_blocks, metrics.total_pages) * 100,

            // Collaboration metrics
            current_collaboration_score: calculateCollaborationScore(metrics),
            current_visibility_score: calculateVisibilityScore(metrics),
            projected_visibility_score: (calculateVisibilityScore(metrics) || 0) * 1.3,

            // Productivity metrics
            current_productivity_score: calculateProductivityScore(metrics),
            ai_productivity_gain: (calculateProductivityScore(metrics) || 0) * 1.4,

            // Automation metrics
            automation_potential: calculateAutomationPotential(metrics),
            projected_time_savings: calculateProjectedTimeSavings(metrics),

            // Organization metrics
            current_organization_score: calculateOrganizationScore(metrics),
            projected_organisation_score: (calculateOrganizationScore(metrics) || 0) * 1.3,
            security_improvement_score: calculateSecurityScore(metrics),
            success_improvement: 0, // Will be calculated below

            // Team metrics
            teamspace_optimisation_potential: safeDivide(metrics.underutilised_teamspaces, metrics.total_num_teamspaces) * 100,
            automation_efficiency_gain: metrics.automation_usage_rate ? metrics.automation_usage_rate * 1.5 : 0
        };

        // Calculate success improvement after other scores are calculated
        combinedMetrics.success_improvement = 
            (combinedMetrics.projected_organisation_score || 0) - 
            (combinedMetrics.current_organization_score || 0);

        // Log results
        console.log('Combined Metrics Results:', combinedMetrics);

        // Validate results
        Object.keys(combinedMetrics).forEach(key => {
            if (!isFinite(combinedMetrics[key])) {
                console.warn(`Invalid ${key}:`, combinedMetrics[key]);
                combinedMetrics[key] = 0;
            }
        });

        return combinedMetrics;
    } catch (error) {
        console.error('Error in calculateCombinedMetrics:', error);
        return {
            nav_complexity: 0,
            duplicate_content_rate: 0,
            percentage_unlinked: 0,
            current_collaboration_score: 0,
            current_visibility_score: 0,
            projected_visibility_score: 0,
            current_productivity_score: 0,
            ai_productivity_gain: 0,
            automation_potential: 0,
            projected_time_savings: 0,
            current_organization_score: 0,
            projected_organisation_score: 0,
            security_improvement_score: 0,
            success_improvement: 0,
            teamspace_optimisation_potential: 0,
            automation_efficiency_gain: 0
        };
    }
}

// Helper function for safe division
function safeDivide(numerator, denominator) {
    if (!numerator || !denominator || denominator === 0) {
        return 0;
    }
    const result = numerator / denominator;
    return isFinite(result) ? result : 0;
}

function calculateNavComplexity(metrics) {
    try {
        if (!metrics.max_depth || !metrics.avg_depth || !metrics.total_pages) {
            return 0;
        }
        return (metrics.max_depth * 0.3) + 
               (metrics.avg_depth * 0.3) + 
               safeDivide(metrics.orphaned_blocks, metrics.total_pages) * 0.4;
    } catch (error) {
        console.error('Error in calculateNavComplexity:', error);
        return 0;
    }
}

function calculateOrganizationScore(metrics) {
    try {
        if (!metrics.current_visibility_score || 
            !metrics.current_collaboration_score || 
            !metrics.current_productivity_score) {
            return 0;
        }
        return (metrics.current_visibility_score * 0.3) +
               (metrics.current_collaboration_score * 0.4) +
               (metrics.current_productivity_score * 0.3);
    } catch (error) {
        console.error('Error in calculateOrganizationScore:', error);
        return 0;
    }
}

function calculateAutomationPotential(metrics) {
    try {
        if (!metrics.total_num_integrations || !metrics.total_num_members) {
            return 0;
        }
        return safeDivide(metrics.total_num_integrations, (metrics.total_num_members * 0.5)) * 100;
    } catch (error) {
        console.error('Error in calculateAutomationPotential:', error);
        return 0;
    }
}

function calculateProjectedTimeSavings(metrics) {
    try {
        const averageManualHours = 2;
        if (!metrics.automation_potential || !metrics.total_num_members) {
            return 0;
        }
        return (metrics.automation_potential / 100) * averageManualHours * metrics.total_num_members;
    } catch (error) {
        console.error('Error in calculateProjectedTimeSavings:', error);
        return 0;
    }
}

function calculateROIMetrics(data, metrics) {
    try {
        // Constants
        const enterpriseCost = 20;
        const enterpriseAICost = 25;
        const implementationCost = 5000;

        // Validate inputs
        const paidSeats = toNumber(data.total_paid_seats);
        const totalArr = toNumber(data.total_arr);

        // Calculate current cost per seat
        const current = paidSeats > 0 ? totalArr / paidSeats : 0;
        
        // Calculate enterprise costs
        const enterprise = paidSeats * enterpriseCost;
        const enterpriseAI = paidSeats * enterpriseAICost;

        // Log calculations
        console.log('ROI Calculation Inputs:', {
            paidSeats,
            totalArr,
            currentCostPerSeat: current,
            enterpriseCost: enterprise,
            enterpriseAICost: enterpriseAI
        });

        const roiMetrics = {
            current_plan: current,
            enterprise_plan: enterprise,
            enterprise_plan_w_ai: enterpriseAI,
            '10_percent_increase': calculateIncrease(0.1, paidSeats, enterprise, current),
            '20_percent_increase': calculateIncrease(0.2, paidSeats, enterprise, current),
            '50_percent_increase': calculateIncrease(0.5, paidSeats, enterprise, current),
            '10_percent_increase_w_ai': calculateIncrease(0.1, paidSeats, enterpriseAI, current),
            '20_percent_increase_w_ai': calculateIncrease(0.2, paidSeats, enterpriseAI, current),
            '50_percent_increase_w_ai': calculateIncrease(0.5, paidSeats, enterpriseAI, current),
            enterprise_plan_roi: calculateEnterpriseROI(metrics, current, enterprise, implementationCost),
            enterprise_plan_w_ai_roi: calculateEnterpriseROI(metrics, current, enterpriseAI, implementationCost, true)
        };

        // Log results
        console.log('ROI Calculation Results:', roiMetrics);

        return roiMetrics;
    } catch (error) {
        console.error('Error in calculateROIMetrics:', error);
        return {
            current_plan: 0,
            enterprise_plan: 0,
            enterprise_plan_w_ai: 0,
            '10_percent_increase': 0,
            '20_percent_increase': 0,
            '50_percent_increase': 0,
            '10_percent_increase_w_ai': 0,
            '20_percent_increase_w_ai': 0,
            '50_percent_increase_w_ai': 0,
            enterprise_plan_roi: 0,
            enterprise_plan_w_ai_roi: 0
        };
    }
}

function calculateEnterpriseROI(metrics, currentCost, newCost, implementationCost, includeAI = false) {
    try {
        // Validate inputs
        if (!metrics || !metrics.current_productivity_score || implementationCost <= 0) {
            console.warn('Invalid inputs for ROI calculation:', {
                hasMetrics: !!metrics,
                productivityScore: metrics?.current_productivity_score,
                implementationCost
            });
            return 0;
        }

        const projectedBenefit = metrics.current_productivity_score * (includeAI ? 1.4 : 1.2);
        const roi = ((projectedBenefit - currentCost) / implementationCost) * 100;

        // Log calculation
        console.log('Enterprise ROI Calculation:', {
            currentCost,
            newCost,
            projectedBenefit,
            implementationCost,
            includeAI,
            roi
        });

        return isFinite(roi) ? roi : 0;
    } catch (error) {
        console.error('Error in calculateEnterpriseROI:', error);
        return 0;
    }
}

function calculateIncrease(percentage, seats, newPlan, currentPlan) {
    try {
        if (!seats || !isFinite(newPlan) || !isFinite(currentPlan)) {
            console.warn('Invalid inputs for increase calculation:', {
                percentage,
                seats,
                newPlan,
                currentPlan
            });
            return 0;
        }

        const increase = seats * (1 + percentage) * (newPlan - currentPlan);
        return isFinite(increase) ? increase : 0;
    } catch (error) {
        console.error('Error in calculateIncrease:', error);
        return 0;
    }
}

// Helper function to safely convert to number
function toNumber(value) {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

function calculateVisibilityScore(metrics) {
    try {
        return (metrics.num_public_pages / metrics.num_total_pages * 0.4) +
               (metrics.num_permission_groups / metrics.total_num_members * 0.6) * 100;
    } catch (error) {
        console.error('Error in calculateVisibilityScore:', error);
        return 0;
    }
}

function calculateCollaborationScore(metrics) {
    try {
        return ((metrics.teamspaces_with_guests / metrics.total_num_teamspaces * 0.5) +
                (metrics.average_teamspace_members / 10 * 0.5)) * 100;
    } catch (error) {
        console.error('Error in calculateCollaborationScore:', error);
        return 0;
    }
}

function calculateProductivityScore(metrics) {
    try {
        return (metrics.num_alive_blocks / metrics.total_num_members) / 100;
    } catch (error) {
        console.error('Error in calculateProductivityScore:', error);
        return 0;
    }
}

function calculateSecurityScore(metrics) {
    try {
        return (metrics.num_private_pages / metrics.num_total_pages * 0.4) +
               (metrics.num_permission_groups / metrics.total_num_members * 0.6) * 100;
    } catch (error) {
        console.error('Error in calculateSecurityScore:', error);
        return 0;
    }
}

function calculateSuccessImprovement(metrics) {
    return metrics.projected_organisation_score - metrics.current_organization_score;
}

function calculateProjectedGrowth(current, monthlyRate) {
    return current * Math.pow(1 + monthlyRate/100, 12);
}

function calculateTotalBots(data) {
    return (data.total_num_bots || 0) + 
           (data.total_num_internal_bots || 0) + 
           (data.total_num_public_bots || 0);
}

function calculateTotalIntegrations(data) {
    return (data.total_num_link_preview_integrations || 0) + 
           (data.total_num_public_integrations || 0);
}

function markUnavailableMetrics(metrics) {
    const unavailable = [
        'daily_active_pages',
        'weekly_edits',
        'stale_content_count',
        'search_deadends',
        'load_time_impact',
        'resource_usage',
        'api_calls_monthly',
        'top_collaborators',
        'current_ai_usage',
        'sensitive_content_count',
        'unusual_access_patterns',
        'search_success_rate',
        'search_time_reduction',
        'current_support_time',
        'available_training',
        'admin_feature_usage'
    ];
    
    unavailable.forEach(metric => {
        metrics[metric] = null;
    });
}

export function generateReport(markdownTemplate, metrics) {
    try {
        let report = markdownTemplate;
        for (const [key, value] of Object.entries(metrics)) {
            const placeholder = `[[${key}]]`;
            const displayValue = value ?? "Not available";
            report = report.replace(new RegExp(placeholder, 'g'), displayValue);
        }
        return report;
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}

// Helper functions
function getNodeDepth(node, graph, cache = new Map()) {
    try {
        // Early return if node is invalid
        if (!node || typeof node !== 'object') {
            return 0;
        }

        // Check if we have a valid node ID
        const nodeId = node.id || node.nodeId || node.node_id;
        if (!nodeId) {
            return 0;
        }

        // Use cached value if available
        if (cache.has(nodeId)) {
            return cache.get(nodeId);
        }

        // If no parent, it's a root node
        if (!node.parent) {
            cache.set(nodeId, 0);
            return 0;
        }

        // Find parent node
        const parentNode = graph.find(n => {
            const nId = n.id || n.nodeId || n.node_id;
            return nId === node.parent;
        });

        if (!parentNode) {
            cache.set(nodeId, 0);
            return 0;
        }

        // Calculate depth recursively
        const depth = 1 + getNodeDepth(parentNode, graph, cache);
        cache.set(nodeId, depth);
        return depth;
    } catch (error) {
        console.error('Error in getNodeDepth:', error);
        return 0;
    }
}

function calculateAverageDepth(graph) {
    if (!Array.isArray(graph) || graph.length === 0) {
        return 0;
    }

    const validNodes = graph.filter(node => node && typeof node === 'object');
    if (validNodes.length === 0) {
        return 0;
    }

    const depths = validNodes.map(node => getNodeDepth(node, graph));
    const sum = depths.reduce((acc, depth) => acc + depth, 0);
    return sum / validNodes.length;
}

function getChildCount(node, graph) {
    if (!node || !Array.isArray(graph)) {
        return 0;
    }

    const nodeId = node.id || node.nodeId || node.node_id;
    if (!nodeId) {
        return 0;
    }

    return graph.filter(n => {
        if (!n || typeof n !== 'object') return false;
        return n.parent === nodeId;
    }).length;
}

function isRootNode(node) {
    if (!node || typeof node !== 'object') {
        return false;
    }
    return node.type === 'page' && !node.parent;
}

function findDuplicateTitles(graph) {
    if (!Array.isArray(graph)) {
        return [];
    }

    const titles = new Map();
    const duplicates = [];

    graph.forEach(node => {
        if (!node || typeof node !== 'object' || !node.title) {
            return;
        }

        const normalizedTitle = node.title.trim().toLowerCase();
        if (titles.has(normalizedTitle)) {
            duplicates.push(node);
        } else {
            titles.set(normalizedTitle, true);
        }
    });

    return duplicates;
}

function calculateRate(current, previous) {
    if (!current || !previous || previous === 0) {
        return 0;
    }
    return ((current - previous) / previous) * 100;
}

function calculateAverage(total, count) {
    if (!total || !count || count === 0) {
        return 0;
    }
    return total / count;
}

function calculateScore(value, max) {
    if (!value || !max || max === 0) {
        return 0;
    }
    return Math.min((value / max) * 100, 100);
}

function validateAndTransformData(data) {
    // Create a new object with validated and transformed data
    const validated = {};
    
    // Helper function to convert to number
    const toNumber = (value) => {
        if (value === undefined || value === null) return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };

    // Page metrics
    validated.num_total_pages = toNumber(data.num_total_pages);
    validated.num_pages = toNumber(data.num_pages);
    validated.num_alive_pages = toNumber(data.num_alive_pages);
    validated.num_public_pages = toNumber(data.num_public_pages);
    validated.num_private_pages = toNumber(data.num_private_pages);

    // Block metrics
    validated.num_blocks = toNumber(data.num_blocks);
    validated.num_alive_blocks = toNumber(data.num_alive_blocks);
    validated.current_month_blocks = toNumber(data.current_month_blocks);
    validated.previous_month_blocks = toNumber(data.previous_month_blocks);
    validated.current_year_blocks = toNumber(data.current_year_blocks);
    validated.previous_year_blocks = toNumber(data.previous_year_blocks);

    // User metrics
    validated.total_num_members = toNumber(data.total_num_members);
    validated.total_num_guests = toNumber(data.total_num_guests);
    validated.total_num_teamspaces = toNumber(data.total_num_teamspaces);
    validated.current_month_members = toNumber(data.current_month_members);
    validated.previous_month_members = toNumber(data.previous_month_members);

    // Collection metrics
    validated.num_collections = toNumber(data.num_collections);
    validated.num_alive_collections = toNumber(data.num_alive_collections);
    validated.total_num_collection_views = toNumber(data.total_num_collection_views);

    // Integration metrics
    validated.total_num_integrations = toNumber(data.total_num_integrations);
    validated.total_num_bots = toNumber(data.total_num_bots);
    validated.total_num_internal_bots = toNumber(data.total_num_internal_bots);
    validated.total_num_public_bots = toNumber(data.total_num_public_bots);
    validated.total_num_link_preview_integrations = toNumber(data.total_num_link_preview_integrations);
    validated.total_num_public_integrations = toNumber(data.total_num_public_integrations);

    // Business metrics
    validated.total_arr = toNumber(data.total_arr);
    validated.total_paid_seats = toNumber(data.total_paid_seats);

    // Additional metrics
    validated.collaborative_pages = toNumber(data.collaborative_pages);
    validated.num_permission_groups = toNumber(data.num_permission_groups);
    validated.active_users = toNumber(data.active_users);
    validated.daily_active_users = toNumber(data.daily_active_users);
    validated.weekly_active_users = toNumber(data.weekly_active_users);
    validated.monthly_active_users = toNumber(data.monthly_active_users);
    validated.average_daily_edits = toNumber(data.average_daily_edits);
    validated.average_weekly_edits = toNumber(data.average_weekly_edits);
    validated.total_edits = toNumber(data.total_edits);

    // Log validation results
    console.log('Data Validation Results:', {
        hasZeroMembers: validated.total_num_members === 0,
        hasZeroPages: validated.num_total_pages === 0,
        hasZeroBlocks: validated.num_blocks === 0,
        invalidRatios: {
            pagesPerUser: validated.total_num_members === 0 ? 'Invalid (no members)' : 'Valid',
            contentHealth: validated.num_blocks === 0 ? 'Invalid (no blocks)' : 'Valid',
            teamDensity: validated.total_num_teamspaces === 0 ? 'Invalid (no teamspaces)' : 'Valid'
        }
    });

    return validated;
}