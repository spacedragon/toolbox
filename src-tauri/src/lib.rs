use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Emitter;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
struct FileSystemItem {
    path: String,
    name: String,
    size: u64,
    #[serde(rename = "isDirectory")]
    is_directory: bool,
    children: Option<Vec<FileSystemItem>>,
}

#[derive(Debug, Clone, Serialize)]
struct ScanProgress {
    #[serde(rename = "currentPath")]
    current_path: String,
    #[serde(rename = "filesScanned")]
    files_scanned: u32,
    #[serde(rename = "totalSize")]
    total_size: u64,
    #[serde(rename = "isComplete")]
    is_complete: bool,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_available_disks() -> Result<Vec<String>, String> {
    let mut disks = Vec::new();
    
    #[cfg(target_os = "windows")]
    {
        for letter in b'A'..=b'Z' {
            let drive = format!("{}:\\", letter as char);
            if Path::new(&drive).exists() {
                disks.push(drive);
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        disks.push("/".to_string());
        if Path::new("/Volumes").exists() {
            if let Ok(entries) = fs::read_dir("/Volumes") {
                for entry in entries.flatten() {
                    if let Ok(name) = entry.file_name().into_string() {
                        disks.push(format!("/Volumes/{}", name));
                    }
                }
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        disks.push("/".to_string());
        if Path::new("/media").exists() {
            if let Ok(entries) = fs::read_dir("/media") {
                for entry in entries.flatten() {
                    if let Ok(name) = entry.file_name().into_string() {
                        disks.push(format!("/media/{}", name));
                    }
                }
            }
        }
        if Path::new("/mnt").exists() {
            if let Ok(entries) = fs::read_dir("/mnt") {
                for entry in entries.flatten() {
                    if let Ok(name) = entry.file_name().into_string() {
                        disks.push(format!("/mnt/{}", name));
                    }
                }
            }
        }
    }
    
    Ok(disks)
}

#[tauri::command]
async fn scan_directory(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<Vec<FileSystemItem>, String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        return Err("Path does not exist".to_string());
    }
    
    let mut items = Vec::new();
    let mut files_scanned = 0u32;
    let mut total_size = 0u64;
    
    // First pass: collect all items
    for entry in WalkDir::new(&path)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
        .skip(1) // Skip the root directory itself
    {
        let path = entry.path();
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        
        files_scanned += 1;
        
        let size = if metadata.is_dir() {
            calculate_dir_size(path)?
        } else {
            metadata.len()
        };
        
        total_size += size;
        
        let item = FileSystemItem {
            path: path.display().to_string(),
            name: path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string(),
            size,
            is_directory: metadata.is_dir(),
            children: None,
        };

        // Emit the discovered item immediately
        let _ = app_handle.emit("scan-item", &item);

        // Emit progress every 20 files for more frequent updates
        if files_scanned % 20 == 0 {
            let progress = ScanProgress {
                current_path: path.display().to_string(),
                files_scanned,
                total_size,
                is_complete: false,
            };
            let _ = app_handle.emit("scan-progress", progress);
        }
        
        items.push(item);
    }
    
    // Emit final progress
    let progress = ScanProgress {
        current_path: "Scan complete".to_string(),
        files_scanned,
        total_size,
        is_complete: true,
    };
    let _ = app_handle.emit("scan-progress", progress);
    
    Ok(items)
}

fn calculate_dir_size(path: &Path) -> Result<u64, String> {
    let mut size = 0u64;
    
    for entry in WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if let Ok(metadata) = entry.metadata() {
            if metadata.is_file() {
                size += metadata.len();
            }
        }
    }
    
    Ok(size)
}

#[tauri::command]
async fn delete_items(paths: Vec<String>) -> Result<(), String> {
    for path_str in paths {
        let path = Path::new(&path_str);
        
        if !path.exists() {
            continue;
        }
        
        if path.is_dir() {
            fs::remove_dir_all(path)
                .map_err(|e| format!("Failed to delete directory {}: {}", path_str, e))?;
        } else {
            fs::remove_file(path)
                .map_err(|e| format!("Failed to delete file {}: {}", path_str, e))?;
        }
    }
    
    Ok(())
}

#[tauri::command]
fn cancel_scan() {
    // In a real implementation, we would set a flag to stop the scan
    // For now, this is a placeholder
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_available_disks,
            scan_directory,
            delete_items,
            cancel_scan
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
