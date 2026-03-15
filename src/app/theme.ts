import {
  type CSSVariablesResolver,
  createTheme,
  type MantineColorsTuple,
} from "@mantine/core";

/* ==========================================
   OCTOPUSH BRAND PALETTES
   10-shade (0 = lightest, 9 = darkest)
   Primary shade = 5
   ========================================== */

const octopushRed: MantineColorsTuple = [
  "#ffe7ee",
  "#ffced8",
  "#ff9aae",
  "#ff6482",
  "#ff2d55",
  "#ff1844",
  "#ff0237",
  "#e4002a",
  "#cc0024",
  "#b3001d",
];

const octopushCyan: MantineColorsTuple = [
  "#deffff",
  "#caffff",
  "#99ffff",
  "#64ffff",
  "#3dffff",
  "#26ffff",
  "#00ffff",
  "#00e3e3",
  "#00cacb",
  "#00afb0",
];

const octopushOrange: MantineColorsTuple = [
  "#fff6e1",
  "#ffebcb",
  "#ffd69a",
  "#ffbf64",
  "#ffab37",
  "#ff9f1b",
  "#ff9500",
  "#e38400",
  "#cb7500",
  "#b06400",
];

const octopushGreen: MantineColorsTuple = [
  "#e8ffe3",
  "#d4ffcc",
  "#a9ff9a",
  "#7cff63",
  "#55ff36",
  "#39ff14",
  "#2cff02",
  "#1ae300",
  "#09ca00",
  "#00af00",
];

const octopushDanger: MantineColorsTuple = [
  "#ffe7ee",
  "#ffced8",
  "#ff9aae",
  "#ff6482",
  "#ff2d55",
  "#ff1844",
  "#ff0237",
  "#e4002a",
  "#cc0024",
  "#b3001d",
];

const octopushBlue: MantineColorsTuple = [
  "#e3f5ff",
  "#cce7ff",
  "#9acbff",
  "#64aeff",
  "#3996fe",
  "#1e86fe",
  "#007aff",
  "#006de4",
  "#0060cd",
  "#0053b6",
];

const octopushYellow: MantineColorsTuple = [
  "#fffbe1",
  "#fff6cb",
  "#ffeb9a",
  "#ffe064",
  "#ffd738",
  "#ffd11c",
  "#ffcc00",
  "#e3b600",
  "#caa100",
  "#ae8b00",
];

const octopushBase: MantineColorsTuple = [
  "#f7f7f8",
  "#e6e6e6",
  "#cacaca",
  "#adadae",
  "#949498",
  "#85858a",
  "#7d7d84",
  "#6b6a72",
  "#5e5e67",
  "#51515c",
];

const octopushBlack: MantineColorsTuple = [
  "#f4f4f6",
  "#e5e5e5",
  "#c9c9ca",
  "#ababb0",
  "#92929a",
  "#82828d",
  "#7a7a87",
  "#686875",
  "#5c5c6a",
  "#0f0f12",
];

const octopushBorderDark: MantineColorsTuple = [
  "#f4f4f6",
  "#e6e6e6",
  "#cacaca",
  "#acacb0",
  "#939399",
  "#83838c",
  "#7b7a86",
  "#696874",
  "#5d5d69",
  "#26262d",
];

const octopushBorderLight: MantineColorsTuple = [
  "#f3f3fb",
  "#e8e8ec",
  "#c9c9d0",
  "#ababb5",
  "#91919f",
  "#818192",
  "#79798c",
  "#67677a",
  "#5b5b6e",
  "#4e4e63",
];

const octopushGray: MantineColorsTuple = [
  "#f4f4f6",
  "#e6e6e6",
  "#cacaca",
  "#acacb0",
  "#939399",
  "#83838c",
  "#7b7b86",
  "#696974",
  "#5d5d69",
  "#1c1c21",
];

/* ==========================================
   MANTINE THEME
   ========================================== */

export const theme = createTheme({
  primaryColor: "octopush-red",
  primaryShade: 5,
  autoContrast: true,
  colors: {
    "octopush-red": octopushRed,
    "octopush-cyan": octopushCyan,
    "octopush-orange": octopushOrange,
    "octopush-green": octopushGreen,
    "octopush-danger": octopushDanger,
    "octopush-blue": octopushBlue,
    "octopush-yellow": octopushYellow,
    "octopush-base": octopushBase,
    "octopush-black": octopushBlack,
    "octopush-border-dark": octopushBorderDark,
    "octopush-border-light": octopushBorderLight,
    "octopush-gray": octopushGray,
  },
});

/* ==========================================
   CSS VARIABLES RESOLVER
   Maps semantic tokens to palette shades
   for automatic light/dark switching.
   ========================================== */

export const resolver: CSSVariablesResolver = (theme) => ({
  variables: {
    "--octopush-color-primary": theme.colors["octopush-red"][4],
  },
  light: {
    "--octopush-color-primary": theme.colors["octopush-red"][4],
    "--octopush-color-base": theme.colors["octopush-black"][0],
    "--octopush-color-surface": theme.colors["octopush-base"][1],
    "--octopush-color-elevated": theme.colors["octopush-gray"][2],
    "--octopush-color-divider": theme.colors["octopush-border-light"][1],
    "--octopush-color-input": theme.colors["octopush-gray"][1],
    "--octopush-color-foreground": theme.colors["octopush-gray"][9],
    "--octopush-color-subtle": theme.colors["octopush-gray"][7],
    "--octopush-color-muted": theme.colors["octopush-gray"][4],
    "--octopush-color-success": theme.colors["octopush-green"][0],
    "--octopush-color-success-foreground": theme.colors["octopush-green"][8],
    "--octopush-color-error": theme.colors["octopush-red"][0],
    "--octopush-color-error-foreground": theme.colors["octopush-red"][8],
  },
  dark: {
    "--octopush-color-primary": theme.colors["octopush-red"][4],
    "--octopush-color-base": theme.colors["octopush-black"][9],
    "--octopush-color-surface": theme.colors["octopush-base"][8],
    "--octopush-color-elevated": theme.colors["octopush-gray"][7],
    "--octopush-color-divider": theme.colors["octopush-border-dark"][9],
    "--octopush-color-input": theme.colors["octopush-gray"][8],
    "--octopush-color-foreground": theme.colors["octopush-gray"][0],
    "--octopush-color-subtle": theme.colors["octopush-gray"][2],
    "--octopush-color-muted": theme.colors["octopush-gray"][5],
    "--octopush-color-success": theme.colors["octopush-green"][9],
    "--octopush-color-success-foreground": theme.colors["octopush-green"][4],
    "--octopush-color-error": theme.colors["octopush-red"][9],
    "--octopush-color-error-foreground": theme.colors["octopush-red"][3],
  },
});
