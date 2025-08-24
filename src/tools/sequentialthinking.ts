import { z } from 'zod';
import { Tool } from '../utils/tools';

/**
 * 思维步骤数据结构（ThoughtData）
 * - 描述单次思维步骤及其与历史/分支的关系
 * 字段说明：
 * - thought: 当前思维内容
 * - thoughtNumber: 当前步骤序号（从 1 起）
 * - totalThoughts: 估计所需总步数（可动态调整）
 * - isRevision: 是否为对以往思维的修订
 * - revisesThought: 若为修订，指定被修订的步骤号
 * - branchFromThought: 若发生分支，指定分支点步骤号
 * - branchId: 分支标识
 * - needsMoreThoughts: 是否需要更多思考
 * - nextThoughtNeeded: 下一步是否需要继续
 */
interface ThoughtData {
    thought: string;
    thoughtNumber: number;
    totalThoughts: number;
    isRevision?: boolean;
    revisesThought?: number;
    branchFromThought?: number;
    branchId?: string;
    needsMoreThoughts?: boolean;
    nextThoughtNeeded: boolean;
}

/**
 * 思维过程服务（SequentialThinkingServer）
 * - 负责：入参校验、历史与分支管理、产出下一步提示
 * - 内部状态：thoughtHistory、branches
 */
class SequentialThinkingServer {
    private thoughtHistory: ThoughtData[] = [];
    private branches: Record<string, ThoughtData[]> = {};

    /**
     * 校验与规范化入参
     * @param input 未经校验的入参对象
     * @throws 当必填字段缺失或类型不匹配时抛出错误
     * @returns 标准化后的 ThoughtData
     */
    private validateThoughtData(input: unknown): ThoughtData {
        const data = input as Record<string, unknown>;

        if (!data.thought || typeof data.thought !== 'string') {
            throw new Error('Invalid thought: must be a string');
        }
        if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
            throw new Error('Invalid thoughtNumber: must be a number');
        }
        if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
            throw new Error('Invalid totalThoughts: must be a number');
        }
        if (typeof data.nextThoughtNeeded !== 'boolean') {
            throw new Error('Invalid nextThoughtNeeded: must be a boolean');
        }

        return {
            thought: data.thought,
            thoughtNumber: data.thoughtNumber,
            totalThoughts: data.totalThoughts,
            nextThoughtNeeded: data.nextThoughtNeeded,
            isRevision: data.isRevision as boolean | undefined,
            revisesThought: data.revisesThought as number | undefined,
            branchFromThought: data.branchFromThought as number | undefined,
            branchId: data.branchId as string | undefined,
            needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
        };
    }

    /**
     * 处理思维步骤
     * - 校验入参、更新历史/分支、生成下一步提示信息
     * @param input 入参对象
     * @returns MCP 风格的结果对象（content 数组；错误时附 isError）
     */
    public processThought(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
        try {
            const validatedInput = this.validateThoughtData(input);

            if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
                validatedInput.totalThoughts = validatedInput.thoughtNumber;
            }

            this.thoughtHistory.push(validatedInput);

            if (validatedInput.branchFromThought && validatedInput.branchId) {
                if (!this.branches[validatedInput.branchId]) {
                    this.branches[validatedInput.branchId] = [];
                }
                this.branches[validatedInput.branchId].push(validatedInput);
            }

            const nextStepMessage = validatedInput.nextThoughtNeeded
                ? `Next thought is needed. Please provide thought number ${validatedInput.thoughtNumber + 1}.`
                : `No further thoughts are needed. The process is complete.`;

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            thoughtNumber: validatedInput.thoughtNumber,
                            totalThoughts: validatedInput.totalThoughts,
                            nextThoughtNeeded: validatedInput.nextThoughtNeeded,
                            branches: Object.keys(this.branches),
                            thoughtHistoryLength: this.thoughtHistory.length,
                            message: nextStepMessage
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : String(error),
                        status: 'failed'
                    }, null, 2)
                }],
                isError: true
            };
        }
    }
}

/**
 * SequentialThinking 工具
 *
 * 功能：
 * - 支持多步、可分支、可修订的思维过程组织与反馈
 *
 * 入参 Schema（zod）：
 * - thought: 当前思维内容
 * - nextThoughtNeeded: 是否需要下一步
 * - thoughtNumber: 当前步骤序号（>=1）
 * - totalThoughts: 预计总步数（>=1，可调整）
 * - isRevision: 是否为修订
 * - revisesThought: 若修订，指定被修订的步骤号
 * - branchFromThought: 若分支，指定分支点步骤号
 * - branchId: 分支标识
 * - needsMoreThoughts: 是否需要更多思考
 */
export class SequentialThinkingTool extends Tool {
    private server = new SequentialThinkingServer();

    constructor() {
        super(
            'sequentialthinking',
            `
                A detailed tool for dynamic and reflective problem-solving through thoughts.
                This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
                Each thought can build on, question, or revise previous insights as understanding deepens.

                When to use this tool:
                - Breaking down complex problems into steps
                - Planning and design with room for revision
                - Analysis that might need course correction
                - Problems where the full scope might not be clear initially
                - Problems that require a multi-step solution
                - Tasks that need to maintain context over multiple steps
                - Situations where irrelevant information needs to be filtered out

                Key features:
                - You can adjust total_thoughts up or down as you progress
                - You can question or revise previous thoughts
                - You can add more thoughts even after reaching what seemed like the end
                - You can express uncertainty and explore alternative approaches
                - Not every thought needs to build linearly - you can branch or backtrack
                - Generates a solution hypothesis
                - Verifies the hypothesis based on the Chain of Thought steps
                - Repeats the process until satisfied
                - Provides a correct answer

                Parameters explained:
                - thought: Your current thinking step, which can include:
                * Regular analytical steps
                * Revisions of previous thoughts
                * Questions about previous decisions
                * Realizations about needing more analysis
                * Changes in approach
                * Hypothesis generation
                * Hypothesis verification
                - next_thought_needed: True if you need more thinking, even if at what seemed like the end
                - thought_number: Current number in sequence (can go beyond initial total if needed)
                - total_thoughts: Current estimate of thoughts needed (can be adjusted up/down)
                - is_revision: A boolean indicating if this thought revises previous thinking
                - revises_thought: If is_revision is true, which thought number is being reconsidered
                - branch_from_thought: If branching, which thought number is the branching point
                - branch_id: Identifier for the current branch (if any)
                - needs_more_thoughts: If reaching end but realizing more thoughts needed

                You should:
                1. Start with an initial estimate of needed thoughts, but be ready to adjust
                2. Feel free to question or revise previous thoughts
                3. Don't hesitate to add more thoughts if needed, even at the "end"
                4. Express uncertainty when present
                5. Mark thoughts that revise previous thinking or branch into new paths
                6. Ignore information that is irrelevant to the current step
                7. Generate a solution hypothesis when appropriate
                8. Verify the hypothesis based on the Chain of Thought steps
                9. Repeat the process until satisfied with the solution
                10. Provide a single, ideally correct answer as the final output
                11. Only set next_thought_needed to false when truly done and a satisfactory answer is reached
            `,
            {
                thought: z.string().describe('Your current thinking step'),
                nextThoughtNeeded: z.boolean().describe('Whether another thought step is needed'),
                thoughtNumber: z.number().min(1).describe('Current thought number'),
                totalThoughts: z.number().min(1).describe('Estimated total thoughts needed'),
                isRevision: z.boolean().optional().describe('Whether this revises previous thinking'),
                revisesThought: z.number().min(1).optional().describe('Which thought is being reconsidered'),
                branchFromThought: z.number().min(1).optional().describe('Branching point thought number'),
                branchId: z.string().optional().describe('Branch identifier'),
                needsMoreThoughts: z.boolean().optional().describe('If more thoughts are needed')
            }
        );
    }

    /**
     * 执行工具入口
     * @param args 入参对象（不做类型断言，交由服务内部校验）
     * @returns 执行结果，包含 content 与可选 isError
     */
    async execute(args: Record<string, unknown>) {
        return this.server.processThought(args);
    }
}