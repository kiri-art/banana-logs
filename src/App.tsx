import React from "react";
import "./App.css";

function App() {
  return (
    <div className="App">
      <div>
        <h1>Banana Logs</h1>

        <p>
          Log in to <a href="https://app.banana.dev/">app.banana.dev</a>, open
          developer console, and copy and paste the result of:
        </p>

        <p>
          <pre style={{ paddingLeft: "15px" }}>
            JSON.stringify(JSON.parse(localStorage.bananaState).bananaUserModels);
          </pre>
        </p>

        <textarea
          value={models}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
    </div>
  );
}

export default App;
