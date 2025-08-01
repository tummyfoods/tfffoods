"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { HexColorPicker } from "react-colorful";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Moon, Sun } from "lucide-react";

export default function ThemeSettings() {
  const lightPickerRef = useRef<HTMLDivElement>(null);
  const darkPickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close color pickers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        lightPickerRef.current &&
        !lightPickerRef.current.contains(event.target as Node)
      ) {
        setShowLightPicker(false);
      }
      if (
        darkPickerRef.current &&
        !darkPickerRef.current.contains(event.target as Node)
      ) {
        setShowDarkPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const { theme, setTheme } = useTheme();
  const [lightBgColor, setLightBgColor] = useState("#ffffff");
  const [darkBgColor, setDarkBgColor] = useState("#1a1a1a");
  const [showLightPicker, setShowLightPicker] = useState(false);
  const [showDarkPicker, setShowDarkPicker] = useState(false);

  // Load saved colors on mount
  useEffect(() => {
    const savedLightBg =
      localStorage.getItem("lightModeBackground") || "#ffffff";
    const savedDarkBg = localStorage.getItem("darkModeBackground") || "#1a1a1a";
    setLightBgColor(savedLightBg);
    setDarkBgColor(savedDarkBg);
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem("lightModeBackground", lightBgColor);
    localStorage.setItem("darkModeBackground", darkBgColor);

    // Trigger a storage event to update colors
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "lightModeBackground",
      })
    );

    toast.success("Theme settings saved");
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Theme Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Light Mode Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Light Mode</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="lightBgColor">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: lightBgColor }}
                  onClick={() => setShowLightPicker(!showLightPicker)}
                />
                <Input
                  id="lightBgColor"
                  value={lightBgColor}
                  onChange={(e) => setLightBgColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showLightPicker && (
                <div className="absolute mt-2 z-10" ref={lightPickerRef}>
                  <HexColorPicker
                    color={lightBgColor}
                    onChange={setLightBgColor}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Dark Mode Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Dark Mode</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="darkBgColor">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ backgroundColor: darkBgColor }}
                  onClick={() => setShowDarkPicker(!showDarkPicker)}
                />
                <Input
                  id="darkBgColor"
                  value={darkBgColor}
                  onChange={(e) => setDarkBgColor(e.target.value)}
                  className="font-mono"
                />
              </div>
              {showDarkPicker && (
                <div className="absolute mt-2 z-10" ref={darkPickerRef}>
                  <HexColorPicker
                    color={darkBgColor}
                    onChange={setDarkBgColor}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Button onClick={handleSave} className="mt-6">
        Save Changes
      </Button>
    </div>
  );
}
