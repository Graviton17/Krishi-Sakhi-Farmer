import { supabase } from "../../lib/supabase/client";
import { TABLE_NAMES } from "../config";
import { logger } from "../logger";
import { FarmTask } from "../types";
import { BaseRepository } from "./BaseRepository";

export class FarmTaskRepository extends BaseRepository<FarmTask> {
  constructor() {
    super(TABLE_NAMES.FARM_TASKS);
  }

  async findByFarmer(farmerId: string): Promise<any> {
    return this.findWhere([
      { column: "farmer_id", operator: "eq", value: farmerId },
    ]);
  }

  async findByStatus(status: string): Promise<any> {
    return this.findWhere([
      { column: "status", operator: "eq", value: status },
    ]);
  }

  async findOverdue(): Promise<any> {
    return this.findWhere([
      { column: "due_date", operator: "lt", value: new Date().toISOString() },
      { column: "status", operator: "neq", value: "completed" },
    ]);
  }

  /**
   * Find tasks by priority based on due date proximity
   * Since there's no priority field, we interpret priority based on due dates
   */
  async findByPriority(priority: string): Promise<any> {
    try {
      this.logOperation("findByPriority", this.tableName, { priority });

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);

      let query = supabase
        .from(this.tableName)
        .select("*")
        .neq("status", "completed")
        .order("due_date", { ascending: true });

      // Filter based on priority interpretation
      switch (priority.toLowerCase()) {
        case "high":
          // Tasks due today or tomorrow
          query = query.lte("due_date", tomorrow.toISOString().split("T")[0]);
          break;
        case "medium":
          // Tasks due within a week
          query = query
            .gt("due_date", tomorrow.toISOString().split("T")[0])
            .lte("due_date", weekFromNow.toISOString().split("T")[0]);
          break;
        case "low":
          // Tasks due later than a week
          query = query.gt("due_date", weekFromNow.toISOString().split("T")[0]);
          break;
        default:
          // Invalid priority, return empty result
          return { data: [], error: null };
      }

      const result = await query;

      logger.debug(`findByPriority completed`, {
        table: this.tableName,
        priority,
        resultCount: result.data?.length || 0,
        success: !result.error,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "findByPriority");
    }
  }
}
