// Dealer / distributor customers upload security cheques (multiple) instead of a bank proof.
export const isSecurityChequeType = (customerTypeKey?: string | null) =>
  ['dealer', 'distributor'].includes(String(customerTypeKey || '').trim().toLowerCase());
