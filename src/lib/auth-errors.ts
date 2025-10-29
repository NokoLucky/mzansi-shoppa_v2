export function getAuthErrorMessage(errorCode: string): string {
  const errorMap: { [key: string]: string } = {
    // Common authentication errors
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/requires-recent-login': 'Please log in again to perform this action.',
    'auth/provider-already-linked': 'This account is already linked with another provider.',
    'auth/credential-already-in-use': 'These credentials are already associated with another account.',
    
    // Generic errors
    'auth/invalid-credential': 'Invalid login credentials. Please check your email and password.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/invalid-verification-id': 'Invalid verification ID.',
    'auth/captcha-check-failed': 'Captcha verification failed. Please try again.',
    'auth/quota-exceeded': 'Quota exceeded. Please try again later.',
    
    // Default fallback
    'default': 'An unexpected error occurred. Please try again.',
  };

  return errorMap[errorCode] || errorMap['default'];
}

export function handleAuthError(error: any): string {
  if (error.code && typeof error.code === 'string') {
    return getAuthErrorMessage(error.code);
  }
  
  if (error.message && typeof error.message === 'string') {
    // Try to extract error code from message if code is not directly available
    const firebaseErrorMatch = error.message.match(/auth\/([a-z-]+)/);
    if (firebaseErrorMatch) {
      return getAuthErrorMessage(`auth/${firebaseErrorMatch[1]}`);
    }
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}