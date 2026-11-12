import { createTheme, type MantineColorsTuple } from '@mantine/core';

// A muted navy: calm, readable, and used sparingly (buttons, active links).
const navy: MantineColorsTuple = [
  '#eef3f9',
  '#dbe4ef',
  '#b4c6dd',
  '#8aa6cb',
  '#678bbb',
  '#517ab2',
  '#4571ae',
  '#365f99',
  '#2d5489',
  '#1f3a5f',
];

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const theme = createTheme({
  primaryColor: 'navy',
  primaryShade: 8,
  colors: { navy },
  fontFamily,
  headings: { fontFamily, fontWeight: '600' },
  defaultRadius: 'sm',
  cursorType: 'pointer',
  components: {
    Button: { defaultProps: { size: 'sm' } },
    Paper: { defaultProps: { withBorder: true, shadow: 'none' } },
    Card: { defaultProps: { withBorder: true, shadow: 'none' } },
    TextInput: { defaultProps: { size: 'sm' } },
    PasswordInput: { defaultProps: { size: 'sm' } },
    Alert: { defaultProps: { variant: 'light' } },
  },
});
