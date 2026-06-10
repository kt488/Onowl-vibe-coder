import os
import sys

def interactive_rename():
    print("--- Interactive File/Folder Renamer ---")
    
    while True:
        old_path = input("Enter the current path of the file/folder: ").strip()
        if not old_path:
            print("Path cannot be empty.")
            continue
        if not os.path.exists(old_path):
            print(f"Error: Path '{old_path}' does not exist.")
            continue
        break
        
    new_path = input("Enter the new name or full path: ").strip()
    if not new_path:
        print("New path cannot be empty.")
        sys.exit(1)
        
    try:
        os.rename(old_path, new_path)
        print(f"Successfully renamed '{old_path}' to '{new_path}'")
    except Exception as e:
        print(f"Error renaming: {e}")
        sys.exit(1)

if __name__ == "__main__":
    interactive_rename()
