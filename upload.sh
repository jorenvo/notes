#!/usr/bin/env bash
set -euo pipefail

rsync -zarRv\
      index.html\
      {aliasing,nat_traversal}/index.html\
      revisioned\
      jvo:/var/www/html/notes/
