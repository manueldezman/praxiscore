/**
 * Validates a Solana address
 * @param address - The Solana address to validate
 * @returns true if valid, false otherwise
 */
export function validateSolanaAddress(address: string): boolean {
  try {
    // Solana addresses are base58 encoded and should be 32-44 characters
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Check length (32-44 characters for base58)
    if (address.length < 32 || address.length > 44) {
      return false;
    }

    // Check for valid base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(address)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Truncates a Solana address for display
 * @param address - The Solana address to truncate
 * @param chars - Number of characters to show at start and end
 * @returns Truncated address (e.g., "7xKX...3mNp")
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
