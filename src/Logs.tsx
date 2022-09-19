import React from "react";
import { format } from "date-fns";
import Ansi from "ansi-to-react";

import type { Model } from "./ModelView";
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

export default function Logs({
  modelID,
  setOptimized,
  requestedLogs,
}: {
  modelID: string;
  setOptimized: (optimized: boolean | null) => void;
  requestedLogs: number | null;
}) {
  const [_logs, _setLogs] = React.useState<LogsResult | null>(null);
  const [disabled, setDisabled] = React.useState(false);
  const [loadingLog, setLoadingLog] = React.useState(false);
  const [loadedLog, setLoadedLog] = React.useState("");
  const [logID, setLogID] = React.useState("");

  async function load() {
    setDisabled(true);
    const response = await fetch(
      "https://backend-f3tq-qvcm.zeet-audiblogs.zeet.app/model/" +
        modelID +
        "/logs"
    );
    const result: LogsResult = await response.json();
    _setLogs(result);
    setDisabled(false);
  }

  async function loadLog(modelID: string, logID: string) {
    setLogID(logID);
    setLoadingLog(true);
    const log = await getLog(modelID, logID);
    setLoadingLog(false);
    setLoadedLog(log);
  }

  async function logSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const logID = event.target.value;
    await loadLog(modelID, logID);
  }

  async function reload() {
    setLoadedLog("");
    await loadLog(modelID, logID);
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
      // console.log({ mostRecentBuildLog });
      const log = await getLog(modelID, mostRecentBuildLog.name);
      // console.log(log);

      if (log.match(/Optimization Failed/)) setOptimized(false);
      else if (log.match(/optimizations SUCCESS/)) setOptimized(true);
      // Note, we've already checked for "Optimization Failed" - guess this means
      // it succeeded `:)
      else if (
        log.match(/Running optimizations/) &&
        log.match(/Model Registered/)
      )
        setOptimized(true);
      else setOptimized(null);
    })();

    // console.log(logs);
    return logs;
  }, [_logs]);

  React.useEffect(() => {
    load();
  }, [requestedLogs]);

  return (
    <div>
      <button onClick={load} disabled={disabled}>
        {disabled ? "Loading..." : "⟳ Logs"}
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
              .filter((log) => log.type === "runtime")
              .map((log) => (
                <option key={log.name} value={log.name}>
                  {format(log.date, "yyyy-MM-dd kk:mm:ss")}
                </option>
              ))}
          </select>

          {loadedLog && <button onClick={reload}>⟳ Log</button>}
        </span>
      )}

      {(loadingLog || loadedLog) && (
        <div className="log">
          <pre>
            {loadedLog && <Ansi>{fixLog(loadedLog)}</Ansi>}
            {loadingLog && "Loading..."}
          </pre>
        </div>
      )}
    </div>
  );
}
