import fs from "fs-extra";
import { exec, execFile } from "child_process";
import { WebSocketServer } from "ws";

const SPACES_JSON = "/tmp/yabai-spaces.json";
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
  "dock_did_change_pref"
]
const UPDATE_SCRIPT = `${process.cwd()}/write-spaces-json.sh`

execFile(UPDATE_SCRIPT, (error, _stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`Initial update succeeded.`);
})

YABAI_EVENTS.forEach(e => {
  exec(`/opt/homebrew/bin/yabai -m signal --add event=${e} action="${UPDATE_SCRIPT}" label="yabai-spaces-server-${e}"`, (error, _stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`Added yabai signal for event ${e}`);
  })
});

const wss = new WebSocketServer({ port: 9090 });

const readSpaces = () => {
  const spaces = fs.readFileSync(SPACES_JSON, "utf-8");
  try {
    return { content: JSON.parse(spaces), type: "SPACES_UPDATED" }
  } catch (err) {
    console.error(`Invalid json: partially written SPACES_JSON file? ${err}`);
  }
}

wss.on("connection", ws => {
  const spaces = readSpaces();
  if (spaces) {
    ws.send(JSON.stringify(spaces));
  }
  ws.on("close", () => console.log("client disconnected"));
  ws.onerror = (err) => console.error(err);
});

fs.watch(SPACES_JSON, () => {
  const spaces = readSpaces();
  if (spaces) {
    wss.clients.forEach(client => client.send(JSON.stringify(spaces)));
  }
});