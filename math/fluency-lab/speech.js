// Read-aloud for math text, shared by trail rounds and the Game Room.
export const spoken = (text) =>
  text
    .replaceAll("×", " times ")
    .replaceAll("÷", " divided by ")
    .replaceAll("−", " minus ")
    .replaceAll("= ?", " equals what?")
    .replace(/\^(\d+)/g, " to the power of $1")
    .replaceAll("√", "the square root of ");

export const canSpeak = () => "speechSynthesis" in window;

export function speak(text) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(spoken(text)));
}
