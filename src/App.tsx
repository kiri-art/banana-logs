import React from "react";
import "./App.css";
import ModelView from "./ModelView";

const lsBananaUserModels = localStorage.bananaUserModels || "";

export interface ModelStub {
  modelID: string;
  modelKey: string;
}

export interface Model {
  modelID: string;
  modelKey: string;
  callsFinished: number;
  docs: string;
  healthyPods: 0;
  minReplicas: 0;
  queuedTasks: number;
  requestedPods: number;
  suggestedPods: number;
  sourceGitRepo: string;
  status: string;
  timeout: number;
  workingTasks: number;
  // us (banana-logs)
  _checking: boolean;
  _optimized: boolean | null;
  _setOptimized: (optimized: boolean | null) => void;
}

function App() {
  const [modelString, setModelString] = React.useState(lsBananaUserModels);
  const [modelStringError, setModelStringError] = React.useState("");
  const modelDataRef = React.useRef<Record<string, Model>>({});
  const [modelData, setModelData] = React.useState<Record<string, Model>>({});
  const [checkDisabled, setCheckDisabled] = React.useState("");

  const models = React.useMemo<Model[] | ModelStub[]>(() => {
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
    return models;
  }, [modelString]);

  async function check() {
    await Promise.all(
      models.map(async (model, i) => {
        setCheckDisabled(`${i} / ${models.length}`);

        const setOptimized = (optimized: boolean | null) => {
          modelDataRef.current = {
            ...modelDataRef.current,
            [model.modelID]: {
              ...model,
              ...(modelDataRef.current[model.modelID] as Model),
              _optimized: optimized,
            },
          };
          setModelData(modelDataRef.current);
        };

        modelDataRef.current = {
          ...modelDataRef.current,
          [model.modelID]: {
            ...model,
            ...(modelDataRef.current[model.modelID] as Model),
            _checking: true,
            _setOptimized: setOptimized,
          },
        };
        setModelData(modelDataRef.current);
        const response = await fetch(
          "https://backend-f3tq-qvcm.zeet-audiblogs.zeet.app/model/" +
            model.modelID
        );
        const result = await response.json();
        modelDataRef.current = {
          ...modelDataRef.current,
          [model.modelID]: {
            ...result,
            _setOptimized: setOptimized,
          },
        };
        setModelData(modelDataRef.current);
      })
    );
    setCheckDisabled("");
  }

  console.log(modelData);

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
          zeet.app.
        </div>
        <br />
        <button onClick={check} disabled={!!checkDisabled}>
          {checkDisabled || "Check"}
        </button>
        <br />
        {models.map((model) => (
          <ModelView
            key={model.modelID}
            model={modelData[model.modelID] || model}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
