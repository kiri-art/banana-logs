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
  auto,
}: {
  modelID: string;
  modelKey: string;
  auto: boolean;
}) {
  const [checking, setChecking] = React.useState(false);
  const [model, setModel] = React.useState<Model | null>(null);
  const [requestedLogs, setRequestedLogs] = React.useState<number | null>(null);
  const [optimized, setOptimized] = React.useState<boolean | null>(null);

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
    if (!auto) return;
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [auto]);

  if (!model)
    return (
      <tr>
        <td colSpan={7}>Loading {modelKey}</td>
      </tr>
    );

  return (
    <>
      <tr className={"model " /* + (checking && "modelChecking") */}>
        <td>
          {model.sourceGitRepo ? (
            <span className="repoName">
              {model.sourceGitRepo.split("/")[1]}
            </span>
          ) : (
            modelKey.substring(0, 7)
          )}{" "}
          <button
            onClick={() => setRequestedLogs(requestedLogs ? null : Date.now())}
          >
            Logs
          </button>
        </td>
        <td align="center">
          <span
            className={
              "chip status" + camelcase(model.status, { pascalCase: true })
            }
          >
            {model.status}
          </span>
        </td>
        <td align="center">
          {model && (optimized === true || optimized === false) && (
            <span
              className={
                "chip status" + (optimized ? "Deployed" : "BuildFailed")
              }
            >
              {optimized ? "Optimized" : "Not Optimized"}
            </span>
          )}
        </td>
        <td align="center">{model.queuedTasks}</td>
        <td align="center">{model.workingTasks}</td>
        <td align="center">{model.callsFinished}</td>
        <td>
          {auto}
          {!auto && (
            <button disabled={checking} onClick={check}>
              ⟳
            </button>
          )}{" "}
          {/* checking && "⏳" /* : <button onClick={check}>⟳</button> */}
        </td>
      </tr>
      {requestedLogs && (
        <tr>
          <td colSpan={7}>
            <Logs
              modelID={modelID}
              setOptimized={setOptimized}
              requestedLogs={requestedLogs}
            />
          </td>
        </tr>
      )}
    </>
  );
}
