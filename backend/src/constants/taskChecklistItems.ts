export interface TaskChecklistItemDef {
  key: string;
  label: string;
  mandatory: boolean;
  xpWeight: number | null;
}

// Ordem e pesos definidos no spec (docs/superpowers/specs/2026-08-11-gate-aprovacao-task-design.md).
// mandatory = true nunca tem xpWeight (é higiene mínima, não incentivo).
export const TASK_CHECKLIST_ITEMS: TaskChecklistItemDef[] = [
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

export const TASK_CHECKLIST_KEYS = TASK_CHECKLIST_ITEMS.map((i) => i.key);

export function getChecklistItemDef(key: string): TaskChecklistItemDef | undefined {
  return TASK_CHECKLIST_ITEMS.find((i) => i.key === key);
}
