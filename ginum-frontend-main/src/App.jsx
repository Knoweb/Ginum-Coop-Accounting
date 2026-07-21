import React from "react";
import "./App.css";
import AppRouter from "./routes/AppRouter";

function App() {
  return (
    <>
      {/* Main Content */}
      <div className="mt-4">
        <AppRouter />
      </div>
    </>
  );
}

export default App;
