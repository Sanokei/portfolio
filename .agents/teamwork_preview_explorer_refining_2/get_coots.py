import subprocess

def get_year(project_name):
    # Try S-search
    cmd = ["git", "log", "-S", project_name, "--pretty=format:%ad", "--date=format:%Y"]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode("utf-8").strip()
        if out:
            lines = [l for l in out.split("\n") if l]
            return lines[-1]
    except Exception:
        pass
    
    # Try grep in message
    cmd = ["git", "log", f"--grep={project_name}", "--pretty=format:%ad", "--date=format:%Y"]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode("utf-8").strip()
        if out:
            lines = [l for l in out.split("\n") if l]
            return lines[-1]
    except Exception:
        pass
    
    # Try case-insensitive or partial match
    partial = "Bug Squasher"
    cmd = ["git", "log", "-S", partial, "--pretty=format:%ad", "--date=format:%Y"]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode("utf-8").strip()
        if out:
            lines = [l for l in out.split("\n") if l]
            return lines[-1]
    except Exception:
        pass
        
    return "Not Found"

print("Coot's Bug Squasher year:", get_year("Coot's Bug Squasher"))
