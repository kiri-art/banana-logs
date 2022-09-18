import React from "react";
import "./App.css";
import ModelView from "./ModelView";

const lsBananaUserModels = localStorage.bananaUserModels || "";

export interface ModelStub {
  modelID: string;
  modelKey: string;
}

function App() {
  const [modelString, setModelString] = React.useState(lsBananaUserModels);
  const [modelStringError, setModelStringError] = React.useState("");

  const models = React.useMemo<ModelStub[]>(() => {
    if (
      (modelString.startsWith("'") && modelString.endsWith("'")) ||
      (modelString.startsWith('"') && modelString.endsWith('"'))
    ) {
      setModelString(modelString.substring(1, modelString.length - 1));
      return [];
    }

    let models;
    try {
      models = JSON.parse(modelString);
    } catch (error) {
      if (error instanceof Error) setModelStringError(error.message);
      return [];
    }

    if (lsBananaUserModels !== modelString)
      localStorage.bananaUserModels = modelString;
    if (modelStringError) setModelStringError("");

    if (!Array.isArray(models)) return [];

    return models;
  }, [modelString]);

  return (
    <div className="App">
      <div>
        <h1>Banana Logs</h1>
        <p>
          Log in to <a href="https://app.banana.dev/">app.banana.dev</a>, open
          developer console, and copy and paste the result of:
        </p>
        <pre style={{ marginLeft: "15px" }}>
          JSON.stringify(JSON.parse(localStorage.bananaState).bananaUserModels);
        </pre>
        <div>
          <textarea
            style={{ marginLeft: "15px", width: "500px" }}
            value={modelString}
            onChange={(event) => setModelString(event.target.value)}
          />
        </div>
        {modelString && modelStringError && (
          <div style={{ color: "red" }}>{modelStringError}</div>
        )}
        <br />
        <div>
          Note: This is a SPA with no backend. Above data is saved to
          localStorage only. You're encouraged to open the developer console and
          see for yourself that no data is sent over the network except to
          zeet.app (where Banana store their logs), and review the code on{" "}
          <a href="https://github.com/gadicc/banana-logs">GitHub</a>.
        </div>
        <br />
        {models.map((model) => (
          <ModelView
            key={model.modelID}
            modelID={model.modelID}
            modelKey={model.modelKey}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
