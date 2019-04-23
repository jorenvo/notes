(() => {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", async function() {
            try {
                var registration = await navigator.serviceWorker.register(
                    "/notes/sw.js"
                );
            } catch (err) {
                console.log("ServiceWorker registration failed: ", err);
                return;
            }

            console.log(
                "ServiceWorker registration successful with scope: ",
                registration.scope
            );
        });
    }
})();
