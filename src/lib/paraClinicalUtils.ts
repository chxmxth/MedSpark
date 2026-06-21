import { UserProfile } from "../types";

const FALLBACK_QUESTIONS = [
  "What is the pathological basis of this disease?",
  "What are the biochemical features of this condition?",
  "What are the common genetic mutations associated with this disorder?",
  "What is the typical pharmacological management and its mechanism of action?"
];

/**
 * Returns a selected para-clinical question based on the user's manual request,
 * their preferred questions list, or a set of fallback questions.
 *
 * @param userProfile - The current user's profile containing their preferred questions.
 * @param manualTopic - An explicitly requested topic/question.
 * @returns A randomly selected question or the manually requested topic.
 */
export function getParaClinicalQuestion(
  userProfile?: UserProfile,
  manualTopic?: string
): string {
  // If a manual topic is provided, use it directly
  if (manualTopic && manualTopic.trim() !== "") {
    return manualTopic.trim();
  }

  // If the user has a list of preferred questions, select a random one
  if (userProfile?.preferredQuestions && userProfile.preferredQuestions.length > 0) {
    const randomIndex = Math.floor(Math.random() * userProfile.preferredQuestions.length);
    return userProfile.preferredQuestions[randomIndex];
  }

  // Otherwise, use a random fallback question
  const randomIndex = Math.floor(Math.random() * FALLBACK_QUESTIONS.length);
  return FALLBACK_QUESTIONS[randomIndex];
}
