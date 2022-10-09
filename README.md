# Yabai Spaces Server

🚨 Disclaimer: you probably don't want to use this. 🚨

This is a websockets server and a bash script that together emit data when certain [yabai](https://github.com/koekeishiya/yabai) window manager events fire. It is useful for updating status bars and other widgets that can listen for these events and receive the entire state of displays, spaces and windows.

It establishes yabai signals that curl an http endpoint, triggering a refresh of state that is then emitted to any connected websocket clients. Currently there's no "smart" slicing of states—for example only querying for windows when the signal is window-based—or debouncing.

## Requirements

- Node
- [yabai](https://github.com/koekeishiya/yabai)

## Running

```shell
$ npm run start
```

This will initialize a websocket server on 9090.

## Caveats

Yabai doesn't fire an event for the creation or destruction of spaces. As a workaround if you are using hotkeys to execute these commands, you can also bind a manual call to curl the server, triggering a refresh. There is [an open issue](https://github.com/koekeishiya/yabai/issues/1365) suggesting adding signals for space modifications.
