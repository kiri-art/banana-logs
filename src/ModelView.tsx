import React from "react";
import camelcase from "camelcase";

import Logs from "./Logs";

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

function GitHub(id: string) {
  const [username, repo] = id.split("/");
  return (
    <span className="github">
      <span className="githubUsername">{username}</span>/
      <span className="githubRepo">{repo}</span>
    </span>
  );
}

export default function ModelView({
  modelID,
  modelKey,
}: {
  modelID: string;
  modelKey: string;
}) {
  const [checking, setChecking] = React.useState(false);
  const [model, setModel] = React.useState<Model | null>(null);

  const setOptimized = React.useCallback(
    (optimized: boolean | null) => {
      model && setModel({ ...model, _optimized: optimized });
    },
    [model]
  );

  async function check() {
    setChecking(true);
    const response = await fetch(
      "https://backend-f3tq-qvcm.zeet-audiblogs.zeet.app/model/" + modelID
    );
    const result: Model = await response.json();
    setChecking(false);
    setModel(result);
    console.log(result);
  }

  React.useEffect(() => {
    check();
  }, []);

  return (
    <div className={"model " + (checking && "modelChecking")}>
      <div>
        {model && model.sourceGitRepo && (
          <div>{GitHub(model.sourceGitRepo)}</div>
        )}
        <b>Model Key:</b> {modelKey}{" "}
        {checking ? "⏳" : <button onClick={check}>⟳</button>}
        {model && (
          // Display all other data
          <div className="modelExtra">
            <span
              className={
                "chip status" + camelcase(model.status, { pascalCase: true })
              }
            >
              Status: {model.status}
            </span>

            {(model._optimized === true || model._optimized === false) && (
              <span
                className={
                  "chip status" +
                  (model._optimized ? "Deployed" : "BuildFailed")
                }
              >
                {model._optimized ? "Optimized" : "Not Optimized"}
              </span>
            )}
            <br />
            <br />
            <Logs modelID={modelID} setOptimized={setOptimized} />
          </div>
        )}
      </div>
    </div>
  );
}
