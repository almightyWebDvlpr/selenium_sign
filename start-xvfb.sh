#!/usr/bin/env bash
set -e

exec xvfb-run -a --server-args="-screen 0 1600x900x24" node index.js
