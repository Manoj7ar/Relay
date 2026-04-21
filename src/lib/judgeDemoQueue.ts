/** SessionStorage key: pending judge scenario id for Patient Home to consume */
export const JUDGE_QUEUE_KEY = 'relay.judge.once';

export function queueJudgeScenario(scenarioId: string): void {
  sessionStorage.setItem(JUDGE_QUEUE_KEY, scenarioId);
}

export function consumeQueuedJudgeScenario(): string | null {
  const id = sessionStorage.getItem(JUDGE_QUEUE_KEY);
  if (id) sessionStorage.removeItem(JUDGE_QUEUE_KEY);
  return id;
}
