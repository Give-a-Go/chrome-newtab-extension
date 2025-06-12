import { Flex, Input, Text, useColorMode } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import DnDWrapper from "../components/DnDWrapper";
import WeatherWidget from "../widget/weather/weatherWidget";
import DevJokeGeneratorWidget from "../widget/jokeGenerator/DevJokeGeneratorWidget";
import SpotifyWidget from "../widget/spotify/SpotifyWidget";
import DarkMode from "../widget/darkMode";
import GgoSearch from "../components/GgoSearch";

export const widgets = [
  <WeatherWidget />,
  <DevJokeGeneratorWidget />,
  <DarkMode />,
  <SpotifyWidget />,
];

function NewTab() {
  const { colorMode } = useColorMode();
  // nameInput stores the actual name string (e.g., "Sanat")
  // or an empty string if no name is set (to show "there" as placeholder)
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setNameInput(storedName);
    } else {
      setNameInput("");
    }
  }, []);

  const handleNameInputChange = (event) => {
    setNameInput(event.target.value);
  };

  const handleNameSubmit = () => {
    const trimmedName = nameInput.trim();
    if (trimmedName === "") {
      localStorage.removeItem("userName");
      setNameInput(""); // Keep input blank
    } else {
      localStorage.setItem("userName", trimmedName);
      setNameInput(trimmedName); // Update input to reflect trimmed name
    }
  };

  return (
    <Flex
      w="100%"
      bgGradient={
        colorMode === "light"
          ? "linear-gradient(90deg, rgba(71,62,209,1) 0%, rgba(159,121,236,1) 100%)"
          : "linear-gradient(90deg, rgba(36, 32, 97,1) 0%, rgba(86, 61, 135,1) 100%)"
      }
      minH="100vh"
      p="10"
      overflow="hidden"
      flexDir="column"
      align="center"
    >
      <Flex w="100%" justify="space-between" align="center">
        <Flex align="center">
          <Text color="white" fontSize="md" fontFamily="monospace" mr="1">
            Hey
          </Text>
          <Input
            value={nameInput}
            onChange={handleNameInputChange}
            onBlur={handleNameSubmit}
            onKeyPress={(event) => {
              if (event.key === "Enter") {
                handleNameSubmit();
                event.target.blur(); // Optional: blur input on Enter
              }
            }}
            placeholder="there"
            color="white"
            fontSize="md"
            fontFamily="monospace"
            variant="flushed"
            w="auto" // Adjust width based on content, or set a fixed one like "150px"
            maxW="200px" // Max width to prevent it from becoming too long
            _placeholder={{ color: "gray.300" }}
            px="2" // Padding for the input text
          />
          <Text color="white" fontSize="md" fontFamily="monospace" ml="1">
            ! 👋
          </Text>
        </Flex>
        <Text color="white" fontSize="md" fontFamily="monospace">
          Give(a)Go
        </Text>
      </Flex>
      <GgoSearch />
      <DnDWrapper />
    </Flex>
  );
}

export default NewTab;
