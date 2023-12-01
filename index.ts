import { YabaiState, YABAI_EVENTS } from './yabai';

let state: YabaiState = {
  displays: [],
  spaces: [],
  windows: [],
};

const yabai = Bun.which('yabai') || '';
const curl = Bun.which('curl') || '';

const updateState = async () => {
  const queries = ['displays', 'spaces', 'windows'].map(q =>
    Bun.spawn([yabai, '-m', 'query', `--${q}`], {
      onExit(_proc, _exitCode, _signalCode, error) {
        if (error) console.error(error);
      },
    }),
  );
  const [displays, spaces, windows] = await Promise.all(
    queries.map(async proc => await new Response(proc.stdout).json()),
  );
  state = {
    displays,
    spaces,
    windows,
  };
};

const registerSignals = async () => {
  Object.entries(YABAI_EVENTS).forEach(([event, args]) => {
    // Construct a curl URL for each event that will pass in the parameters and
    // their values. Escape the $ here to end up with a literal $VAR, and wrap
    // in unescaped double-quotes, so when the shell calls that curl, the $VAR
    // is substituted. It's much more annoying to do this as a JSON post body
    // because of all the layers of escaping.
    let params = args.map(a => `${a}="$${a}"`).join('&');

    // If params, prefix with & to add them as query parameters.
    params = params === '' ? params : `&${params}`;

    // Escape the double quotes so they are passed literally to the shell when
    // registering the signal.
    const action = `${curl} -s \"localhost:3000/signal?event=${event}${params}\"`;

    const signal = Bun.spawnSync({
      cmd: [
        yabai,
        '-m',
        'signal',
        '--add',
        `event=${event}`,
        `action=${action}`,
        `label='yabai-spaces-server-${event}'`,
      ],
    });
    if (signal.stderr.toString()) {
      console.error(
        `Failed to register signal for ${event}`,
        signal.stderr.toString(),
      );
    } else {
      console.log(`Registered signal for ${event}`);
    }
  });
};

await registerSignals();
await updateState();

// Serve on default port 3000
Bun.serve({
  async fetch(req, server) {
    const url = new URL(req.url);
    // http endpoints
    switch (url.pathname) {
      // Incoming new websocket connection
      case '/ws': {
        if (server.upgrade(req)) {
          return;
        }
        return new Response('WebSocket upgrade failed', { status: 500 });
      }
      // Get state
      case '/state': {
        await updateState();
        return Response.json(state);
      }
      // Incoming signals from yabai
      case '/signal': {
        await updateState();
        return new Response(null, { status: 200 });
      }
    }
  },
  websocket: {
    open(ws) {
      ws.subscribe('yabai-events');
      ws.send(JSON.stringify(state));
    },
    close(ws) {
      ws.unsubscribe('yabai-events');
    },
    message(ws, msg) {
      if (msg === 'state') {
        ws.send(JSON.stringify(state));
      }
    },
  },
});
