const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
