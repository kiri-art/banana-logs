import React from "react";
import { format } from "date-fns";
import Ansi from "ansi-to-react";

import type { Model } from "./App";
import getLog from "./getLog";

interface LogsResult {
  logIDs: string[];
}

interface Log {
  date: Date;
  name: string;
}

function fixLog(log: string) {
  // @ts-expect-error: blah
  window.log = log;
  return (
    log
      .replace(/([\]\)])([A-Z])/g, "$1\n$2")
      //.replace(/(\x1B\[36mINFO\x1B\[0m[0000]) /g, "\n$1/")
      .replace(/(\x1B\[36mINFO\x1B\[0m\[\d{4,4}\])/g, "\n$1")
      .replace(/  File/g, "\n  File")
      .replace(/([^ ])( {4,4})([^ ])/g, "$1\n$2$3")
  );
}

// export default function Logs({ modelID }: { modelID: string }) {
export default function Logs({ model }: { model: Model }) {
  const [_logs, _setLogs] = React.useState<LogsResult | null>(null);
  const [disabled, setDisabled] = React.useState(false);
  const [loadedLog, setLoadedLog] = React.useState("");

  async function load() {
    setDisabled(true);
    const response = await fetch(
      "https://backend-f3tq-qvcm.zeet-audiblogs.zeet.app/model/" +
        model.modelID +
        "/logs"
    );
    const result: LogsResult = await response.json();
    _setLogs(result);
    setDisabled(false);
  }

  async function logSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const logID = event.target.value;
    const log = await getLog(model.modelID, logID);
    setLoadedLog(log);
  }

  const logs = React.useMemo(() => {
    if (!_logs) return [];
    const logs = _logs.logIDs
      .map((name: string) => {
        const match = name.match(/_([\d]+)\.log$/);
        const timestamp = match && match[1] && parseInt(match[1]);
        const date = timestamp ? new Date(timestamp * 1000) : new Date(NaN);

        const typeMatch = name.match(/^(.+?)_/);
        const type = typeMatch && typeMatch[1];

        return {
          type,
          date,
          name,
        };
      })
      .sort((a: Log, b: Log) => b.date.getTime() - a.date.getTime());

    //console.log(logs);

    // Check most recent build log for optimized status
    const mostRecentBuildLog = logs.filter((log) => log.type === "build")[0];
    (async function checkRecentBuild() {
      if (!mostRecentBuildLog) return;
      console.log({ mostRecentBuildLog });
      const log = await getLog(model.modelID, mostRecentBuildLog.name);
      console.log(log);

      if (log.match(/Optimization Failed/)) model._setOptimized(false);
      else if (log.match(/optimizations SUCCESS/)) model._setOptimized(true);
      // Note, we've already checked for "Optimization Failed" - guess this means
      // it succeeded `:)
      else if (log.match(/Running optimizations/)) model._setOptimized(true);
      else model._setOptimized(null);
    })();

    console.log(logs);
    return logs;
  }, [_logs]);

  return (
    <div>
      <button onClick={load} disabled={disabled}>
        {disabled ? "Loading..." : "Load Logs"}
      </button>
      {logs.length > 0 && (
        <span>
          <select onChange={logSelect}>
            <option value="">Choose Build Log</option>
            {logs
              .filter((log) => log.type === "build")
              .map((log) => (
                <option key={log.name} value={log.name}>
                  {format(log.date, "yyyy-MM-dd kk:mm:ss")}
                </option>
              ))}
          </select>

          <select onChange={logSelect}>
            <option value="">Choose Runtime Log</option>
            {logs
              .filter((log) => log.type === "build")
              .map((log) => (
                <option key={log.name} value={log.name}>
                  {format(log.date, "yyyy-MM-dd kk:mm:ss")}
                </option>
              ))}
          </select>

          {loadedLog && <button>⟳</button>}
        </span>
      )}

      {loadedLog && (
        <div className="log">
          <pre>
            <Ansi>{fixLog(loadedLog)}</Ansi>
          </pre>
        </div>
      )}
    </div>
  );
}
