# Yabai Spaces Server

🚨 Disclaimer: you probably don't want to use this. 🚨

This is a websockets server and a bash script that together emit data when certain [yabai](https://github.com/koekeishiya/yabai) window manager events fire. It is useful for updating status bars and other widgets that can listen for these events and receive the entire state of displays, spaces and windows.

It's based on querying yabai for the new state when any event fires and writing it to a file, then watching that file for changes. Probably a better approach would be to have the yabai signals curl an http endpoint to inform the server to refresh directly by querying yabai; this would allow debouncing.

## Requirements

- Node
- [yabai](https://github.com/koekeishiya/yabai)

## Running

```shell
$ npm run start
```

This will initialize and update a JSON file at `/tmp/yabai-spaces.json.tmp`, and run a websocket server on 9090 where it will emit the contents of that file when changes occur.

## Caveats

Yabai doesn't fire an event for the creation or destruction of spaces. As a workaround if you are using hotkeys to execute these commands, you can also bind a manual call to the [write-spaces-json.sh](write-spaces-json.sh) script. A future improvement would be for the server to also expose http endpoints to force a refresh. There is [an open issue](https://github.com/koekeishiya/yabai/issues/1365) suggesting adding signals for space modifications.
