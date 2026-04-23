import { Client } from 'ldapts';
import config from '../config';

export interface LdapUser {
  sAMAccountName: string;
  mail:           string;
  displayName:    string;
  departmentSlug: string | null;
}

const OU_SLUG_MAP: Record<string, string> = {
  'TI':                       'ti',
  'Administradores':          'ti',
  'FINANCEIRO':               'financeiro',
  'CONTABILIDADE':            'contabilidade',
  'CONTROLADORIA':            'controladoria',
  'RECURSOS HUMANOS':         'rh',
  'LOGISTICA':                'logistica',
  'VENDAS':                   'vendas',
  'MARKETING':                'marketing',
  'INDUSTRIAL':               'industrial',
  'PCP':                      'pcp',
  'MANUTENÇÃO':               'manutencao',
  'DIRETORIA ADMINISTRATIVA': 'diretoria',
  'PRESIDENCIA':              'presidencia',
  'ADMINISTRATIVO':           'administrativo',
  'SECRETARIA':               'secretaria',
  'SESMT':                    'sesmt',
  'SISTEMA DA QUALIDADE':     'qualidade',
};

function escapeLdapFilter(value: string): string {
  return value.replace(/[\\*()\x00/]/g, c =>
    `\\${c.charCodeAt(0).toString(16).padStart(2, '0')}`
  );
}

function extractDeptSlug(distinguishedName: string): string | null {
  const match = distinguishedName.match(/OU=([^,]+)/i);
  if (!match) return null;
  return OU_SLUG_MAP[match[1]] ?? null;
}

export async function ldapBindUser(username: string, password: string): Promise<boolean> {
  const client = new Client({ url: config.ldapUrl, timeout: 5000 });
  try {
    await client.bind(`${username}@${config.ldapDomain}`, password);
    return true;
  } catch (err) {
    console.warn(`[LDAP] bind failed for ${username}@${config.ldapDomain}:`, err);
    return false;
  } finally {
    await client.unbind().catch(() => {});
  }
}

export async function ldapSearchUser(username: string): Promise<LdapUser | null> {
  const client = new Client({ url: config.ldapUrl, timeout: 5000 });
  try {
    await client.bind(config.ldapServiceDn, config.ldapServicePass);
    const { searchEntries } = await client.search(config.ldapBaseDn, {
      scope:      'sub',
      filter:     `(sAMAccountName=${escapeLdapFilter(username)})`,
      attributes: ['sAMAccountName', 'mail', 'displayName', 'distinguishedName'],
    });
    if (!searchEntries.length) return null;
    const entry = searchEntries[0];
    const dn    = String(entry.distinguishedName ?? '');
    return {
      sAMAccountName: String(entry.sAMAccountName ?? username),
      mail:           String(entry.mail ?? ''),
      displayName:    String(entry.displayName ?? username),
      departmentSlug: extractDeptSlug(dn),
    };
  } catch (err) {
    console.error('[LDAP] searchUser failed for', username, ':', err);
    return null;
  } finally {
    await client.unbind().catch(() => {});
  }
}
