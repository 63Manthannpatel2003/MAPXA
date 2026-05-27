import React, { useEffect, useState } from "react";
import "./App.css";
import FileUpload from "./views/FileUpload";
import RosterPage from "./views/RosterPage";

const STORAGE_KEY = "smart-roster-result";

const App = () => {
  const [route, setRoute] = useState(window.location.hash || "#/upload");
  const [result, setResult] = useState(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.hash || "#/upload");
    window.addEventListener("hashchange", syncRoute);

    if (!window.location.hash) {
      window.location.hash = "#/upload";
    }

    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const handleSuccess = (data) => {
    setResult(data);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.location.hash = "#/roster";
  };

  const handleBack = () => {
    window.location.hash = "#/upload";
  };

  return (
    <div className="App">
      {route === "#/roster" && result ? (
        <RosterPage result={result} onBack={handleBack} />
      ) : (
        <FileUpload onSuccess={handleSuccess} />
      )}
    </div>
  );
};

export default App;
