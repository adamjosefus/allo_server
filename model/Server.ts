/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */


import { IRouter } from "../types/IRouter.ts";
import { ListenOptions } from "../types/ListenOptions.ts";


type ListenEntryType =
    | [options: ListenOptions]
    | [options: ListenOptions, certFile: string, keyFile: string]


export class Server {

    readonly #router: IRouter;

    constructor(router: IRouter) {
        this.#router = router;
    }


    /**
     * @param {ListenOptions} options 
     * @param {string} certFile *(Optional)*
     * @param {string} keyFile *(Optional)*
     */
    listen(...entry: ListenEntryType) {
        const server = (() => {
            if (entry.length === 3) {
                const [options, certFile, keyFile] = entry;

                return Deno.listenTls({
                    ...options,
                    certFile,
                    keyFile,
                });
            }

            const [options] = entry;
            return Deno.listen(options);
        })();

        (async () => {
            for await (const conn of server) {
                this.#handleConn(conn);
            }
        })();
    }


    async #handleConn(conn: Deno.Conn) {
        const httpConn = Deno.serveHttp(conn);

        for await (const requestEvent of httpConn) {
            const response = await this.#handleRequest(requestEvent.request);
            await requestEvent.respondWith(response);
        }
    }


    async #handleRequest(req: Request): Promise<Response> {
        // const upgrade = req.headers.get("upgrade") ?? "";

        // if (upgrade.toLowerCase() !== "websocket") {
        return await this.#handleHttpRequest(req);
        // } else {
        //     return this.#handleWsRespone(req);
        // }
    }


    async #handleHttpRequest(req: Request): Promise<Response> {
        if (this.#router.match(req)) {
            return await this.#router.serveResponse(req);
        }

        const response = new Response("No route", {
            status: 404,
        });

        return response;
    }


    // #handleWsRespone(req: Request): Response {
    //     const { socket, response } = Deno.upgradeWebSocket(req);

    //     socket.addEventListener('open', () => {
    //         console.log("socket opened");
    //     }, { once: true });

    //     socket.addEventListener('message', (e) => {
    //         console.log("socket message:", e.data);
    //         socket.send(new Date().toString());
    //     });

    //     socket.addEventListener('error', (e) => {
    //         console.log("socket message:", e);
    //         socket.send(new Date().toString());
    //     });

    //     socket.addEventListener('close', (e) => {
    //         console.log("socket message:", e);
    //         socket.send(new Date().toString());
    //     }, { once: true });

    //     return response;
    // }
}
