#!/usr/bin/env bash
set -euo pipefail

COMMON_FILE='common.gv'

run_dot () {
    FILENAME="${1}"
    TO_RENDER="${2}"

    # gvpr part removes nodes without any edges that are introduced
    # because of common.gv
    echo "${TO_RENDER}" | gvpr -c "N[$.degree==0]{delete(root, $)}" | dot -Tpng -o "${FILENAME}"
}

render () {
    FILENAME="${1}"
    run_dot "${FILENAME//\.gv/.png}" "$(echo 'digraph d {'; cat "${COMMON_FILE}"; cat "${FILENAME}" | sed 's/\[.*\]//'; echo '}')"
}

render_all () {
    run_dot 'flow_full.png' "$(echo 'digraph d {'; cat *.gv; echo '}')"
}

rm -f -- *.png
for graphviz_file in *.gv; do
    if [ "${graphviz_file}" != "${COMMON_FILE}" ] ; then
        render "${graphviz_file}"
    fi
done

render_all
