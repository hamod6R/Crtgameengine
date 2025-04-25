import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAudio } from "./lib/stores/useAudio";

function App() {
  // Set up audio when the app loads
  useEffect(() => {
    // Initialize audio elements but don't autoplay them
    const backgroundMusic = new Audio("/sounds/background.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    
    const hitSound = new Audio("/sounds/hit.mp3");
    hitSound.volume = 0.5;
    
    const successSound = new Audio("/sounds/success.mp3");
    successSound.volume = 0.5;
    
    // Store the audio elements in the store
    useAudio.getState().setBackgroundMusic(backgroundMusic);
    useAudio.getState().setHitSound(hitSound);
    useAudio.getState().setSuccessSound(successSound);
    
    return () => {
      // Clean up audio elements when component unmounts
      backgroundMusic.pause();
      hitSound.pause();
      successSound.pause();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  );
}

export default App;
