export class ROIMetrics {
    constructor(calculator) {
        this.calculator = calculator;
    }

    calculateROIMetrics(dataframe_3, dataframe_5) {
        if (!dataframe_3 || !dataframe_5) {
            console.warn('No ROI data available');
            return {};
        }

        const total_members = dataframe_3.TOTAL_NUM_MEMBERS || 0;

        // Calculate plan costs
        const current_plan = this.calculatePlanCost(total_members, 'team');
        const enterprise_plan = this.calculatePlanCost(total_members, 'enterprise');
        const enterprise_plan_w_ai = this.calculatePlanCost(total_members, 'enterprise_ai');

        // Calculate productivity gains
        const productivity_10_percent = this.calculateProductivityGain(total_members, 0.1);
        const productivity_20_percent = this.calculateProductivityGain(total_members, 0.2);
        const productivity_50_percent = this.calculateProductivityGain(total_members, 0.5);

        // Calculate ROI
        const enterprise_plan_roi = ((productivity_20_percent - enterprise_plan) / enterprise_plan) * 100;
        const enterprise_plan_w_ai_roi = ((productivity_50_percent - enterprise_plan_w_ai) / enterprise_plan_w_ai) * 100;

        return {
            current_plan,
            enterprise_plan,
            enterprise_plan_w_ai,
            '10_percent_increase': productivity_10_percent,
            '20_percent_increase': productivity_20_percent,
            '50_percent_increase': productivity_50_percent,
            enterprise_plan_roi,
            enterprise_plan_w_ai_roi
        };
    }

    calculatePlanCost(members, plan) {
        const rates = {
            team: 10,
            enterprise: 20,
            enterprise_ai: 25
        };

        return members * rates[plan] * 12; // Annual cost
    }

    calculateProductivityGain(members, improvement) {
        const avgSalary = 80000; // Assumed average salary
        const workingHours = 2080; // Annual working hours
        const hourlyRate = avgSalary / workingHours;
        
        return members * workingHours * hourlyRate * improvement;
    }
} 