import { createTheme, type MantineColorsTuple } from "@mantine/core";

const primaryYellow: MantineColorsTuple = [
  "#FFFDE7",
  "#FFF9C4",
  "#FFF59D",
  "#FFF176",
  "#FFEE58",
  "#FFE500",
  "#FFD400",
  "#FFC107",
  "#FFB300",
  "#FFA000",
];

export const theme = createTheme({
  primaryColor: "primary",
  primaryShade: 6,
  colors: {
    primary: primaryYellow,
  },
});
