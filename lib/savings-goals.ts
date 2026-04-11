import { generateId, getSavingsGoalsCollection, SavingsGoal } from './db/models'

function normalizeGoalName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Goal name is required')
  }

  return trimmed
}

function assertPositiveTarget(targetAmount: number) {
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    throw new Error('Target amount must be greater than 0')
  }
}

export async function getUserSavingsGoals(userId: string) {
  const goals = await getSavingsGoalsCollection()
  return goals.find({ userId }).sort({ createdAt: -1 }).toArray()
}

export async function getSavingsGoalById(userId: string, goalId: string) {
  const goals = await getSavingsGoalsCollection()
  return goals.findOne({ id: goalId, userId })
}

export async function createSavingsGoal(userId: string, name: string, targetAmount: number) {
  const goals = await getSavingsGoalsCollection()
  const now = Date.now()

  const goal: SavingsGoal = {
    id: generateId(),
    userId,
    name: normalizeGoalName(name),
    targetAmount,
    currentAmount: 0,
    createdAt: now,
    updatedAt: now,
  }

  assertPositiveTarget(goal.targetAmount)

  await goals.insertOne(goal)
  return goal
}

export async function applySavingsToGoal(userId: string, goalId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }

  const goals = await getSavingsGoalsCollection()
  const goal = await goals.findOne({ id: goalId, userId })
  if (!goal) {
    throw new Error('Savings goal not found')
  }

  const currentAmount = Number((goal.currentAmount + amount).toFixed(2))
  const updatedAt = Date.now()

  await goals.updateOne(
    { id: goalId, userId },
    {
      $set: {
        currentAmount,
        updatedAt,
      },
    }
  )

  return {
    ...goal,
    currentAmount,
    updatedAt,
  }
}
