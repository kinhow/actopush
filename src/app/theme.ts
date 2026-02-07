import { createTheme, type MantineColorsTuple } from "@mantine/core";

const primaryCrimson: MantineColorsTuple = [
  "#FFE0E8",
  "#FFC2D1",
  "#FF99B0",
  "#FF6D8A",
  "#FF4D6F",
  "#FF2D55",
  "#E6194B",
  "#CC0033",
  "#A30029",
  "#800020",
];

export const theme = createTheme({
  primaryColor: "primary",
  primaryShade: 5,
  colors: {
    primary: primaryCrimson,
  },
});
