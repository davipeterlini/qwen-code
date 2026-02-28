/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { Config } from '@qwen-code/qwen-code-core';
import { createDebugLogger, Storage } from '@qwen-code/qwen-code-core';

const debugLogger = createDebugLogger('PLAN_DOCUMENTS');

/**
 * Schema for a plan document
 */
const PlanDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum(['draft', 'in_progress', 'completed', 'abandoned']),
  steps: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
      completedAt: z.string().optional(),
    }),
  ),
  metadata: z.record(z.unknown()).optional(),
});

export type PlanDocument = z.infer<typeof PlanDocumentSchema>;

/**
 * Schema for the plans index file
 */
const PlansIndexSchema = z.object({
  plans: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(['draft', 'in_progress', 'completed', 'abandoned']),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

/**
 * Manages plan documents for spec-driven development
 */
export class PlanDocumentsManager {
  private plansDir: string;
  private indexFile: string;

  constructor(_config: Config | null) {
    this.plansDir = path.join(Storage.getGlobalQwenDir(), 'plans');
    this.indexFile = path.join(this.plansDir, 'index.json');
  }

  /**
   * Initialize the plan documents system
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.plansDir, { recursive: true });

      // Create index file if it doesn't exist
      try {
        await fs.access(this.indexFile);
      } catch {
        await fs.writeFile(
          this.indexFile,
          JSON.stringify({ plans: [] }, null, 2),
          'utf-8',
        );
      }

      debugLogger.debug('Plan documents system initialized');
    } catch (error) {
      debugLogger.debug('Error initializing plan documents:', error);
    }
  }

  /**
   * Create a new plan document
   */
  async createPlan(
    title: string,
    description: string,
    steps: Array<{ description: string }> = [],
  ): Promise<PlanDocument> {
    const now = new Date().toISOString();
    const id = this.generateId(title);

    const plan: PlanDocument = {
      id,
      title,
      description,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      steps: steps.map((step, index) => ({
        id: `step-${index + 1}`,
        description: step.description,
        status: 'pending',
      })),
    };

    await this.savePlan(plan);
    await this.addToIndex(plan);

    debugLogger.debug(`Created plan: ${id}`);
    return plan;
  }

  /**
   * Get a plan by ID
   */
  async getPlan(id: string): Promise<PlanDocument | null> {
    try {
      const planFile = path.join(this.plansDir, `${id}.json`);
      const content = await fs.readFile(planFile, 'utf-8');
      const validated = PlanDocumentSchema.parse(JSON.parse(content));
      return validated;
    } catch (error) {
      debugLogger.debug(`Error getting plan ${id}:`, error);
      return null;
    }
  }

  /**
   * Update a plan
   */
  async updatePlan(
    id: string,
    updates: Partial<PlanDocument>,
  ): Promise<PlanDocument | null> {
    const plan = await this.getPlan(id);
    if (!plan) {
      return null;
    }

    const updated: PlanDocument = {
      ...plan,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.savePlan(updated);
    await this.updateIndexEntry(updated);

    debugLogger.debug(`Updated plan: ${id}`);
    return updated;
  }

  /**
   * Update a step's status
   */
  async updateStepStatus(
    planId: string,
    stepId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped',
  ): Promise<PlanDocument | null> {
    const plan = await this.getPlan(planId);
    if (!plan) {
      return null;
    }

    const updatedSteps = plan.steps.map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          status,
          completedAt:
            status === 'completed' ? new Date().toISOString() : undefined,
        };
      }
      return step;
    });

    // Update plan status based on steps
    let newStatus: PlanDocument['status'] = plan.status;
    const allCompleted = updatedSteps.every((s) => s.status === 'completed');
    const anyInProgress = updatedSteps.some((s) => s.status === 'in_progress');

    if (allCompleted) {
      newStatus = 'completed';
    } else if (anyInProgress) {
      newStatus = 'in_progress';
    }

    return this.updatePlan(planId, { steps: updatedSteps, status: newStatus });
  }

  /**
   * List all plans
   */
  async listPlans(): Promise<
    Array<{
      id: string;
      title: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>
  > {
    try {
      const content = await fs.readFile(this.indexFile, 'utf-8');
      const validated = PlansIndexSchema.parse(JSON.parse(content));
      return validated.plans;
    } catch (error) {
      debugLogger.debug('Error listing plans:', error);
      return [];
    }
  }

  /**
   * Delete a plan
   */
  async deletePlan(id: string): Promise<boolean> {
    try {
      const planFile = path.join(this.plansDir, `${id}.json`);
      await fs.unlink(planFile);
      await this.removeFromIndex(id);
      debugLogger.debug(`Deleted plan: ${id}`);
      return true;
    } catch (error) {
      debugLogger.debug(`Error deleting plan ${id}:`, error);
      return false;
    }
  }

  /**
   * Save a plan to disk
   */
  private async savePlan(plan: PlanDocument): Promise<void> {
    const planFile = path.join(this.plansDir, `${plan.id}.json`);
    await fs.writeFile(planFile, JSON.stringify(plan, null, 2), 'utf-8');
  }

  /**
   * Add plan to index
   */
  private async addToIndex(plan: PlanDocument): Promise<void> {
    const index = await this.readIndex();
    index.plans.push({
      id: plan.id,
      title: plan.title,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    });
    await this.writeIndex(index);
  }

  /**
   * Update plan in index
   */
  private async updateIndexEntry(plan: PlanDocument): Promise<void> {
    const index = await this.readIndex();
    const entryIndex = index.plans.findIndex((p) => p.id === plan.id);

    if (entryIndex !== -1) {
      index.plans[entryIndex] = {
        id: plan.id,
        title: plan.title,
        status: plan.status,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };
      await this.writeIndex(index);
    }
  }

  /**
   * Remove plan from index
   */
  private async removeFromIndex(id: string): Promise<void> {
    const index = await this.readIndex();
    index.plans = index.plans.filter((p) => p.id !== id);
    await this.writeIndex(index);
  }

  /**
   * Read index file
   */
  private async readIndex(): Promise<z.infer<typeof PlansIndexSchema>> {
    try {
      const content = await fs.readFile(this.indexFile, 'utf-8');
      return PlansIndexSchema.parse(JSON.parse(content));
    } catch {
      return { plans: [] };
    }
  }

  /**
   * Write index file
   */
  private async writeIndex(
    index: z.infer<typeof PlansIndexSchema>,
  ): Promise<void> {
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2), 'utf-8');
  }

  /**
   * Generate a unique ID from title
   */
  private generateId(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }

  /**
   * Get the plans directory path
   */
  getPlansDir(): string {
    return this.plansDir;
  }
}

/**
 * Create a new PlanDocumentsManager instance
 */
export function createPlanDocumentsManager(
  config: Config | null,
): PlanDocumentsManager {
  return new PlanDocumentsManager(config);
}
