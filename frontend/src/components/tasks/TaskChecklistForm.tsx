import { TASK_CHECKLIST_ITEMS } from '../../lib/taskChecklist';
import type { ChecklistItemValue, ChecklistItemStatus } from '../../lib/taskChecklist';

interface TaskChecklistFormProps {
  value: ChecklistItemValue[];
  onChange: (value: ChecklistItemValue[]) => void;
  readOnly?: boolean;
}

const TaskChecklistForm: React.FC<TaskChecklistFormProps> = ({ value, onChange, readOnly }) => {
  const getValue = (key: string): ChecklistItemValue =>
    value.find((v) => v.key === key) ?? { key, itemStatus: 'pending' };

  const setItem = (key: string, itemStatus: ChecklistItemStatus, justification?: string) => {
    const next = value.filter((v) => v.key !== key);
    next.push({ key, itemStatus, justification });
    onChange(next);
  };

  const bonusXp = TASK_CHECKLIST_ITEMS.filter((i) => !i.mandatory).reduce((sum, def) => {
    const v = getValue(def.key);
    return v.itemStatus === 'done' ? sum + (def.xpWeight ?? 0) : sum;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="tf-label">Checklist de aprovação</span>
        <span className="tf-panel-inset px-3 py-1 text-sm font-semibold text-[color:var(--tf-primary)]">
          +{bonusXp} XP bônus
        </span>
      </div>
      {TASK_CHECKLIST_ITEMS.map((def) => {
        const current = getValue(def.key);
        return (
          <div key={def.key} className="tf-panel-inset p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-[color:var(--tf-text-main)]">{def.label}</span>
              {def.mandatory ? (
                <span className="tf-badge border border-[color:var(--tf-danger)] text-[color:var(--tf-danger)]">
                  obrigatório
                </span>
              ) : (
                <span className="text-xs text-[color:var(--tf-primary)]">+{def.xpWeight} XP</span>
              )}
            </div>
            <div className="mt-2 flex gap-3 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`checklist-${def.key}`}
                  disabled={readOnly}
                  checked={current.itemStatus === 'done'}
                  onChange={() => setItem(def.key, 'done')}
                />
                Feito
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`checklist-${def.key}`}
                  disabled={readOnly}
                  checked={current.itemStatus === 'pending'}
                  onChange={() => setItem(def.key, 'pending')}
                />
                Pendente
              </label>
              {!def.mandatory && (
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={`checklist-${def.key}`}
                    disabled={readOnly}
                    checked={current.itemStatus === 'not_applicable'}
                    onChange={() => setItem(def.key, 'not_applicable', current.justification ?? '')}
                  />
                  N/A
                </label>
              )}
            </div>
            {current.itemStatus === 'not_applicable' && (
              <input
                type="text"
                placeholder="Por que não se aplica?"
                disabled={readOnly}
                value={current.justification ?? ''}
                onChange={(e) => setItem(def.key, 'not_applicable', e.target.value)}
                className="tf-input mt-2 !text-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskChecklistForm;
