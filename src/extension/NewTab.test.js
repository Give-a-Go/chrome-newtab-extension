import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider, theme } from '@chakra-ui/react';
import NewTab from './NewTab'; // Assuming path is correct
import axios from 'axios'; // WeatherWidget uses axios

// localStorage is mocked globally in setupTests.js
// axios is also mocked globally for WeatherWidget, but specific mocks might be needed.
jest.mock('axios'); // Ensure axios is mocked for safety, though setupTests might handle some.

// Mock child components that are complex and not directly under test, or make API calls.
// For WeatherWidget, since it's complex and makes API calls, mock its output or functionality.
// A simple mock:
jest.mock('../widget/weather/weatherWidget', () => () => <div data-testid="weather-widget-mock">Mocked Weather Widget</div>);
jest.mock('../widget/jokeGenerator/DevJokeGeneratorWidget', () => () => <div data-testid="joke-widget-mock">Mocked Joke Widget</div>);
jest.mock('../widget/spotify/SpotifyWidget', () => () => <div data-testid="spotify-widget-mock">Mocked Spotify Widget</div>);
jest.mock('../widget/darkMode', () => () => <div data-testid="darkmode-widget-mock">Mocked DarkMode Widget</div>);
jest.mock('../components/DnDWrapper', () => () => <div data-testid="dndwrapper-mock">Mocked DnD Wrapper</div>);
jest.mock('../components/GgoSearch', () => () => <div data-testidggosearch-mock>Mocked GgoSearch</div>);


describe('NewTab Component', () => {
  beforeEach(() => {
    // localStorage.clear() is called in setupTests.js
    axios.get.mockReset(); // Reset axios mocks
    // Provide a more specific default for WeatherWidget if it attempts to load due to NewTab rendering
    axios.get.mockResolvedValue({ data: { city: 'Default IP City', latitude: 0, longitude: 0, current_weather: {temperature: 0, weathercode: 0}, results: [] } });
  });

  const renderWithChakraProvider = (ui) => {
    return render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>);
  };

  test('renders correctly with default greeting and name input', () => {
    renderWithChakraProvider(<NewTab />);
    // Check for "Hey" and "! 👋" parts of the greeting
    expect(screen.getByText('Hey')).toBeInTheDocument();
    expect(screen.getByText('! 👋')).toBeInTheDocument();
    // Check for the input field by its placeholder "there"
    expect(screen.getByPlaceholderText('there')).toBeInTheDocument();
    // Check for other static text
    expect(screen.getByText('Give(a)Go')).toBeInTheDocument();
  });

  test('input field updates on change', () => {
    renderWithChakraProvider(<NewTab />);
    const nameInput = screen.getByPlaceholderText('there');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    expect(nameInput.value).toBe('Alice');
  });

  test('saves name to localStorage and updates greeting on submit (blur)', async () => {
    renderWithChakraProvider(<NewTab />);
    const nameInput = screen.getByPlaceholderText('there');

    fireEvent.change(nameInput, { target: { value: 'Bob' } });
    fireEvent.blur(nameInput); // Trigger submit

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('userName', 'Bob');
    });
    expect(nameInput.value).toBe('Bob'); // Input field should display the submitted name
  });

  test('saves name to localStorage and updates greeting on submit (Enter key)', async () => {
    renderWithChakraProvider(<NewTab />);
    const nameInput = screen.getByPlaceholderText('there');

    fireEvent.change(nameInput, { target: { value: 'Charlie' } });
    fireEvent.keyPress(nameInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('userName', 'Charlie');
    });
    expect(nameInput.value).toBe('Charlie');
  });

  test('loads name from localStorage and displays it in input on initial render', () => {
    localStorage.getItem.mockReturnValueOnce('Dave'); // Mock before render
    renderWithChakraProvider(<NewTab />);
    // The input field itself should contain "Dave"
    expect(screen.getByDisplayValue('Dave')).toBeInTheDocument();
  });

  test('displays default greeting (placeholder "there") if no name in localStorage', () => {
    localStorage.removeItem('userName'); // Ensure it's not set
    renderWithChakraProvider(<NewTab />);
    expect(screen.getByPlaceholderText('there')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('there').value).toBe(''); // Input field should be empty
  });

   test('handles empty string submission by removing name and showing default', async () => {
    localStorage.getItem.mockReturnValueOnce('Eve'); // Mock initial load with "Eve"
    renderWithChakraProvider(<NewTab />);

    const nameInput = screen.getByDisplayValue('Eve'); // Get by current value

    fireEvent.change(nameInput, { target: { value: '  ' } }); // Enter spaces (should be trimmed)
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('userName');
    });
    // Input field should be empty and show placeholder "there"
    expect(nameInput.value).toBe('');
    expect(nameInput.placeholder).toBe('there');
  });
});
