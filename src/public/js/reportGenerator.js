// reportGenerator.js

export function calculateMetrics(dataframe_2, dataframe_3) {
    const metrics = {};
    
    try {
        if (!dataframe_2 || !dataframe_3) {
            throw new Error('Missing required dataframes');
        }

        // Enhanced input data logging
        console.log('========== DETAILED INPUT DATA ==========');
        console.log('dataframe_2 (Graph Data):', {
            length: dataframe_2.length,
            sample: dataframe_2[0],
            fields: dataframe_2[0] ? Object.keys(dataframe_2[0]) : [],
            hasParentField: dataframe_2[0]?.parent !== undefined,
            hasTypeField: dataframe_2[0]?.type !== undefined,
            hasTitleField: dataframe_2[0]?.title !== undefined,
            nodeTypes: [...new Set(dataframe_2.map(node => node.type))],
            parentCount: dataframe_2.filter(node => node.parent).length,
            rootCount: dataframe_2.filter(node => !node.parent).length
        });

        console.log('dataframe_3 (SQL Data):', {
            // Page metrics
            pages: {
                total: dataframe_3.num_total_pages,
                alive: dataframe_3.num_alive_pages,
                public: dataframe_3.num_public_pages,
                private: dataframe_3.num_private_pages
            },
            // Block metrics
            blocks: {
                total: dataframe_3.num_blocks,
                alive: dataframe_3.num_alive_blocks,
                current: dataframe_3.current_month_blocks,
                previous: dataframe_3.previous_month_blocks
            },
            // User metrics
            users: {
                members: dataframe_3.total_num_members,
                guests: dataframe_3.total_num_guests,
                teamspaces: dataframe_3.total_num_teamspaces,
                currentMembers: dataframe_3.current_month_members,
                previousMembers: dataframe_3.previous_month_members
            },
            // Collection metrics
            collections: {
                total: dataframe_3.num_collections,
                alive: dataframe_3.num_alive_collections,
                views: dataframe_3.total_num_collection_views
            },
            // Integration metrics
            integrations: {
                total: dataframe_3.total_num_integrations,
                bots: dataframe_3.total_num_bots,
                internalBots: dataframe_3.total_num_internal_bots,
                publicBots: dataframe_3.total_num_public_bots,
                linkPreviews: dataframe_3.total_num_link_preview_integrations,
                publicIntegrations: dataframe_3.total_num_public_integrations
            },
            // Business metrics
            business: {
                arr: dataframe_3.total_arr,
                paidSeats: dataframe_3.total_paid_seats
            }
        });
        console.log('=======================================');

        // Validate and transform data
        const validatedData = validateAndTransformData(dataframe_3);
        console.log('Validated Data Sample:', {
            members: validatedData.total_num_members,
            pages: validatedData.num_total_pages,
            blocks: validatedData.num_blocks
        });

        // Use validated data for calculations
        const sqlMetrics = calculateSQLMetrics(validatedData);
        console.log('SQL Metrics:', sqlMetrics);
        Object.assign(metrics, sqlMetrics);

        // Graph structure metrics with logging
        const graphMetrics = calculateGraphMetrics(dataframe_2);
        console.log('Graph Metrics:', graphMetrics);
        Object.assign(metrics, graphMetrics);

        // Growth metrics with logging
        const growthMetrics = calculateGrowthMetrics(dataframe_3);
        console.log('Growth Metrics:', growthMetrics);
        Object.assign(metrics, growthMetrics);

        // Usage metrics with logging
        const usageMetrics = calculateUsageMetrics(dataframe_3);
        console.log('Usage Metrics:', usageMetrics);
        Object.assign(metrics, usageMetrics);

        // Key insights with logging
        const keyInsights = calculateKeyInsights(dataframe_3);
        console.log('Key Insights:', keyInsights);
        Object.assign(metrics, keyInsights);

        // Combined and calculated metrics with logging
        const combinedMetrics = calculateCombinedMetrics(metrics);
        console.log('Combined Metrics:', combinedMetrics);
        Object.assign(metrics, combinedMetrics);

        // ROI calculations with logging
        const roiMetrics = calculateROIMetrics(dataframe_3, metrics);
        console.log('ROI Metrics:', roiMetrics);
        Object.assign(metrics, roiMetrics);

        // Mark unavailable metrics
        markUnavailableMetrics(metrics);

        // Log final metrics
        console.log('Final Metrics:', metrics);

        return metrics;

    } catch (error) {
        console.error('Error in calculateMetrics:', error);
        console.error('Error details:', {
            hasDataframe2: !!dataframe_2,
            hasDataframe3: !!dataframe_3,
            dataframe2Length: dataframe_2?.length,
            dataframe3Fields: dataframe_3 ? Object.keys(dataframe_3) : []
        });
        throw error;
    }
}

function calculateSQLMetrics(data) {
    try {
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
            // Page metrics - use num_pages as total_pages if num_total_pages is 0
            total_pages: data.num_total_pages || data.num_pages || 0,
            page_count: data.num_pages || data.num_total_pages || 0,
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

function calculateGraphMetrics(graphData) {
    try {
        console.log('Calculating graph metrics for', graphData.length, 'nodes');
        
        // Initialize metrics
        let metrics = {
            max_depth: 0,
            avg_depth: 0,
            avg_nav_depth: 0,
            nav_depth_score: 0,
            root_pages: 0,
            orphaned_blocks: 0,
            deep_pages_count: 0,
            template_count: 0,
            linked_database_count: 0,
            duplicate_count: 0,
            bottleneck_count: 0,
            unfindable_pages: 0
        };

        if (!Array.isArray(graphData)) {
            console.error('Invalid graph data:', graphData);
            return metrics;
        }

        // Calculate depth metrics
        let totalDepth = 0;
        let totalPageDepth = 0;
        let pageCount = 0;

        graphData.forEach(node => {
            if (!node) return;
            
            // Calculate max and average depth
            const depth = Number(node.DEPTH || 0);
            const pageDepth = Number(node.PAGE_DEPTH || 0);
            
            metrics.max_depth = Math.max(metrics.max_depth, depth);
            totalDepth += depth;

            if (node.TYPE === 'page') {
                totalPageDepth += pageDepth;
                pageCount++;
            }

            // Count root pages (depth 0 or no parent)
            if (depth === 0 || !node.PARENT_ID) {
                metrics.root_pages++;
            }

            // Count orphaned blocks (no parent or invalid parent)
            if (!node.PARENT_ID || !graphData.some(n => n.ID === node.PARENT_ID)) {
                metrics.orphaned_blocks++;
            }

            // Count deep pages (depth > 5)
            if (depth > 5) {
                metrics.deep_pages_count++;
            }

            // Count templates
            if (node.TYPE === 'template') {
                metrics.template_count++;
            }

            // Count linked databases
            if (node.TYPE === 'collection_view' || node.TYPE === 'collection_view_page') {
                metrics.linked_database_count++;
            }
        });

        // Calculate averages
        metrics.avg_depth = totalDepth / graphData.length || 0;
        metrics.avg_nav_depth = totalPageDepth / pageCount || 0;
        
        // Calculate navigation depth score (0-100)
        metrics.nav_depth_score = Math.min(100, (metrics.avg_nav_depth / 3) * 100);

        // Count duplicate titles
        const titleCounts = {};
        graphData.forEach(node => {
            if (node.TEXT) {
                titleCounts[node.TEXT] = (titleCounts[node.TEXT] || 0) + 1;
            }
        });
        metrics.duplicate_count = Object.values(titleCounts).filter(count => count > 1).length;

        // Count bottlenecks (pages with > 100 direct children)
        const childCounts = {};
        graphData.forEach(node => {
            if (node.PARENT_ID) {
                childCounts[node.PARENT_ID] = (childCounts[node.PARENT_ID] || 0) + 1;
            }
        });
        metrics.bottleneck_count = Object.values(childCounts).filter(count => count > 100).length;

        // Count unfindable pages (no incoming links and depth > 3)
        metrics.unfindable_pages = graphData.filter(node => {
            const depth = Number(node.DEPTH || 0);
            const hasIncomingLinks = graphData.some(n => n.PARENT_ID === node.ID);
            return depth > 3 && !hasIncomingLinks;
        }).length;

        console.log('Graph metrics calculated:', metrics);
        return metrics;
    } catch (error) {
        console.error('Error in calculateGraphMetrics:', error);
        return {
            max_depth: 0,
            avg_depth: 0,
            avg_nav_depth: 0,
            nav_depth_score: 0,
            root_pages: 0,
            orphaned_blocks: 0,
            deep_pages_count: 0,
            template_count: 0,
            linked_database_count: 0,
            duplicate_count: 0,
            bottleneck_count: 0,
            unfindable_pages: 0
        };
    }
}

function calculateGrowthMetrics(data) {
    try {
        const metrics = {
            growth_rate: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks),
            blocks_created_last_month: (data.current_month_blocks - data.previous_month_blocks) || 0,
            blocks_created_last_year: (data.current_year_blocks - data.previous_year_blocks) || 0,
            pages_created_last_month: (data.current_month_pages - data.previous_month_pages) || 0,
            monthly_member_growth_rate: calculateGrowthRate(data.current_month_members, data.previous_month_members),
            expected_members_in_next_year: calculateProjectedGrowth(data.total_num_members, data.monthly_member_growth_rate),
            monthly_content_growth_rate: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks)
        };

        // Additional growth metrics
        metrics.growth_capacity = data.system_limit ? (1 - (data.num_blocks / data.system_limit)) * 100 : null;
        metrics.potential_teamspace_growth = data.industry_benchmark_team_size ? 
            (data.industry_benchmark_team_size - (data.total_num_members / data.total_num_teamspaces)) * data.total_num_teamspaces : null;

        return metrics;
    } catch (error) {
        console.error('Error in calculateGrowthMetrics:', error);
        return {};
    }
}

function calculateUsageMetrics(data) {
    try {
        const metrics = {
            active_users: data.active_users || 0,
            daily_active_users: data.daily_active_users || 0,
            weekly_active_users: data.weekly_active_users || 0,
            monthly_active_users: data.monthly_active_users || 0,
            average_daily_edits: data.average_daily_edits || 0,
            average_weekly_edits: data.average_weekly_edits || 0,
            pages_per_user: (data.num_pages / data.total_num_members) || 0,
            edits_per_user: (data.total_edits / data.total_num_members) || 0,
            collaboration_rate: ((data.collaborative_pages / data.num_total_pages) * 100) || 0,
            engagement_score: calculateEngagementScore(data)
        };

        // Additional usage metrics
        metrics.average_teamspace_members = (data.total_num_members / data.total_num_teamspaces) || 0;
        metrics.teamspaces_with_guests = data.total_num_guests || 0;
        metrics.automation_usage_rate = (data.total_num_bots / data.total_num_members) * 100;
        metrics.current_integration_coverage = (data.total_num_integrations / data.total_num_members) * 100;
        metrics.underutilised_teamspaces = data.teamspaces_below_average || 0;

        return metrics;
    } catch (error) {
        console.error('Error in calculateUsageMetrics:', error);
        return {};
    }
}

function calculateEngagementScore(data) {
    const dailyWeight = 0.4;
    const weeklyWeight = 0.3;
    const monthlyWeight = 0.2;
    const editWeight = 0.1;

    const dailyScore = (data.daily_active_users / data.total_num_members) || 0;
    const weeklyScore = (data.weekly_active_users / data.total_num_members) || 0;
    const monthlyScore = (data.monthly_active_users / data.total_num_members) || 0;
    const editScore = (data.average_daily_edits / data.total_num_members) || 0;

    return (dailyScore * dailyWeight + 
            weeklyScore * weeklyWeight + 
            monthlyScore * monthlyWeight + 
            editScore * editWeight) * 100;
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
            key_metrics_insight_1: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks),
            
            // User growth rate
            key_metrics_insight_2: calculateGrowthRate(data.current_month_members, data.previous_month_members),
            
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
            key_metrics_insight_18: calculateGrowthRate(data.current_month_blocks, data.previous_month_blocks)
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

function calculateGrowthRate(current, previous) {
    if (!current || !previous || previous === 0) {
        console.log('Invalid growth rate inputs:', { current, previous });
        return 0;
    }
    return ((current - previous) / previous * 100);
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