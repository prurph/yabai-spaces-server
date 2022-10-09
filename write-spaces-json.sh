#!/usr/bin/env bash

PATH="/bin:/opt/homebrew/bin:$PATH"

displays=$(yabai -m query --displays)
spaces=$(yabai -m query --spaces)
windows=$(yabai -m query --windows)

cat <<EOF | tr -d '\t\n' > /tmp/yabai-spaces.json.tmp
{"spaces":$spaces,"windows":$windows,"displays":$displays}
EOF

# Issues with fs.watch if we just append to the file with the HEREDOC.
# Copying to scratch file then moving seems more reliable, but still not perfect.
cp /tmp/yabai-spaces.json.tmp /tmp/yabai-spaces.json
touch /tmp/yabai-spaces.json