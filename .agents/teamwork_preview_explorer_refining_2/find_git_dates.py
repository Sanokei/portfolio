import os
import subprocess

def get_first_commit(repo_path):
    try:
        # Run git log reverse to get first commit date
        out = subprocess.check_output(
            ["git", "-C", repo_path, "log", "--reverse", "--format=%cd", "--date=short"],
            stderr=subprocess.DEVNULL
        )
        lines = out.decode("utf-8", errors="ignore").strip().split("\n")
        if lines and lines[0]:
            return lines[0]
    except Exception as e:
        pass
    return None

start_dir = "c:\\Users\\wkeif\\Documents"
found_repos = {}

print("Scanning for git repositories...")
for root, dirs, files in os.walk(start_dir):
    if ".git" in dirs:
        repo_path = root
        repo_name = os.path.basename(repo_path)
        date = get_first_commit(repo_path)
        if date:
            print(f"{repo_name}: {date} ({repo_path})")
            found_repos[repo_name] = date
        # Don't recurse deeper into this git repo
        dirs.remove(".git")

print("\nScan completed.")
