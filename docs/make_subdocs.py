import os, subprocess, shutil, re, glob

repos = {
    "MotionDataViewer": "https://github.com/dlp3d-ai/dlp3d_MotionDataViewer.git",
    "orchestrator": "https://github.com/dlp3d-ai/orchestrator.git",
    "web_backend": "https://github.com/dlp3d-ai/web_backend.git",
    "speech2motion": "https://github.com/dlp3d-ai/speech2motion.git",
    "audio2face": "https://github.com/dlp3d-ai/audio2face.git",
}

docs_dir = os.path.dirname(__file__)
base_dir = os.path.join(docs_dir, "_subrepos")
os.makedirs(base_dir, exist_ok=True)

def fix_static_paths_in_file(file_path, language_dir, subrepo_name):
    """
    Replace the /_static/ paths in the file with relative paths, and automatically add the subrepo name
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    file_rel_path = os.path.relpath(file_path, language_dir)
    depth = file_rel_path.count(os.sep)
    
    if depth > 0:
        path_prefix = '../' * depth + '_static/'
    else:
        path_prefix = '_static/'
    
    def replace_path(match):
        old_path = match.group(1)
        
        if old_path.startswith('_static/'):
            if hasattr(str, 'removeprefix'):
                rel_path = old_path.removeprefix('_static/')
            else:
                rel_path = old_path[8:]
        else:
            rel_path = old_path
        
        if not rel_path.startswith(subrepo_name + '/'):
            rel_path = subrepo_name + '/' + rel_path
        
        new_path = path_prefix + rel_path
        return f'src="{new_path}"'
    
    content = re.sub(r'src="(_static/[^"]+)"', replace_path, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for name, url in repos.items():
    repo_dir = os.path.join(base_dir, name)
    if not os.path.exists(repo_dir):
        subprocess.run(["git", "clone", url, repo_dir])
    else:
        subprocess.run(["git", "-C", repo_dir, "pull"])
    languages = ["en", "zh-cn"]
    for language in languages:
        src_dir = os.path.join(repo_dir, "docs", language)
        tgt_dir = os.path.join(docs_dir, language, "_subrepos", name)
        if os.path.exists(tgt_dir):
            shutil.rmtree(tgt_dir)
        if not os.path.exists(src_dir):
            print(f"📘 {src_dir} not found")
            continue
        shutil.copytree(src_dir, tgt_dir)
        
        language_dir = os.path.join(docs_dir, language)
        for md_file in glob.glob(os.path.join(tgt_dir, "**/*.md"), recursive=True):
            fix_static_paths_in_file(md_file, language_dir, name)

        src_static = os.path.join(repo_dir, "docs", "_static")
        if os.path.exists(src_static):
            tgt_static = os.path.join(docs_dir, "_static", name)
            if os.path.exists(tgt_static):
                shutil.rmtree(tgt_static)
            shutil.copytree(src_static, tgt_static)