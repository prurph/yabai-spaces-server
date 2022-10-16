import { exec } from "child_process";
import http from "http";
import url from "url";
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

const YABAI_EVENTS = {
  application_launched: { env: ["YABAI_PROCESS_ID"] },
  application_terminated: { env: ["YABAI_PROCESS_ID"] },
  application_front_switched: {
    env: ["YABAI_PROCESS_ID", "YABAI_RECENT_PROCESS_ID"],
  },
  application_activated: { env: ["YABAI_PROCESS_ID"] },
  application_deactivated: { env: ["YABAI_PROCESS_ID"] },
  application_visible: { env: ["YABAI_PROCESS_ID"] },
  application_hidden: { env: ["YABAI_PROCESS_ID"] },
  window_created: {
    env: ["YABAI_WINDOW_ID"],
    handler: ({ YABAI_WINDOW_ID }) => {
      console.log(YABAI_WINDOW_ID);
    },
  },
  window_destroyed: { env: ["YABAI_WINDOW_ID"] },
  window_focused: { env: ["YABAI_WINDOW_ID"] },
  window_moved: { env: ["YABAI_WINDOW_ID"] },
  window_resized: { env: ["YABAI_WINDOW_ID"] },
  window_minimized: { env: ["YABAI_WINDOW_ID"] },
  window_deminimized: { env: ["YABAI_WINDOW_ID"] },
  window_title_changed: { env: ["YABAI_WINDOW_ID"] },
  space_changed: { env: ["YABAI_SPACE_ID", "YABAI_RECENT_SPACE_ID"] },
  display_added: { env: ["YABAI_DISPLAY_ID"] },
  display_removed: { env: ["YABAI_DISPLAY_ID"] },
  display_moved: { env: ["YABAI_DISPLAY_ID"] },
  display_resized: { env: ["YABAI_DISPLAY_ID"] },
  display_changed: { env: ["YABAI_DISPLAY_ID", "YABAI_RECENT_DISPLAY_ID"] },
  mission_control_enter: {},
  mission_control_exit: {},
  dock_did_restart: {},
  menu_bar_hidden_changed: {},
  dock_did_change_pref: {},
};

Object.entries(YABAI_EVENTS).forEach(([event, env]) => {
  // Unescaped double quotes so shell expands env variables like $YABAI_WINDOW_ID into
  // their actual value, which we then receive as a url param.
  const params = env.env?.map((p) => `${p}="$${p}"`).join("&");
  // Quotes url to use params with curl. Escape them so shell passes them literally.
  const action = `/usr/bin/curl -s \"localhost:9090/?signal=${event}${
    params ? "&" + params : ""
  }\"`;
  exec(
    `/opt/homebrew/bin/yabai -m signal --add event=${event} action='${action}' label='yabai-spaces-server-${event}'`,
    (error, _stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`Added yabai signal for event ${event}`);
    }
  );
});

const server = http.createServer();

const wss = new WebSocketServer({ server });

const listener = async (req, res) => {
  const parsed = url.parse(req.url, true);
  switch (parsed.pathname) {
    case "/": {
      const event = YABAI_EVENTS[parsed.query?.signal];
      if (event?.handler) {
        event.handler(parsed.query);
      }
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

updateState().then(() =>
  exec(
    `/usr/bin/osascript -e 'tell application id "tracesOf.Uebersicht" to refresh'`,
    (error, _stdout, stderr) => {
      if (error) {
        console.log(`error refreshing Uebersicht: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr refreshing Uebersicht: ${stderr}`);
        return;
      }
    }
  )
);
