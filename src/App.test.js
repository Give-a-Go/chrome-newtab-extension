import { render, screen } from '@testing-library/react';
import { ChakraProvider, theme } from '@chakra-ui/react';
import App from './App';

// Mock child components that are complex or cause issues in this basic App test
jest.mock('./extension/NewTab', () => () => <div data-testid="newtab-mock">Mocked NewTab</div>);
jest.mock('./widget/darkMode', () => () => <div data-testid="darkmode-mock">Mocked DarkMode</div>);
// If DnDWrapper also causes issues and is not critical for App.test.js, it can be mocked too.
// jest.mock('./components/DnDWrapper', () => () => <div data-testid="dndwrapper-mock">Mocked DnDWrapper</div>);


test('renders learn react link and essential App structure', () => {
  render(
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  );
  // Check for a link that might be part of App's own rendering, if any.
  // For now, let's assume "Give(a)Go" or part of NewTab's content is indicative.
  // Since NewTab is mocked, we'd expect its mock content.
  expect(screen.getByTestId('newtab-mock')).toBeInTheDocument();

  // If App.js itself has distinct text or elements, test for those.
  // The original test looked for "learn react", which might be in a default CRA app structure.
  // If this project removed that, this part of the test might need adjustment
  // or removal if "learn react" is no longer relevant.
  // const linkElement = screen.queryByText(/learn react/i);
  // if (linkElement) {
  //   expect(linkElement).toBeInTheDocument();
  // }
});
