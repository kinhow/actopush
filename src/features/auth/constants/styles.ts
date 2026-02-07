/**
 * Shared classNames for auth form inputs
 */
export const AUTH_INPUT_CLASSES = {
  label: "text-octopush-text-primary font-medium text-sm mb-1.5",
  input: "h-10 bg-octopush-background border-octopush-input text-octopush-text-primary",
} as const;

/**
 * Shared classNames for primary auth buttons
 */
export const AUTH_PRIMARY_BUTTON_CLASSES = {
  root: "bg-octopush-primary",
  label: "text-octopush-sidebar font-medium text-sm hover:opacity-90",
} as const;

/**
 * Shared classNames for OAuth buttons
 */
export const AUTH_OAUTH_BUTTON_CLASSES = {
  label: "text-octopush-text-primary font-medium text-sm",
  root: "bg-octopush-background border-octopush-border hover:bg-octopush-elevated",
} as const;

/**
 * Shared classNames for dividers
 */
export const AUTH_DIVIDER_CLASSES = {
  label: "text-octopush-text-muted text-sm",
} as const;
