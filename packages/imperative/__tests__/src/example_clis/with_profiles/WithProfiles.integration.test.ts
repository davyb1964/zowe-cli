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

// These tests require access to the same values on the keyring, therefore they cannot run in parallel
// The test order is important - some tests depend on other tests not running first - do not change it
/* eslint-disable max-len */

describe("Imperative With Profiles Tests", () => {
    require("./__integration__/AutoGeneratedProfileCommands.integration.subtest");
    require("./__integration__/ExampleDefinitions.integration.subtest");
    require("./__integration__/ExampleLogging.integration.subtest");
    require("./__integration__/ExampleProfiles.integration.subtest");
    require("../../packages/cmd/__integration__/HelpCommands.integration.subtest");
});