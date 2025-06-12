// src/WeatherWidget.js
import React, { useState, useEffect } from "react";
import { Box, Text, Spinner, Input, Button } from "@chakra-ui/react";
import axios from "axios";
import { getWeatherDescription } from "./weatherDescription";

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [inputCity, setInputCity] = useState("");
  const [error, setError] = useState("");

  const fetchWeather = async (latitude, longitude) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        "https://api.open-meteo.com/v1/forecast",
        {
          params: {
            latitude: latitude,
            longitude: longitude,
            current_weather: true,
          },
        }
      );
      setWeather(response.data.current_weather);
    } catch (err) {
      console.error("Error fetching weather data:", err);
      setError("Failed to fetch weather data.");
      setWeather(null); // Clear weather on error
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationByIp = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`https://ipapi.co/json/`);
      const { city: ipCity, latitude, longitude } = response.data;
      setCity(ipCity); // Set city from IP
      await fetchWeather(latitude, longitude);
      // Do not store IP-based location in localStorage, only user-selected cities
    } catch (err) {
      console.error("Error fetching IP location data:", err);
      setError("Could not fetch location automatically. Please search for a city.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      const cachedLocation = localStorage.getItem("location");
      if (cachedLocation) {
        try {
          const { city: cachedCity, latitude, longitude } = JSON.parse(cachedLocation);
          setCity(cachedCity);
          await fetchWeather(latitude, longitude);
        } catch (err) {
          console.error("Error processing cached location:", err);
          localStorage.removeItem("location"); // Clear corrupted cache
          await fetchLocationByIp(); // Fallback to IP if cache is bad
        }
      } else {
        await fetchLocationByIp();
      }
    };

    initialLoad();
  }, []); // Runs once on mount


  const handleCitySubmit = async () => {
    if (!inputCity.trim()) {
      setError("Please enter a city name.");
      return;
    }
    setLoading(true);
    setWeather(null); // Clear previous weather data
    setError(""); // Clear previous errors

    try {
      const geoResponse = await axios.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        {
          params: {
            name: inputCity,
            count: 1,
            language: "en",
            format: "json",
          },
        }
      );

      if (geoResponse.data && geoResponse.data.results && geoResponse.data.results.length > 0) {
        const { name, latitude, longitude } = geoResponse.data.results[0];
        localStorage.setItem(
          "location",
          JSON.stringify({ city: name, latitude, longitude })
        );
        setCity(name);
        await fetchWeather(latitude, longitude);
        setInputCity("");
      } else {
        setError(`City "${inputCity}" not found. Please try another city.`);
        setCity(""); // Clear city if not found
        setWeather(null);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching geocoding data:", err);
      setError("Failed to fetch city data. Please try again.");
      setCity("");
      setWeather(null);
      setLoading(false);
    }
  };

  const weatherDescription = weather ? getWeatherDescription(weather.weathercode) : "";

  return (
    <Box
      width="250px"
      p="4"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      textAlign="center"
    >
      <Input
        placeholder="Enter city"
        value={inputCity}
        onChange={(e) => setInputCity(e.target.value)}
        mb="2"
        isInvalid={!!error && inputCity /* Show error on input if related to input */}
        isDisabled={loading}
      />
      <Button onClick={handleCitySubmit} mb="4" isLoading={loading} loadingText="Loading...">
        Get Weather
      </Button>

      {error && (
        <Text color="red.500" mb="4">
          {error}
        </Text>
      )}

      {loading && !weather && (
        <Box display="flex" alignItems="center" justifyContent="center" my="4">
          <Spinner size="xl" />
        </Box>
      )}

      {!loading && !weather && !city && !error && (
         <Text>Search for a city to see the weather.</Text>
      )}

      {city && weather && !error && (
        <>
          <Text fontSize="xl" fontWeight="bold">
            {city}
          </Text>
          <Text fontSize="lg">{weatherDescription}</Text>
          <Text fontSize="2xl">{weather.temperature}°C</Text>
        </>
      )}
    </Box>
  );
};

export default WeatherWidget;
