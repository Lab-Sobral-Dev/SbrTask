import 'dotenv/config';

export default {
  port:            process.env.PORT || 3001,
  jwtSecret:       process.env.JWT_SECRET || 'sbrtask-secret-key',
  databaseUrl:     process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sbrtask',
  corsOrigin:      process.env.CORS_ORIGIN || 'http://localhost:5173',
  ldapUrl:         process.env.LDAP_URL || 'ldap://dc.labsobralnet.ind:389',
  ldapDomain:      process.env.LDAP_DOMAIN || 'labsobralnet.ind',
  ldapBaseDn:      process.env.LDAP_BASE_DN || 'DC=labsobralnet,DC=ind',
  ldapServiceDn:   process.env.LDAP_SERVICE_DN || '',
  ldapServicePass: process.env.LDAP_SERVICE_PASS || '',
  companyIps:      (process.env.COMPANY_IPS || '').split(',').map((ip: string) => ip.trim()).filter(Boolean),
};
