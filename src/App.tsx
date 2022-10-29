import React from "react";
import "./App.css";
import ModelView from "./ModelView";
import type { Model } from "./ModelView";

const lsbananaStateString = localStorage.bananaStateString || "";
const BANANA_API_URL_BASE = "https://app.banana.dev/api";

export interface BananaState {
  bananaUser: BananaUser;
  transformApiUrl: string;
  user: User;
}

export interface BananaUser {
  githubID: string;
  githubProfilePic: string;
  name: string;
  teamIDs: string[];
  userID: string;
}

export interface UserStsTokenManager {
  accessToken: string;
  expirationTime: number;
  refreshToken: string;
}

export interface User {
  stsTokenManager: UserStsTokenManager;
}

function Models({
  teamID,
  transformApiUrl,
  auto,
  stsTokenManager,
}: {
  teamID: string;
  transformApiUrl: string;
  auto: boolean;
  stsTokenManager: UserStsTokenManager;
}) {
  const [models, setModels] = React.useState<Model[]>([]);

  let controller: AbortController;
  const load = React.useCallback(async () => {
    // if (!(transformApiUrl && teamID)) return;
    if (!teamID) return;
    controller = new AbortController();
    // const response = await fetch(transformApiUrl + "/models/" + teamID, {
    const response = await fetch(
      `${BANANA_API_URL_BASE}/team/${teamID}/models`,
      {
        headers: {
          Authorization: "Bearer " + stsTokenManager.accessToken,
        },
        signal: controller.signal,
      }
    );
    const result = await response.json();
    console.log(result);
    setModels(result);
  }, [transformApiUrl, teamID]);

  let timeout: ReturnType<typeof setTimeout>;
  async function loadTimeout() {
    try {
      await load();
    } catch (e) {
      if (e instanceof DOMException) return; // DOMException: The user aborted a request.
      console.log(e);
      return;
    }
    timeout = setTimeout(loadTimeout, 1000);
  }

  React.useEffect(() => {
    if (auto) loadTimeout();
    return () => {
      // console.log("return");
      clearTimeout(timeout);
      if (controller) controller.abort();
    };
  }, [auto, load]);

  // if (!(transformApiUrl && teamID)) return null;
  if (!teamID) return null;

  if (!models.length) return <span>Loading...</span>;

  return (
    <table id="modelsTable">
      <thead>
        <tr>
          <th style={{ width: "300px" }}>Model</th>
          <th style={{ width: "120px" }}>Status</th>
          <th style={{ width: "120px" }}>Optimized</th>
          <th style={{ width: "80px" }}>Wait</th>
          <th style={{ width: "80px" }}>Busy</th>
          <th style={{ width: "80px" }}>Done</th>
          <th style={{ width: "50px" }}></th>
        </tr>
      </thead>
      <tbody>
        {models.map((model) => (
          <ModelView
            key={model.modelID}
            model={model}
            // modelID={model.modelID}
            // modelKey={model.modelKey}
          />
        ))}
      </tbody>
    </table>
  );
}

function App() {
  const [bananaStateString, setbananaStateString] =
    React.useState(lsbananaStateString);
  const [bananaStateStringError, setbananaStateStringError] =
    React.useState("");
  const [auto, setAuto] = React.useState(true);
  const [hasCopied, setHasCopied] = React.useState(false);

  const bananaState = React.useMemo<BananaState>(() => {
    if (
      (bananaStateString.startsWith("'") && bananaStateString.endsWith("'")) ||
      (bananaStateString.startsWith('"') && bananaStateString.endsWith('"'))
    ) {
      setbananaStateString(
        bananaStateString.substring(1, bananaStateString.length - 1)
      );
      return {};
    }

    let bananaState;
    try {
      bananaState = JSON.parse(bananaStateString);
    } catch (error) {
      if (error instanceof Error) setbananaStateStringError(error.message);
      return {};
    }

    if (lsbananaStateString !== bananaStateString)
      localStorage.bananaStateString = bananaStateString;
    if (bananaStateStringError) setbananaStateStringError("");

    // if (!Array.isArray(models)) return [];

    return bananaState;
  }, [bananaStateString]);

  const COPY_STR =
    "let bs = JSON.parse(localStorage.bananaState); JSON.stringify({ bananaUser: bs.bananaUser, transformApiUrl: bs.transformApiUrl, user: { stsTokenManager: bs.user.stsTokenManager }});";

  async function copy() {
    await navigator.clipboard.writeText(COPY_STR);
    setHasCopied(true);
  }

  return (
    <div className="App">
      <div>
        <h1>Banana Logs (Unofficial)</h1>
        <div
          style={{
            padding: "5px 10px 5px 10px",
            background: "#a00",
            borderRadius: "3px",
          }}
        >
          [2022-10-22] Notice: big changes expected to the Banana Dashboard over
          the coming week, which will break the Unofficial Logs. Once they land,
          we'll assess whether to adapt the unofficial logs or simply retire
          them. Happy logging!
        </div>
        <p>
          Log in to <a href="https://app.banana.dev/">app.banana.dev</a>, open
          developer console, and copy and paste the result of:
        </p>
        <p>
          <code style={{ marginLeft: "15px" }}>{COPY_STR}</code>{" "}
          <button onClick={copy}>📋</button>
          {hasCopied && "✓"}
        </p>
        <p>to here:</p>
        <div>
          <textarea
            style={{ marginLeft: "15px", width: "500px" }}
            value={bananaStateString}
            onChange={(event) => setbananaStateString(event.target.value)}
          />
        </div>
        {bananaStateString && bananaStateStringError && (
          <div style={{ color: "red" }}>{bananaStateStringError}</div>
        )}
        <br />
        <div>
          Note: This is an SPA with no backend. Above data is saved to
          localStorage only. You're encouraged to open the developer console and
          see for yourself that no data is sent over the network except to
          zeet.app (where Banana store their logs), and review the code on{" "}
          <a href="https://github.com/gadicc/banana-logs">GitHub</a>.
        </div>
        <p>Note: Load logs to check Optimization status.</p>
        <p>
          <label>
            <input
              type="checkbox"
              checked={auto}
              onChange={() => setAuto(!auto)}
            />
            Auto Refresh (disable to explore logs more quickly)
          </label>
        </p>
        <br />
        <Models
          teamID={bananaState?.bananaUser?.teamIDs?.[0]}
          transformApiUrl={bananaState?.transformApiUrl}
          stsTokenManager={bananaState?.user?.stsTokenManager}
          auto={auto}
        />
      </div>
    </div>
  );
}

export default App;
