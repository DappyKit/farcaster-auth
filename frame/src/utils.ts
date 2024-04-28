export function validateUrl(url: string): void {
  const parsedUrl = new URL(url)

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('URL should use HTTPS protocol')
  }
}

export function validateEthAddress(address: string): void {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid Ethereum address')
  }
}
