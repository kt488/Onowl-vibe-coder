import os
import time

# Watch the src directory and subdirectories for .js files containing JSX
WATCH_DIR = './src'
JSX_PATTERN = '<div'  # Simple check for JSX presence

def check_and_rename(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if JSX_PATTERN in content:
                print(f"Detected JSX in {file_path}. Renaming to .jsx...")
                new_path = file_path.replace('.js', '.jsx')
                os.rename(file_path, new_path)
                print(f"Renamed {file_path} to {new_path}")
    except Exception as e:
        print(f"Error checking {file_path}: {e}")

def watch():
    print(f"Watching {WATCH_DIR} for JSX-in-JS files...")
    while True:
        for root, dirs, files in os.walk(WATCH_DIR):
            for file in files:
                if file.endswith('.js'):
                    check_and_rename(os.path.join(root, file))
        time.sleep(5) # Poll every 5 seconds

if __name__ == "__main__":
    watch()
