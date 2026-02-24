/**
 * Shared classNames for auth form inputs
 */
export const AUTH_INPUT_CLASSES = {
  label: "text-octopush-foreground data-[error]:text-octopush-error font-medium text-sm mb-1.5",
  input: "h-10 bg-octopush-base border-octopush-input text-octopush-foreground data-[error]:border-error",
} as const;

/**
 * Shared classNames for primary auth buttons
 */
export const AUTH_PRIMARY_BUTTON_CLASSES = {
  root: "bg-octopush-primary",
  label: "text-white font-medium text-sm hover:opacity-90",
} as const;

/**
 * Shared classNames for OAuth buttons
 */
export const AUTH_OAUTH_BUTTON_CLASSES = {
  label: "text-octopush-foreground font-medium text-sm",
  root: "bg-octopush-base border-octopush-divider hover:bg-octopush-elevated",
} as const;

/**
 * Shared classNames for dividers
 */
export const AUTH_DIVIDER_CLASSES = {
  label: "text-octopush-muted text-sm",
} as const;
