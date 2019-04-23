#!/usr/bin/env bash
set -euo pipefail

rsync -zarRv\
      index.html\
      */index.html\
      revisioned\
      sw.js\
      jvo:/var/www/html/notes/
