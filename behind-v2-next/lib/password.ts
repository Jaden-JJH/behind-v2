import bcrypt from 'bcryptjs'

/**
 * Verify a plain password against a bcrypt hash
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The bcrypt hashed password to compare against
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}
