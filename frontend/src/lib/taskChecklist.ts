export type ChecklistItemStatus = 'done' | 'pending' | 'not_applicable';

export interface ChecklistItemValue {
  key: string;
  itemStatus: ChecklistItemStatus;
  justification?: string;
}

export interface ChecklistItemDef {
  key: string;
  label: string;
  mandatory: boolean;
  xpWeight: number | null;
}

export const TASK_CHECKLIST_ITEMS: ChecklistItemDef[] = [
  { key: 'prd', label: 'Documento do que a entrega resolve (PRD)', mandatory: false, xpWeight: 10 },
  { key: 'rbac', label: 'Matriz de quem pode ver/fazer o quê', mandatory: false, xpWeight: 20 },
  { key: 'tenant_isolation', label: 'Isolamento de dado entre clientes/setores', mandatory: false, xpWeight: 30 },
  { key: 'rls', label: 'Trava de acesso dentro do próprio banco', mandatory: false, xpWeight: 35 },
  { key: 'secrets', label: 'Nenhuma credencial no código-fonte', mandatory: true, xpWeight: null },
  { key: 'modular_arch', label: 'Arquitetura modular / feature flag', mandatory: false, xpWeight: 25 },
  { key: 'error_reporting', label: 'Canal visível de reportar erro', mandatory: false, xpWeight: 15 },
  { key: 'automated_tests', label: 'Testes automatizados do fluxo principal', mandatory: true, xpWeight: null },
  { key: 'security_audit', label: 'Auditoria de segurança como gate de deploy', mandatory: true, xpWeight: null },
  { key: 'waf_bot', label: 'Blindagem de borda (rate limit / bot)', mandatory: false, xpWeight: 20 },
  { key: 'https_tls', label: 'HTTPS/TLS ponta a ponta', mandatory: true, xpWeight: null },
];

export function emptyChecklistValue(): ChecklistItemValue[] {
  return TASK_CHECKLIST_ITEMS.map((i) => ({ key: i.key, itemStatus: 'pending' as const }));
}
