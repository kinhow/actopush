import { createTheme, type MantineColorsTuple } from "@mantine/core";

/* ==========================================
   OCTOPUSH BRAND PALETTES
   10-shade (0 = lightest, 9 = darkest)
   Primary shade = 5
   ========================================== */

const octopushRed: MantineColorsTuple = [
  "#FFE3E3", "#FFC9C9", "#FFA8A8", "#FF8787", "#FF6B6B",
  "#FF2D55", "#E6194B", "#C92A2A", "#A61E1E", "#801515",
];

const octopushCyan: MantineColorsTuple = [
  "#E0FFFE", "#B3FFFC", "#80FFFA", "#4DFFF7", "#26FFF5",
  "#00FFFF", "#00CCCC", "#009999", "#007A7A", "#005C5C",
];

const octopushOrange: MantineColorsTuple = [
  "#FFF4E6", "#FFE8CC", "#FFD8A8", "#FFC078", "#FFAB54",
  "#FF9500", "#E68600", "#CC7700", "#A35F00", "#7A4700",
];

const octopushGreen: MantineColorsTuple = [
  "#ECFFD9", "#D8FFB3", "#C2FF8C", "#ABFF66", "#72FF3D",
  "#39FF14", "#32E612", "#28B30E", "#1E800A", "#144D06",
];

const octopushDanger: MantineColorsTuple = [
  "#FFE0E6", "#FFC2CC", "#FFA3B3", "#FF8599", "#FF5C75",
  "#FF0040", "#CC0033", "#990026", "#66001A", "#33000D",
];

const octopushBlue: MantineColorsTuple = [
  "#E7F5FF", "#D0EBFF", "#A5D8FF", "#74C0FC", "#4DABF7",
  "#007AFF", "#0066CC", "#1864AB", "#1458A3", "#0D4A8A",
];

const octopushYellow: MantineColorsTuple = [
  "#FFF9DB", "#FFF3BF", "#FFEC99", "#FFE066", "#FFD633",
  "#FFCC00", "#E6B800", "#CCA300", "#998A00", "#665C00",
];

const octopushGray: MantineColorsTuple = [
  "#F8F9FA", "#F1F3F5", "#E9ECEF", "#DEE2E6", "#CED4DA",
  "#ADB5BD", "#868E96", "#495057", "#343A40", "#212529",
];

/* ==========================================
   MANTINE THEME
   ========================================== */

export const theme = createTheme({
  primaryColor: "octopush-red",
  primaryShade: 5,
  colors: {
    "octopush-red": octopushRed,
    "octopush-cyan": octopushCyan,
    "octopush-orange": octopushOrange,
    "octopush-green": octopushGreen,
    "octopush-danger": octopushDanger,
    "octopush-blue": octopushBlue,
    "octopush-yellow": octopushYellow,
    "octopush-gray": octopushGray,
  },
});
