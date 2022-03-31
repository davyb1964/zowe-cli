/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

jest.mock("net");
jest.mock("@zowe/imperative");
import * as fs from "fs";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import Mock = jest.Mock;
import { Imperative } from "@zowe/imperative";
import { DaemonDecider } from "../../../src/daemon/DaemonDecider";
jest.mock("../../../src/daemon/DaemonClient");

describe("DaemonDecider tests", () => {
    afterEach(() => {
        delete process.env.ZOWE_DAEMON_DIR;
        delete process.env.ZOWE_DAEMON_PIPE;
    });

    it("should call normal parse method if no daemon keyword", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const on = jest.fn((event, func) => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toBe(undefined);
            expect(context).toBe(undefined);
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log
                }
            },
            parse
        };
        const fn = net.createServer as Mock<typeof net.createServer>;
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            return {on};
        });

        const daemonDecider = new DaemonDecider(["--help"]);
        daemonDecider.init();
        expect(on).not.toHaveBeenCalled();
        daemonDecider.runOrUseDaemon();
        expect(parse).toHaveBeenCalled();
    });

    it("should start the server when daemon parm is passed", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const on = jest.fn((event, func) => {
            // do nothing
        });

        const listen = jest.fn((socket, method) => {
            // do nothing
            method();
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log,
                    error: log
                }
            },
            console: {
                info: log
            },
            parse
        };
        const fn = net.createServer as Mock<typeof net.createServer>;
        fn.mockImplementation((method, ...args: any[]) => {
            method("fakeClient", "fakeServer");
            return {on, listen};
        });

        const daemonDecider = new DaemonDecider(["some/file/path", "zowe", "--daemon"]);
        daemonDecider.init();
        expect(on).toHaveBeenCalledTimes(2);
        daemonDecider.runOrUseDaemon();
        expect(parse).not.toHaveBeenCalled();
        (daemonDecider as any).close();
        expect(log).toHaveBeenLastCalledWith("server closed");
        let err;
        try {
            (daemonDecider as any).error(new Error("data"));
        } catch (thrownError) {
            err = thrownError;
        }
        expect(err.message).toBe("data");
    });

    it("should set comm channel based on env variable", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    debug: log
                }
            }
        };

        const daemonDecider = new DaemonDecider(["anything"]);

        const envWinPipeName = "MyWinPipeName";
        const envDaemonDir = path.normalize("./testOutput/daemonDir");
        let expectedCommChannel: string = "NotAssignedYet";

        if (process.platform === "win32") {
            process.env.ZOWE_DAEMON_PIPE = envWinPipeName;
            expectedCommChannel = "\\\\.\\pipe\\" + envWinPipeName;
        } else {
            process.env.ZOWE_DAEMON_DIR = envDaemonDir;
            expectedCommChannel = envDaemonDir + "/daemon.sock";
        }

        (daemonDecider as any).mParms = ["one", "two", "--daemon"];
        (daemonDecider as any).initialParse();
        expect((daemonDecider as any).mSocket).toBe(expectedCommChannel);
    });

    it("should not start a daemon", () => {
        const log = jest.fn(() => {
            // do nothing
        });

        const on = jest.fn((event, func) => {
            // do nothing
        });

        const listen = jest.fn((event, func) => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toBe(undefined);
            expect(context).toBe(undefined);
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log,
                    error: log
                }
            },
            console: {
                info: log
            },
            parse
        };

        const fn = net.createServer as Mock<typeof net.createServer>;
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            return {on, listen};
        });

        const daemonDecider = new DaemonDecider(["node", "zowe", "--help"]);
        daemonDecider.init();

        expect((daemonDecider as any).mSocket).toBeUndefined();
        expect((daemonDecider as any).startServer).toBeUndefined();
    });

    it("should use the default comm channel location", () => {
        const log = jest.fn(() => {
            // do nothing
        });

        const on = jest.fn((event, func) => {
            // do nothing
        });

        const listen = jest.fn((event, func) => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toBe(undefined);
            expect(context).toBe(undefined);
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log,
                    error: log
                }
            },
            console: {
                info: log
            },
            parse
        };

        const fn = net.createServer as Mock<typeof net.createServer>;
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            return {on, listen};
        });

        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);
        daemonDecider.init();

        let expectedCommChannel: string = "NotAssignedYet";
        if (process.platform === "win32") {
            expectedCommChannel = `\\\\.\\pipe\\${os.userInfo().username}\\ZoweDaemon`;
        } else {
            expectedCommChannel = path.join(os.homedir(), ".zowe/daemon/daemon.sock");
        }

        expect((daemonDecider as any).mSocket).toEqual(expectedCommChannel);
    });

    it("should try to delete an existing socket on Posix", () => {
        const log = jest.fn(() => {
            // do nothing
        });

        const on = jest.fn((event, func) => {
            // do nothing
        });

        const listen = jest.fn((event, func) => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toBe(undefined);
            expect(context).toBe(undefined);
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log,
                    error: log
                }
            },
            console: {
                info: log
            },
            parse
        };

        const fn = net.createServer as Mock<typeof net.createServer>;
        fn.mockImplementation((unusedclient, ...args: any[]) => {
            return {on, listen};
        });

        process.env.ZOWE_DAEMON_DIR = path.normalize("./testOutput/daemonDir");
        const daemonDecider = new DaemonDecider(["node", "zowe", "--daemon"]);

        const existsSyncSpy = jest.spyOn(fs, "existsSync");
        existsSyncSpy.mockReturnValueOnce(true);

        const unlinkSyncSpy = jest.spyOn(fs, "unlinkSync");
        unlinkSyncSpy.mockReturnValueOnce(true);

        const writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
        unlinkSyncSpy.mockReturnValueOnce(true);

        daemonDecider.init();
        daemonDecider.runOrUseDaemon();

        let timesCalled = 1;
        if (process.platform === "win32") {
            timesCalled = 0;
        }

        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
        expect(existsSyncSpy).toHaveBeenCalledTimes(timesCalled);
        expect(unlinkSyncSpy).toHaveBeenCalledTimes(timesCalled);
    });
});
