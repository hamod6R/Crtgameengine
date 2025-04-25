import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAudio } from "@/lib/stores/useAudio";
import { motion } from "framer-motion";

export default function HomePage() {
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const { toggleMute, isMuted } = useAudio();

  // Load recent projects from localStorage on component mount
  useEffect(() => {
    const loadedProjects = localStorage.getItem("recentProjects");
    if (loadedProjects) {
      try {
        setRecentProjects(JSON.parse(loadedProjects).slice(0, 3));
      } catch (e) {
        console.error("Failed to parse recent projects", e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full p-4 bg-slate-900 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <motion.h1 
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Unity-like 2D Game Engine
          </motion.h1>
          
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <i className="fas fa-volume-mute text-lg"></i>
              ) : (
                <i className="fas fa-volume-up text-lg"></i>
              )}
            </Button>
            
            <Link to="/editor">
              <Button>Open Editor</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Welcome section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold mb-6">Create 2D Games with Ease</h2>
            <p className="text-lg mb-6">
              A powerful, web-based game development environment with a visual editor 
              similar to Unity. Design, build, and deploy your own 2D games directly 
              in your browser.
            </p>
            
            <div className="flex gap-4">
              <Link to="/editor?new=true">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  New Project
                </Button>
              </Link>
              
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </motion.div>
          
          {/* Features section */}
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            {[
              { title: "Visual Editor", icon: "fas fa-edit", description: "Intuitive visual scene editor" },
              { title: "Component System", icon: "fas fa-puzzle-piece", description: "Powerful entity component system" },
              { title: "Physics Engine", icon: "fas fa-atom", description: "Built-in 2D physics capabilities" },
              { title: "Animation Tools", icon: "fas fa-film", description: "Create and edit sprite animations" }
            ].map((feature, index) => (
              <Card key={index} className="shadow-lg">
                <CardHeader className="pb-2">
                  <i className={`${feature.icon} text-2xl text-blue-500 mb-2`}></i>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
        
        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <h3 className="text-2xl font-bold mb-6">Recent Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProjects.map((project, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Last edited: {new Date(project.lastEdited).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link to={`/editor?project=${project.id}`} className="w-full">
                      <Button variant="outline" className="w-full">Open</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full p-6 bg-slate-900 text-white">
        <div className="container mx-auto text-center">
          <p>Web-based 2D Game Development Engine &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
