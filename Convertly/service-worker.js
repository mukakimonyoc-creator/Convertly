/* =========================================================
   CONVERTLY V2
   SERVICE WORKER
========================================================= */

const CACHE_NAME =
    "convertly-v2";


const APP_SHELL = [

    "./",

    "./index.html",

    "./style.css",

    "./script.js",

    "./manifest.json"

];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            )
            .then(
                cache =>
                    cache.addAll(
                        APP_SHELL
                    )
            )
            .then(
                () =>
                    self.skipWaiting()
            )

        );

    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(
                    cacheNames => {

                        return Promise.all(

                            cacheNames
                                .filter(
                                    cacheName =>
                                        cacheName !==
                                        CACHE_NAME
                                )
                                .map(
                                    cacheName =>
                                        caches.delete(
                                            cacheName
                                        )
                                )

                        );

                    }
                )
                .then(
                    () =>
                        self.clients.claim()
                )

        );

    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;


        /*
         * Only handle GET requests.
         */

        if (
            request.method !== "GET"
        ) {

            return;

        }


        const url =
            new URL(
                request.url
            );


        /*
         * API requests:
         *
         * Network first.
         *
         * If offline, use cached API
         * response if available.
         */

        if (
            url.hostname ===
            "api.frankfurter.dev"
        ) {

            event.respondWith(

                fetch(request)
                    .then(
                        response => {

                            if (
                                response.ok
                            ) {

                                const copy =
                                    response.clone();


                                caches.open(
                                    CACHE_NAME
                                )
                                .then(
                                    cache =>
                                        cache.put(
                                            request,
                                            copy
                                        )
                                );

                            }


                            return response;

                        }
                    )
                    .catch(
                        () =>
                            caches.match(
                                request
                            )
                    )

            );

            return;

        }


        /*
         * Application files:
         *
         * Cache first.
         */

        event.respondWith(

            caches.match(request)
                .then(
                    cachedResponse => {

                        if (
                            cachedResponse
                        ) {

                            return cachedResponse;

                        }


                        return fetch(request)
                            .then(
                                response => {

                                    if (
                                        response.ok &&
                                        url.origin ===
                                        self.location.origin
                                    ) {

                                        const copy =
                                            response.clone();


                                        caches.open(
                                            CACHE_NAME
                                        )
                                        .then(
                                            cache =>
                                                cache.put(
                                                    request,
                                                    copy
                                                )
                                        );

                                    }


                                    return response;

                                }
                            );

                    }
                )

        );

    }
);