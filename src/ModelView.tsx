import React from "react";
import camelcase from "camelcase";

import type { Model } from "./App";
import Logs from "./Logs";

function GitHub(id: string) {
  const [username, repo] = id.split("/");
  return (
    <span className="github">
      <span className="githubUsername">{username}</span>/
      <span className="githubRepo">{repo}</span>
    </span>
  );
}

export default function ModelView({ model }: { model: Model }) {
  return (
    <div
      className={"model " + (model._checking && "modelChecking")}
      key={model.modelID}
    >
      <div>
        {model.sourceGitRepo && <div>{GitHub(model.sourceGitRepo)}</div>}
        <b>Model Key:</b> {model.modelKey}
        {model._checking && "⏳"}
        {model.status && (
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
          </div>
        )}
        <Logs model={model} />
      </div>
    </div>
  );
}
