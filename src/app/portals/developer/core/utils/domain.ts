/** The admin host is the customer domain's first label under .local. */
export function adminHost(domain: string): string {
  return `admin.${domain.split('.')[0]}.local`;
}

/** The client's admin host: whatever was configured, else the default. */
export function clientAdminHost(client: { domain: string; adminDomain?: string }): string {
  return client.adminDomain ?? adminHost(client.domain);
}
