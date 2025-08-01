// components/AnimatedCard.tsx
import { Box, Text, Heading } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FC } from "react";

// Wrap Chakra's Box with Framer Motion
const MotionBox = motion(Box);

// Define props type
interface AnimatedCardProps {
  title: string;
  description: string;
}

// Functional Component with type
export const AnimatedCard: FC<AnimatedCardProps> = ({ title, description }) => {
  return (
    <MotionBox
      bg="white"
      p={6}
      rounded="lg"
      shadow="md"
      maxW="md"
      mx="auto"
      mt={10}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <Heading size="lg" mb={4}>
        {title}
      </Heading>
      <Text fontSize="md" color="gray.600">
        {description}
      </Text>
    </MotionBox>
  );
};
