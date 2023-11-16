# Yabai Spaces Server

This is a websockets server and a bash script that together emit data when certain [yabai](https://github.com/koekeishiya/yabai) window manager events fire. It is useful for updating status bars and other widgets that can listen for these events and receive the entire state of displays, spaces and windows.

It establishes yabai signals that curl an http endpoint, triggering a refresh of state that is then emitted to any connected websocket clients. Currently there's no "smart" slicing of states—for example only querying for windows when the signal is window-based—or debouncing.

## Requirements

- [Bun](https://bun.sh)
- [yabai](https://github.com/koekeishiya/yabai)

To install ependencies:

```bash
bun install
```

To run:

```bash
bun run start
```

This will initialize a server at `localhost:3000`.

- Websocket clients can connect at `/ws`
- The JSON state of displays, spaces, and windows is available over http at `/state`

## 🍞 Bun

This project was created using `bun init` in bun v1.0.11. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
