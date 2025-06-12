import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import WeatherWidget from './weatherWidget';

jest.mock('axios');
jest.mock('./weatherDescription', () => ({
  getWeatherDescription: jest.fn((code) => `Description for code ${code}`),
}));

describe('WeatherWidget', () => {
  beforeEach(() => {
    axios.get.mockReset();
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders correctly and shows input field, then loads IP based weather', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { city: 'Initial IP City', latitude: 50, longitude: 50 } }) // 1. IP API
      .mockResolvedValueOnce({ data: { current_weather: { temperature: 15, weathercode: 1 } } }); // 2. Weather API for IP city

    render(<WeatherWidget />);
    expect(screen.getByPlaceholderText('Enter city')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Initial IP City')).toBeInTheDocument();
      expect(screen.getByText('15°C')).toBeInTheDocument();
      expect(screen.getByText('Description for code 1')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /get weather/i })).toBeInTheDocument();
  });

  test('fetches and displays weather for an entered city, saves to localStorage', async () => {
    // Phase 1: Initial Load (IP based)
    axios.get
      .mockResolvedValueOnce({ data: { city: 'Default IP City', latitude: 1, longitude: 1 } })
      .mockResolvedValueOnce({ data: { current_weather: { temperature: 10, weathercode: 0 } } });

    render(<WeatherWidget />);

    await waitFor(() => expect(screen.getByText('Default IP City')).toBeInTheDocument());
    expect(screen.getByText('10°C')).toBeInTheDocument();
    expect(screen.getByText('Description for code 0')).toBeInTheDocument();

    const getWeatherButton = await screen.findByRole('button', { name: /get weather/i });
    expect(getWeatherButton).toBeEnabled();

    // Phase 2: User searches for "Test City"
    axios.get.mockReset(); // Clear previous mocks before setting new ones for this interaction
    axios.get
      .mockResolvedValueOnce({ data: { results: [{ name: 'Test City', latitude: 10, longitude: 20 }] } })
      .mockResolvedValueOnce({ data: { current_weather: { temperature: 25, weathercode: 2 } } });

    fireEvent.change(screen.getByPlaceholderText('Enter city'), { target: { value: 'Test City' } });
    fireEvent.click(getWeatherButton);

    await waitFor(() => expect(screen.getByText('Test City')).toBeInTheDocument());
    expect(screen.getByText('25°C')).toBeInTheDocument();
    expect(screen.getByText('Description for code 2')).toBeInTheDocument();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'location',
      JSON.stringify({ city: 'Test City', latitude: 10, longitude: 20 })
    );
  });

  test('falls back to IP-based location if localStorage is empty', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { city: 'IP City From Test', latitude: 30, longitude: 40 } })
      .mockResolvedValueOnce({ data: { current_weather: { temperature: 22, weathercode: 3 } } });

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByText('IP City From Test')).toBeInTheDocument();
      expect(screen.getByText('22°C')).toBeInTheDocument();
      expect(screen.getByText('Description for code 3')).toBeInTheDocument();
    });
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test('handles city not found error, retains last known weather', async () => {
    // Phase 1: Initial Load
    axios.get
      .mockResolvedValueOnce({ data: { city: 'Default IP City', latitude: 1, longitude: 1 } })
      .mockResolvedValueOnce({ data: { current_weather: { temperature: 10, weathercode: 0 } } });

    render(<WeatherWidget />);
    await waitFor(() => expect(screen.getByText('Default IP City')).toBeInTheDocument());
    expect(screen.getByText('10°C')).toBeInTheDocument();
    expect(screen.getByText('Description for code 0')).toBeInTheDocument();

    const getWeatherButton = await screen.findByRole('button', {name: /get weather/i});
    expect(getWeatherButton).toBeEnabled();

    // Phase 2: User Search (fails)
    axios.get.mockReset();
    axios.get
      .mockResolvedValueOnce({ data: { results: [] } }); // Geocoding API returns no results for "Unknown City"
      // No further weather API call should be made by the component for "Unknown City"

    fireEvent.change(screen.getByPlaceholderText('Enter city'), { target: { value: 'Unknown City' } });
    fireEvent.click(getWeatherButton);

    await waitFor(() => {
      expect(screen.getByText('City "Unknown City" not found. Please try another city.')).toBeInTheDocument();
    });

    // Check that the "Default IP City" weather is still displayed
    expect(screen.getByText('Default IP City')).toBeInTheDocument();
    expect(screen.getByText('10°C')).toBeInTheDocument();
    expect(screen.getByText('Description for code 0')).toBeInTheDocument();
    expect(screen.queryByText('Unknown City')).not.toBeInTheDocument();
  });

   test('falls back to IP if fetching weather for stored city fails', async () => {
    localStorage.setItem('location', JSON.stringify({ city: 'Cached City', latitude: 5, longitude: 15 }));

    // This test involves a specific sequence of failure and recovery, so a more detailed mock implementation is suitable.
    axios.get.mockImplementation(url => {
      if (url.includes('api.open-meteo.com/v1/forecast') && url.includes('latitude=5')) { // For "Cached City"
        return Promise.reject(new Error('Failed to fetch weather for cached city'));
      }
      if (url.includes('ipapi.co/json/')) { // For IP fallback
        return Promise.resolve({ data: { city: 'IP Fallback City', latitude: 1, longitude: 2 } });
      }
      if (url.includes('api.open-meteo.com/v1/forecast') && url.includes('latitude=1')) { // For "IP Fallback City"
        return Promise.resolve({ data: { current_weather: { temperature: 10, weathercode: 3 } } });
      }
      // Important: Add a fallback for any other unexpected calls to avoid tests hanging or producing unclear errors.
      console.error("Unhandled axios.get call in 'falls back to IP' test:", url);
      return Promise.reject(new Error(`Unexpected API call in test 'falls back to IP if fetching weather for stored city fails': ${url}`));
    });

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByText('IP Fallback City')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('10°C')).toBeInTheDocument();
    expect(screen.getByText('Description for code 3')).toBeInTheDocument();
    expect(localStorage.removeItem).toHaveBeenCalledWith('location');
  });
});
