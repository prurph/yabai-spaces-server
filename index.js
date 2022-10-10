import { exec } from "child_process";
import http from "http";
import { promisify } from "util";

import { WebSocketServer } from "ws";

let yabaiState = {
  displays: [],
  spaces: [],
  windows: [],
};
const PORT = 9090;

const execPromise = promisify(exec);

const updateState = async () => {
  const queries = ["displays", "spaces", "windows"].map((q) =>
    execPromise(`/opt/homebrew/bin/yabai -m query --${q} | tr -d '\n\t'`).then(
      ({ stdout }) => {
        try {
          return JSON.parse(stdout);
        } catch {
          return;
        }
      }
    )
  );
  const [displays, spaces, windows] = await Promise.all(queries).catch(
    (error) => {
      console.error(error);
    }
  );
  yabaiState = {
    displays: displays || yabaiState.displays,
    spaces: spaces || yabaiState.spaces,
    windows: windows || yabaiState.windows,
  };
};

const YABAI_EVENTS = [
  "application_launched",
  "application_terminated",
  "application_front_switched",
  "application_activated",
  "application_deactivated",
  "application_visible",
  "application_hidden",
  "window_created",
  "window_destroyed",
  "window_focused",
  "window_moved",
  "window_resized",
  "window_minimized",
  "window_deminimized",
  "window_title_changed",
  "space_changed",
  "display_added",
  "display_removed",
  "display_moved",
  "display_resized",
  "display_changed",
  "mission_control_enter",
  "mission_control_exit",
  "dock_did_restart",
  "menu_bar_hidden_changed",
  "dock_did_change_pref",
];
const UPDATE_SCRIPT = `/usr/bin/curl -s localhost:9090 > /dev/null`;

YABAI_EVENTS.forEach((e) => {
  exec(
    `/opt/homebrew/bin/yabai -m signal --add event=${e} action="${UPDATE_SCRIPT}" label="yabai-spaces-server-${e}"`,
    (error, _stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`Added yabai signal for event ${e}`);
    }
  );
});

const server = http.createServer();

const wss = new WebSocketServer({ server });

const listener = async (req, res) => {
  switch (req.url) {
    case "/": {
      await updateState();
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      // TOOD: performance of parse/stringify vs store raw yabai response
      // in object vs separate string variables.
      emitUpdate(wss.clients);
      res.end(JSON.stringify(yabaiState));
      break;
    }
    default: {
      res.writeHead(404);
      res.end();
    }
  }
};

server.addListener("request", listener);

const emitUpdate = (clients) => {
  const res = JSON.stringify({ content: yabaiState, type: "SPACES_UPDATED" });
  clients.forEach((c) => c.send(res));
};

wss.on("connection", (ws) => {
  emitUpdate([ws]);
  ws.onerror = (err) => console.error(err);
});

server.listen(PORT);
