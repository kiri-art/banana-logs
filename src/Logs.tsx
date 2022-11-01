import React from "react";
import { format } from "date-fns";
import Ansi from "ansi-to-react";

// import getLog from "./getLog";
import bananaFetch from "./bananaFetch";

/*
interface LogsResult {
  logIDs: string[];
}
*/

interface BananaLog {
  logID: string;
  log: string;
}

interface Log {
  type: string;
  date: Date;
  // name: string;
  logID: string;
  log: string;
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
  const [_logs, _setLogs] = React.useState<BananaLog[] | null>(null);
  const [disabled, setDisabled] = React.useState(false);
  const [loadingLog, setLoadingLog] = React.useState(false);
  const [loadedLog, setLoadedLog] = React.useState("");
  const [loadedLogType, setLoadedLogType] = React.useState("");
  const selectedLog = {
    build: React.useState(""),
    runtime: React.useState(""),
  };
  const [logID, setLogID] = React.useState("");

  async function load() {
    setDisabled(true);
    const response = await bananaFetch("/model/" + modelID + "/logs");
    const result: BananaLog[] = await response.json();
    console.log({ logs: result });
    _setLogs(result);
    setDisabled(false);
  }

  async function loadLog(modelID: string, logID: string) {
    setLogID(logID);
    setLoadingLog(true);
    setLoadedLogType("");
    // const log = await getLog(modelID, logID);
    const log = _logs?.find((log) => log.logID === logID)?.log;
    if (!log) throw new Error("Couldn't find log");
    setLoadingLog(false);
    setLoadedLog(log);
    setLoadedLogType(logID.match(/build/) ? "build" : "runtime");
  }

  function logSelect(type: "build" | "runtime") {
    return async function logSelect(
      event: React.ChangeEvent<HTMLSelectElement>
    ) {
      const logID = event.target.value;
      await loadLog(modelID, logID);
      selectedLog[type][1](logID);
      selectedLog[type === "build" ? "runtime" : "build"][1]("");
    };
  }

  async function reload() {
    setLoadedLog("");
    await loadLog(modelID, logID);
  }

  const logs = React.useMemo(() => {
    if (!_logs) return [];
    const logs = _logs
      .map(({ logID, log }) => {
        const match = logID.match(/_([\d]+)\.log$/);
        const timestamp = match && match[1] && parseInt(match[1]);
        const date = timestamp ? new Date(timestamp * 1000) : new Date(NaN);

        const typeMatch = logID.match(/^(.+?)_/);
        const type = typeMatch ? typeMatch[1] : "unknown";

        return {
          type,
          date,
          logID,
          log,
        };
      })
      .sort((a: Log, b: Log) => b.date.getTime() - a.date.getTime());

    //console.log(logs);

    // Check most recent build log for optimized status
    const mostRecentBuildLog = logs.filter((log) => log.type === "build")[0];
    (async function checkRecentBuild() {
      if (!mostRecentBuildLog) return;
      // console.log({ mostRecentBuildLog });
      // console.log(log);

      // const log = await getLog(modelID, mostRecentBuildLog.logID);
      const log = mostRecentBuildLog.log;

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
          <select value={selectedLog.build[0]} onChange={logSelect("build")}>
            <option value="">Choose Build Log</option>
            {logs
              .filter((log) => log.type === "build")
              .map((log) => (
                <option key={log.logID} value={log.logID}>
                  {format(log.date, "yyyy-MM-dd kk:mm:ss")}
                </option>
              ))}
          </select>

          <select
            value={selectedLog.runtime[0]}
            onChange={logSelect("runtime")}
          >
            <option value="">Choose Runtime Log</option>
            {logs
              .filter((log) => log.type === "runtime")
              .map((log) => (
                <option key={log.logID} value={log.logID}>
                  {format(log.date, "yyyy-MM-dd kk:mm:ss")}
                </option>
              ))}
          </select>

          {/* loadedLog && <button onClick={reload}>⟳ Log</button> */}
        </span>
      )}

      {(loadingLog || loadedLog) && (
        <div className="log">
          <pre>
            {loadedLog && (
              <Ansi>
                {loadedLogType === "build" ? fixLog(loadedLog) : loadedLog}
              </Ansi>
            )}
            {loadingLog && "Loading..."}
          </pre>
        </div>
      )}
    </div>
  );
}
