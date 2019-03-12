#!/usr/bin/env bash
set -euo pipefail

rsync -zarRv\
      index.html\
      {aliasing,nat_traversal}/{*.html,*.png,*.svg}\
      nat_traversal/graphs/*.png\
      assets jvo:/var/www/html/notes/
