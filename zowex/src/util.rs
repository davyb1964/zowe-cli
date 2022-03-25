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

// Utility functions.

use std::collections::HashMap;
use std::env;
use std::path::PathBuf;

extern crate home;
use home::home_dir;

extern crate pathsearch;
use pathsearch::PathSearcher;

#[cfg(target_family = "windows")]
    extern crate whoami;
#[cfg(target_family = "windows")]
    use whoami::username;

// Zowe daemon executable modules
use crate::defs::*;


/**
 * Get the file path to the command that runs the NodeJS version of Zowe.
 *
 * @returns File path to the NodeJS zowe script.
 */
pub fn util_get_nodejs_zowe_path() -> String {
    /* On Linux/Mac both our executable and shell script are named 'zowe'.
     * First get the path name to my own zowe rust executable.
     */
    let my_exe_result = env::current_exe();
    if my_exe_result.is_err() {
        println!("Unable to get path to my own executable. Terminating.");
        std::process::exit(EXIT_CODE_CANNOT_GET_MY_PATH);
    }
    let my_exe_path_buf = my_exe_result.unwrap();
    let my_exe_path = my_exe_path_buf.to_string_lossy();

    let zowe_cmd;
    if env::consts::OS == "windows" {
        zowe_cmd = "zowe.cmd";
    } else {
        zowe_cmd = "zowe";
    }

    // find every program in our path that would execute a 'zowe' command
    const NOT_FOUND: &str = "notFound";
    let mut njs_zowe_path: String = NOT_FOUND.to_string();
    let path = env::var_os("PATH");
    let path_ext = env::var_os("PATHEXT");
    for njs_zowe_path_buf in PathSearcher::new(
        zowe_cmd,
        path.as_deref(),
        path_ext.as_deref(),
    ) {
        njs_zowe_path = njs_zowe_path_buf.to_string_lossy().to_string();
        if njs_zowe_path.to_lowercase().eq(&my_exe_path.to_lowercase()) {
            // We do not want our own rust executable. Keep searching.
            njs_zowe_path = NOT_FOUND.to_string();
            continue;
        }

        // use the first 'zowe' command on our path that is not our own executable
        break;
    }
    if njs_zowe_path == NOT_FOUND {
        println!("Could not find a NodeJS zowe command on your path.");
        println!("Will not be able to run Zowe commands. Terminating.");
        std::process::exit(EXIT_CODE_NO_NODEJS_ZOWE_ON_PATH);
    }

    njs_zowe_path
}

/**
 * Get the path to the .zowe_daemon directory within the user's HOME directory.
 * Ensures that the directory exists, or we create it.
 *
 * @returns The path to the .zowe_daemon directory.
 */
pub fn util_get_daemon_dir() -> Result<PathBuf, i32> {
    let mut daemon_dir: PathBuf;
    match home_dir() {
        Some(path_buf_val) => daemon_dir = path_buf_val,
        None => {
            println!("Unable to get user's home directory.");
            return Err(EXIT_CODE_ENV_ERROR);
        }
    }
    daemon_dir.push(".zowe");
    daemon_dir.push("daemon");

    if !daemon_dir.exists() {
        if let Err(err_val) = std::fs::create_dir(&daemon_dir) {
            println!("Unable to create zowe daemon directory = {}.", &daemon_dir.display());
            println!("Reason = {}.", err_val);
            return Err(EXIT_CODE_FILE_IO_ERROR);
        }
    }

    Ok(daemon_dir)
}

#[cfg(target_family = "unix")]
pub fn util_get_socket_string() -> Result<String, i32> {
    let mut socket_path: PathBuf;
    if let Ok(env_socket_string) = env::var("ZOWE_DAEMON") {
        // use a socket directory specified by user env variable
        socket_path = PathBuf::new();
        socket_path.push(env_socket_string);
    } else {
        // use default socket directory
        match util_get_daemon_dir() {
            Ok(ok_val) => socket_path = ok_val,
            Err(err_val) => return Err(err_val)
        }
        socket_path.push("daemon.sock");
    }
    Ok(socket_path.into_os_string().into_string().unwrap())
}

#[cfg(target_family = "windows")]
pub fn util_get_socket_string() -> Result<String, i32> {
    let mut _socket = format!("\\\\.\\pipe\\{}\\{}", username(), "ZoweDaemon");

    if let Ok(pipe_name) = env::var("ZOWE_DAEMON") {
        _socket = format!("\\\\.\\pipe\\{}", pipe_name);
    }
    Ok(_socket)
}

pub fn util_get_zowe_env() -> HashMap<String, String> {
    env::vars().filter(|&(ref k, _)|
        k.starts_with("ZOWE_")
    ).collect()
}
