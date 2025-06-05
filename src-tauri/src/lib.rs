use std::fs;
use std::path::Path;
use std::sync::Arc; // For Arc<Mutex<AppState>> if needed by event emission
use tauri::{command, AppHandle, Manager, State, Window}; // Ensure Window and AppHandle are imported
use tokio::sync::Mutex; // For async operations if items are processed in an async runtime
use walkdir::WalkDir; // For walking directories, add `walkdir = "2"` to Cargo.toml dependencies
use serde::Serialize; // For serializing event payloads

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Clone, serde::Serialize)]
struct ScanEventPayload {
  path: String,
  name: String,
  size: u64,
  is_dir: bool,
  error: Option<String>, // To report errors for specific files/dirs
}

#[derive(Clone, serde::Serialize)]
struct ScanCompletePayload {
  path: String, // The root path that was scanned
  success: bool,
  error: Option<String>, // If the whole scan failed for some reason
}

#[command]
async fn select_folder(app_handle: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app_handle.dialog().file().pick_folder(move |path_buf| {
        let _ = tx.send(path_buf);
    });

    match rx.await {
        Ok(Some(path_buf)) => Ok(Some(path_buf.to_string_lossy().to_string())),
        Ok(None) => Ok(None), // User cancelled
        Err(_) => Err("Failed to receive folder selection".to_string()),
    }
}

#[command]
async fn scan_folder(window: Window, path: String) {
    let root_path = path.clone();
    tokio::spawn(async move {
        for entry in WalkDir::new(&path).min_depth(1).into_iter() {
            match entry {
                Ok(entry) => {
                    let path = entry.path();
                    let metadata = match fs::metadata(path) {
                        Ok(m) => m,
                        Err(e) => {
                            let _ = window.emit("scan_event", ScanEventPayload {
                                path: path.to_string_lossy().to_string(),
                                name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                                size: 0,
                                is_dir: path.is_dir(), // Attempt to check, might fail
                                error: Some(format!("Failed to get metadata: {}", e)),
                            });
                            continue;
                        }
                    };

                    let _ = window.emit("scan_event", ScanEventPayload {
                        path: path.to_string_lossy().to_string(),
                        name: entry.file_name().to_string_lossy().to_string(),
                        size: metadata.len(),
                        is_dir: metadata.is_dir(),
                        error: None,
                    });
                }
                Err(e) => {
                    // Try to get path from error if possible, otherwise use the root path
                    let error_path = e.path().unwrap_or_else(|| Path::new(&path)).to_string_lossy().to_string();
                    let _ = window.emit("scan_event", ScanEventPayload {
                        path: error_path.clone(),
                        name: Path::new(&error_path).file_name().unwrap_or_default().to_string_lossy().to_string(),
                        size: 0,
                        is_dir: false, // Unknown
                        error: Some(format!("Error accessing entry: {}", e)),
                    });
                }
            }
            // Small delay to allow UI to update, prevent overwhelming the event system
            tokio::time::sleep(tokio::time::Duration::from_millis(1)).await;
        }

        let _ = window.emit("scan_complete", ScanCompletePayload {
            path: root_path,
            success: true, // Assuming success if loop completes, could add more robust error handling
            error: None,
        });
    });
    // Return immediately, scan happens in background
}

#[command]
async fn delete_items(paths: Vec<String>) -> Result<Vec<String>, String> {
    let mut deleted_paths = Vec::new();
    let mut errors = Vec::new();

    for path_str in paths {
        let path = Path::new(&path_str);
        if path.exists() {
            if path.is_dir() {
                match fs::remove_dir_all(path) {
                    Ok(_) => deleted_paths.push(path_str.clone()),
                    Err(e) => errors.push(format!("Failed to delete directory {}: {}", path_str, e)),
                }
            } else {
                match fs::remove_file(path) {
                    Ok(_) => deleted_paths.push(path_str.clone()),
                    Err(e) => errors.push(format!("Failed to delete file {}: {}", path_str, e)),
                }
            }
        } else {
            errors.push(format!("Path not found: {}", path_str));
        }
    }

    if errors.is_empty() {
        Ok(deleted_paths)
    } else {
        Err(errors.join(", "))
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            select_folder,
            scan_folder,
            delete_items,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
